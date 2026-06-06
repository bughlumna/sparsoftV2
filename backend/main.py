"""
Nqwest FastAPI Backend
======================
Endpoints:
  POST /auth/google   — verify Google ID token, return user profile
  GET  /features      — return feature list  *** requires valid Bearer token ***

Auth flow
---------
Every protected route uses the `verified_user` FastAPI dependency.
It reads the `Authorization: Bearer <google-id-token>` header,
re-verifies it cryptographically with Google, and injects the user
info into the route handler.  No server-side session is needed —
Google's public keys do the work on every request.

Run
---
uvicorn main:app --reload --port 8000
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

# ─────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────
load_dotenv()

GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
if not GOOGLE_CLIENT_ID:
    raise RuntimeError(
        "GOOGLE_CLIENT_ID is not set. "
        "Add it to backend/.env or your environment variables."
    )

ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ─────────────────────────────────────────────
#  App
# ─────────────────────────────────────────────
app = FastAPI(title="Nqwest API", version="1.2.0")

# IMPORTANT: when allow_credentials=True you MUST list headers explicitly.
# Using allow_headers=["*"] with credentials causes browsers to reject the
# preflight response — the Authorization header never reaches the route.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"],
)

# HTTPBearer extracts the token from "Authorization: Bearer <token>"
# auto_error=True → returns 403 automatically if header is missing
bearer_scheme = HTTPBearer(auto_error=True)


# ─────────────────────────────────────────────
#  Shared auth dependency
# ─────────────────────────────────────────────
def _verify_google_token(raw_token: str) -> dict[str, Any]:
    """
    Verify a Google ID token and return its decoded claims.
    Raises HTTP 401 on any failure.
    """
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
    """
    FastAPI dependency — inject into any route that requires authentication.
    Returns the decoded token claims (sub, email, name, picture, …).

    Usage:
        @app.get("/protected")
        async def route(user: Annotated[dict, Depends(verified_user)]):
            ...
    """
    return _verify_google_token(credentials.credentials)


# ─────────────────────────────────────────────
#  Schemas
# ─────────────────────────────────────────────
class GoogleTokenRequest(BaseModel):
    token: str


class UserInfo(BaseModel):
    sub: str
    name: str
    email: str
    email_verified: bool
    picture: str | None = None


class AuthResponse(BaseModel):
    message: str
    user: UserInfo


class Feature(BaseModel):
    id: str
    name: str
    description: str | None = None


class FeaturesResponse(BaseModel):
    features: list[Feature]


# ─────────────────────────────────────────────
#  Feature registry  (swap for DB query later)
# ─────────────────────────────────────────────
FEATURES: list[Feature] = [
    Feature(id="feature_1", name="Feature 1", description="Core module alpha"),
    Feature(id="feature_2", name="Feature 2", description="Core module beta"),
    Feature(id="feature_3", name="Feature 3", description="Core module gamma"),
    Feature(id="feature_4", name="Feature 4", description="Core module delta"),
]


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
    summary="Verify a Google ID token and return the user profile",
)
async def google_auth(body: GoogleTokenRequest) -> Any:
    """
    Login endpoint — called once by the browser after Google sign-in.
    The frontend stores the raw ID token and sends it as a Bearer
    header on all subsequent calls.
    """
    claims = _verify_google_token(body.token)

    user = UserInfo(
        sub=claims["sub"],
        name=claims.get("name", ""),
        email=claims["email"],
        email_verified=claims["email_verified"],
        picture=claims.get("picture"),
    )

    # TODO: upsert user into your database here

    return AuthResponse(message="Authentication successful", user=user)


@app.get(
    "/features",
    response_model=FeaturesResponse,
    tags=["features"],
    summary="Return the feature list — requires valid Bearer token",
)
async def get_features(
    # ← This single line protects the entire endpoint.
    # FastAPI verifies the Bearer header and injects the user claims.
    # Remove it and the route becomes public again.
    current_user: Annotated[dict, Depends(verified_user)],
) -> FeaturesResponse:
    """
    Returns the dashboard feature buttons.
    Protected: caller must supply a valid Google ID token in the
    Authorization header.  A 401 is returned for missing/expired tokens.

    `current_user` contains the verified claims — ready for per-user
    entitlement filtering when you connect a database.
    """
    # Future: filter FEATURES by current_user["sub"] from your DB
    return FeaturesResponse(features=FEATURES)
