from collections.abc import Generator
from contextlib import contextmanager

import redis
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import config

# TTL long enough to cover the longest expected task run (1 hour)
_LOCK_TTL_MS = 60 * 60 * 1000


def get_task_db() -> AsyncIOMotorDatabase:  # type: ignore[type-arg]
    """Create a standalone Motor client for use in Celery tasks."""
    client: AsyncIOMotorClient = AsyncIOMotorClient(config.mongo_url)  # type: ignore[type-arg]
    return client[config.mongo_db]


@contextmanager
def task_lock(task_name: str) -> Generator[bool, None, None]:
    """Yield True if the lock was acquired, False if another instance is already running.

    Uses Redis SET NX with a TTL so the lock is always released even if the worker crashes.

    Args:
        task_name: Unique name used as the Redis lock key.
    """

    client = redis.from_url(config.celery_broker_url)
    lock_key = f"task_lock:{task_name}"
    acquired = client.set(lock_key, "1", nx=True, px=_LOCK_TTL_MS)
    try:
        yield bool(acquired)
    finally:
        if acquired:
            client.delete(lock_key)
