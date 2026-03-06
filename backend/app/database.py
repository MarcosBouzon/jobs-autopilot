from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import Depends, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import config

_client: AsyncIOMotorClient | None = None  # type: ignore[type-arg]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage Motor client lifecycle tied to the FastAPI app."""
    global _client
    _client = AsyncIOMotorClient(config.mongo_url)
    db = _client[config.mongo_db]
    await db.jobs.create_index("url", unique=True)
    yield
    _client.close()


def get_db() -> AsyncIOMotorDatabase[Any]:
    """FastAPI dependency that returns the application database."""
    assert _client is not None, "Database client is not initialised"
    return _client[config.mongo_db]


DB = Annotated[AsyncIOMotorDatabase[Any], Depends(get_db)]
