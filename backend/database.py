"""
database.py — SQLAlchemy async engine + session
================================================
Reads DATABASE_URL from the environment.

Railway injects this automatically when you link a Postgres plugin
to your service.  For local dev, add it to backend/.env:

  DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/nqwest

Note: SQLAlchemy requires the +asyncpg driver prefix.
If Railway gives you a plain postgres:// URL, replace it with
postgresql+asyncpg://.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

_raw_url = os.getenv("DATABASE_URL", "")
if not _raw_url:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Add it to backend/.env or your Railway environment variables."
    )

# Railway (and some other platforms) may provide postgres:// — normalise it
DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,        # set True to log all SQL during development
    pool_pre_ping=True,  # drop stale connections automatically
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Shared declarative base — all ORM models inherit from this."""
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency — yields a DB session per request and
    ensures it is closed even if the handler raises.

    Usage:
        @app.get("/something")
        async def route(db: Annotated[AsyncSession, Depends(get_db)]):
            ...
    """
    async with AsyncSessionLocal() as session:
        yield session
