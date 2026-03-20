import asyncio
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.celery_app import celery
from app.tasks.utils import get_task_db, task_lock

logger = logging.getLogger(__name__)

CLEANUP_MAX_AGE_DAYS = 1
DELETE_MAX_AGE_DAYS = 10


@celery.task
def delete_old_jobs() -> dict[str, object]:
    """Delete non-applied jobs older than MAX_AGE_DAYS and their resumes."""

    with task_lock("delete_old_jobs") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> int:
            db = get_task_db()
            cutoff = datetime.now(UTC) - timedelta(days=DELETE_MAX_AGE_DAYS)

            cursor = db.jobs.find(
                {
                    "applied": False,
                    "$or": [
                        {"autopilot_created": {"$lte": cutoff}},
                        {"autopilot_created": {"$exists": False}},
                    ],
                }
            )

            deleted = 0
            async for doc in cursor:
                resume_path = doc.get("resume_path", "")
                if resume_path:
                    path = Path(resume_path)
                    if path.exists():
                        path.unlink()
                        logger.info("Deleted resume: %s", resume_path)

                await db.jobs.delete_one({"_id": doc["_id"]})
                deleted += 1

            logger.info("Cleaned up %d old non-applied jobs", deleted)
            return deleted

        count = asyncio.run(_run())
        return {"status": "done", "deleted": count}


@celery.task
def cleanup_old_jobs() -> dict[str, object]:
    """Soft-delete non-applied jobs older than CLEANUP_MAX_AGE_DAYS."""

    with task_lock("cleanup_old_jobs") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> int:
            db = get_task_db()
            cutoff = datetime.now(UTC) - timedelta(days=CLEANUP_MAX_AGE_DAYS)

            result = await db.jobs.update_many(
                {
                    "applied": False,
                    "deleted": {"$ne": True},
                    "$or": [
                        {"autopilot_created": {"$lte": cutoff}},
                        {"autopilot_created": {"$exists": False}},
                    ],
                },
                {"$set": {"deleted": True}},
            )

            logger.info("Soft-deleted %d old non-applied jobs", result.modified_count)
            return result.modified_count

        count = asyncio.run(_run())
        return {"status": "done", "cleaned": count}
