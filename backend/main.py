"""
Nqwest FastAPI Backend  v2.0
============================
Endpoints
---------
  GET  /health        — liveness probe (no auth)
  POST /auth/google   — verify Google ID token, upsert user, return profile
  GET  /features      — return this user's entitled features  [auth required]
  POST /feature1      — run Feature 1 calculation, persist result [auth required]
  GET  /feature1/history — return past Feature 1 results for this user [auth required]

Auth
----
All protected routes use the `verified_user` FastAPI dependency which
re-verifies the Google ID token on every request (stateless — no sessions).

Database
--------
SQLAlchemy async + asyncpg driver.
Railway injects DATABASE_URL automatically when you link a Postgres plugin.
"""

from __future__ import annotations

import os
from typing import Any, Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import crud
from database import Base, engine, get_db
from models import Feature1Result  # noqa: F401 — referenced via Base.metadata
from utilities.calculate_type1 import calculateType1
from utilities.calculate_type2 import calculateType2

# ─────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────
load_dotenv()

GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
if not GOOGLE_CLIENT_ID:
    raise RuntimeError(
        "GOOGLE_CLIENT_ID is not set. "
        "Add it to backend/.env or your Railway environment variables."
    )

_extra_origins = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
]
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *_extra_origins,
]

# ─────────────────────────────────────────────
#  App + middleware
# ─────────────────────────────────────────────
app = FastAPI(title="Nqwest API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"],
)

bearer_scheme = HTTPBearer(auto_error=True)


# ─────────────────────────────────────────────
#  DB table creation on startup
# ─────────────────────────────────────────────
@app.on_event("startup")
async def create_tables() -> None:
    """
    Create all tables if they don't exist yet.
    Safe to run on every startup — won't touch existing tables.
    For production migrations use Alembic instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ─────────────────────────────────────────────
#  Auth dependency
# ─────────────────────────────────────────────
def _verify_google_token(raw_token: str) -> dict[str, Any]:
    try:
        claims: dict[str, Any] = id_token.verify_oauth2_token(
            id_token=raw_token,
            request=google_requests.Request(),
            audience=GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not claims.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google account email is not verified.",
        )
    return claims


def verified_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(bearer_scheme)],
) -> dict[str, Any]:
    """Inject into any route that requires authentication."""
    return _verify_google_token(credentials.credentials)


# ─────────────────────────────────────────────
#  Pydantic schemas
# ─────────────────────────────────────────────
class GoogleTokenRequest(BaseModel):
    token: str


class UserInfo(BaseModel):
    sub:            str
    name:           str
    email:          str
    email_verified: bool
    picture:        str | None = None


class AuthResponse(BaseModel):
    message: str
    user:    UserInfo


class Feature(BaseModel):
    id:          str
    name:        str
    description: str | None = None


class FeaturesResponse(BaseModel):
    features: list[Feature]


class Feature1Request(BaseModel):
    alpha:     float
    beta:      float
    sigma_sqr: float
    mu_0:      float
    mu_1:      float
    test_type: int        # 1 or 2


class Feature1Response(BaseModel):
    inputs:     Feature1Request
    result:     float
    saved_id:   int       # DB primary key of the saved result row


class Feature1HistoryItem(BaseModel):
    id:         int
    alpha:      float
    beta:       float
    sigma_sqr:  float
    mu_0:       float
    mu_1:       float
    test_type:  int
    result:     float
    created_at: str       # ISO-8601 string

    @classmethod
    def from_orm_row(cls, row: Feature1Result) -> "Feature1HistoryItem":
        return cls(
            id=row.id,
            alpha=row.alpha,
            beta=row.beta,
            sigma_sqr=row.sigma_sqr,
            mu_0=row.mu_0,
            mu_1=row.mu_1,
            test_type=row.test_type,
            result=row.result,
            created_at=row.created_at.isoformat(),
        )


class Feature1HistoryResponse(BaseModel):
    history: list[Feature1HistoryItem]


# ─────────────────────────────────────────────
#  Feature metadata map
#  (labels and descriptions live here — not in the DB)
# ─────────────────────────────────────────────
FEATURE_META: dict[str, Feature] = {
    "feature_1": Feature(id="feature_1", name="Feature 1", description="Core module alpha"),
    "feature_2": Feature(id="feature_2", name="Feature 2", description="Core module beta"),
    "feature_3": Feature(id="feature_3", name="Feature 3", description="Core module gamma"),
    "feature_4": Feature(id="feature_4", name="Feature 4", description="Core module delta"),
}


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────
@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/auth/google",
    response_model=AuthResponse,
    tags=["auth"],
    summary="Verify Google ID token, upsert user in DB, return profile",
)
async def google_auth(
    body: GoogleTokenRequest,
    db:   Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    claims = _verify_google_token(body.token)

    # Persist / refresh the user in the database
    await crud.upsert_user(
        db,
        google_sub=claims["sub"],
        email=claims["email"],
        name=claims.get("name", ""),
        picture=claims.get("picture"),
        email_verified=claims["email_verified"],
    )

    user = UserInfo(
        sub=claims["sub"],
        name=claims.get("name", ""),
        email=claims["email"],
        email_verified=claims["email_verified"],
        picture=claims.get("picture"),
    )
    return AuthResponse(message="Authentication successful", user=user)


@app.get(
    "/features",
    response_model=FeaturesResponse,
    tags=["features"],
    summary="Return this user's entitled features — auth required",
)
async def get_features(
    current_user: Annotated[dict, Depends(verified_user)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> FeaturesResponse:
    feature_ids = await crud.get_user_features(db, google_sub=current_user["sub"])
    features = [FEATURE_META[fid] for fid in feature_ids if fid in FEATURE_META]
    return FeaturesResponse(features=features)


@app.post(
    "/feature1",
    response_model=Feature1Response,
    tags=["features"],
    summary="Run Feature 1 calculation and persist result — auth required",
)
async def feature1(
    body:         Feature1Request,
    current_user: Annotated[dict, Depends(verified_user)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> Feature1Response:
    kwargs = dict(
        alpha=body.alpha,
        beta=body.beta,
        sigma_sqr=body.sigma_sqr,
        mu_0=body.mu_0,
        mu_1=body.mu_1,
    )

    if body.test_type == 1:
        result = calculateType1(**kwargs)
    elif body.test_type == 2:
        result = calculateType2(**kwargs)
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"test_type must be 1 or 2, got {body.test_type}",
        )

    # Persist the result
    saved = await crud.save_feature1_result(
        db,
        google_sub=current_user["sub"],
        result=result,
        **kwargs,
        test_type=body.test_type,
    )

    return Feature1Response(inputs=body, result=result, saved_id=saved.id)


@app.get(
    "/feature1/history",
    response_model=Feature1HistoryResponse,
    tags=["features"],
    summary="Return past Feature 1 results for this user — auth required",
)
async def feature1_history(
    current_user: Annotated[dict, Depends(verified_user)],
    db:           Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
) -> Feature1HistoryResponse:
    rows = await crud.get_feature1_history(
        db, google_sub=current_user["sub"], limit=limit
    )
    return Feature1HistoryResponse(
        history=[Feature1HistoryItem.from_orm_row(r) for r in rows]
    )
