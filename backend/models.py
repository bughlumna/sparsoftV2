"""
models.py — SQLAlchemy ORM table definitions
=============================================
Three tables:
  users            — one row per Google account, created on first login
  user_features    — which features each user is entitled to see
  feature1_results — full audit log of every Feature 1 calculation
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────
#  users
# ─────────────────────────────────────────────
class User(Base):
    """
    One row per Google account.
    Created (or updated) every time the user logs in via /auth/google.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Google's stable, unique identifier for this account
    google_sub: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    name:  Mapped[str] = mapped_column(String(256), nullable=False, default="")
    picture: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    feature_entitlements: Mapped[list[UserFeature]]   = relationship(back_populates="user", cascade="all, delete-orphan")
    feature1_results:     Mapped[list[Feature1Result]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


# ─────────────────────────────────────────────
#  user_features
# ─────────────────────────────────────────────
class UserFeature(Base):
    """
    Many-to-many join: which features a user is entitled to see.
    A row here means the user can see that feature button on the dashboard.

    Seed with all four features for every new user (see crud.upsert_user).
    Remove rows to revoke access without any code changes.
    """
    __tablename__ = "user_features"
    __table_args__ = (UniqueConstraint("user_id", "feature_id"),)

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:    Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feature_id: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "feature_1"

    user: Mapped[User] = relationship(back_populates="feature_entitlements")

    def __repr__(self) -> str:
        return f"<UserFeature user_id={self.user_id} feature={self.feature_id!r}>"


# ─────────────────────────────────────────────
#  feature1_results
# ─────────────────────────────────────────────
class Feature1Result(Base):
    """
    Full audit log of every Feature 1 calculation.
    Every call to POST /feature1 writes one row here.
    """
    __tablename__ = "feature1_results"

    id:      Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Inputs
    alpha:     Mapped[float] = mapped_column(Float, nullable=False)
    beta:      Mapped[float] = mapped_column(Float, nullable=False)
    sigma_sqr: Mapped[float] = mapped_column(Float, nullable=False)
    mu_0:      Mapped[float] = mapped_column(Float, nullable=False)
    mu_1:      Mapped[float] = mapped_column(Float, nullable=False)
    test_type: Mapped[int]   = mapped_column(Integer, nullable=False)

    # Output
    result: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    user: Mapped[User] = relationship(back_populates="feature1_results")

    def __repr__(self) -> str:
        return f"<Feature1Result id={self.id} user_id={self.user_id} result={self.result}>"
