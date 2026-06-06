"""
Nqwest FastAPI Backend
======================
Google OAuth 2.0 ID-token verification endpoint.

Setup
-----
pip install fastapi uvicorn google-auth python-dotenv

Run
---
uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel

# ─────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────
load_dotenv()  # reads .env in the backend/ directory

GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
if not GOOGLE_CLIENT_ID:
    raise RuntimeError(
        "GOOGLE_CLIENT_ID is not set. "
        "Add it to backend/.env or your environment variables."
    )

# Allowed origins – extend for production domains
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ─────────────────────────────────────────────
#  App
# ─────────────────────────────────────────────
app = FastAPI(title="Nqwest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
#  Schemas
# ─────────────────────────────────────────────
class GoogleTokenRequest(BaseModel):
    """Payload sent by the React frontend after Google sign-in."""
    token: str  # Google ID token (credential from @react-oauth/google)


class UserInfo(BaseModel):
    """Sanitised user data returned to the frontend."""
    sub: str          # Google's stable user ID
    name: str
    email: str
    email_verified: bool
    picture: str | None = None


class AuthResponse(BaseModel):
    message: str
    user: UserInfo


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────
@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    """Quick liveness probe."""
    return {"status": "ok"}


@app.post(
    "/auth/google",
    response_model=AuthResponse,
    tags=["auth"],
    summary="Verify a Google ID token and return the user profile",
)
async def google_auth(body: GoogleTokenRequest) -> Any:
    """
    Receives the ID token issued by Google Sign-In, verifies it
    cryptographically against Google's public keys, and returns the
    user's profile information.

    Steps
    -----
    1. Decode & verify the ID token signature using google-auth library.
    2. Confirm the token was issued for *our* client ID (audience check).
    3. Confirm the email is verified by Google.
    4. Return safe user data to the frontend.
    """
    try:
        id_info: dict[str, Any] = id_token.verify_oauth2_token(
            id_token=body.token,
            request=google_requests.Request(),
            audience=GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,  # tolerates minor clock drift
        )
    except ValueError as exc:
        # Token invalid, expired, or tampered
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {exc}",
        ) from exc

    # Extra safety: reject unverified email addresses
    if not id_info.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google account email is not verified.",
        )

    user = UserInfo(
        sub=id_info["sub"],
        name=id_info.get("name", ""),
        email=id_info["email"],
        email_verified=id_info["email_verified"],
        picture=id_info.get("picture"),
    )

    # ── TODO: persist / look up user in your database here ──
    # e.g. await db.upsert_user(user)

    return AuthResponse(message="Authentication successful", user=user)
