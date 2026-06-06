"""
crud.py — Database operations (Create / Read / Update / Delete)
===============================================================
All SQL interactions live here.  Routes in main.py call these
functions — no raw SQL or ORM queries appear in the route handlers.

Functions
---------
upsert_user          — create or update a user row on login
get_user_features    — return the feature list for a given user
save_feature1_result — persist one Feature 1 calculation
get_feature1_history — retrieve past Feature 1 results for a user
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Feature1Result, User, UserFeature

# ── All features available in the system ──────────────────────────────────────
# Add new feature IDs here as the app grows.
ALL_FEATURE_IDS: list[str] = [
    "feature_1",
    "feature_2",
    "feature_3",
    "feature_4",
]


# ─────────────────────────────────────────────
#  Users
# ─────────────────────────────────────────────
async def upsert_user(
    db: AsyncSession,
    *,
    google_sub: str,
    email: str,
    name: str,
    picture: str | None,
    email_verified: bool,
) -> User:
    """
    Insert a new user or update their profile if they already exist.
    Also ensures every feature entitlement row exists (idempotent).

    Called on every successful Google login.
    """
    # Try to find existing user by Google sub (stable across renames)
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()

    if user is None:
        # First login — create the user row
        user = User(
            google_sub=google_sub,
            email=email,
            name=name,
            picture=picture,
            email_verified=email_verified,
        )
        db.add(user)
        await db.flush()   # get user.id without committing yet

        # Grant access to all features by default
        for fid in ALL_FEATURE_IDS:
            db.add(UserFeature(user_id=user.id, feature_id=fid))
    else:
        # Returning user — refresh mutable profile fields
        user.email          = email
        user.name           = name
        user.picture        = picture
        user.email_verified = email_verified
        user.last_seen      = datetime.now(timezone.utc)

        # Ensure any newly added features are granted (won't duplicate
        # existing rows thanks to the UniqueConstraint)
        existing_result = await db.execute(
            select(UserFeature.feature_id).where(UserFeature.user_id == user.id)
        )
        existing_ids = {row[0] for row in existing_result.all()}
        for fid in ALL_FEATURE_IDS:
            if fid not in existing_ids:
                db.add(UserFeature(user_id=user.id, feature_id=fid))

    await db.commit()
    await db.refresh(user)
    return user


# ─────────────────────────────────────────────
#  Feature entitlements
# ─────────────────────────────────────────────
async def get_user_features(db: AsyncSession, *, google_sub: str) -> list[str]:
    """
    Return the list of feature IDs this user is entitled to see.
    Returns [] if the user doesn't exist yet (shouldn't happen in practice
    since upsert_user is called on every login).
    """
    result = await db.execute(
        select(UserFeature.feature_id)
        .join(User, User.id == UserFeature.user_id)
        .where(User.google_sub == google_sub)
        .order_by(UserFeature.feature_id)
    )
    return [row[0] for row in result.all()]


# ─────────────────────────────────────────────
#  Feature 1 results
# ─────────────────────────────────────────────
async def save_feature1_result(
    db: AsyncSession,
    *,
    google_sub: str,
    alpha: float,
    beta: float,
    sigma_sqr: float,
    mu_0: float,
    mu_1: float,
    test_type: int,
    result: float,
) -> Feature1Result:
    """
    Persist one Feature 1 calculation run.
    Looks up the internal user ID from the google_sub claim.
    """
    user_result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise ValueError(f"No user found for google_sub={google_sub!r}")

    row = Feature1Result(
        user_id=user.id,
        alpha=alpha,
        beta=beta,
        sigma_sqr=sigma_sqr,
        mu_0=mu_0,
        mu_1=mu_1,
        test_type=test_type,
        result=result,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_feature1_history(
    db: AsyncSession,
    *,
    google_sub: str,
    limit: int = 20,
) -> list[Feature1Result]:
    """
    Return the most recent `limit` Feature 1 results for this user,
    newest first.
    """
    result = await db.execute(
        select(Feature1Result)
        .join(User, User.id == Feature1Result.user_id)
        .where(User.google_sub == google_sub)
        .order_by(Feature1Result.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
