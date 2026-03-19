import asyncio
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.celery_app import celery
from app.tasks.utils import get_task_db, task_lock

logger = logging.getLogger(__name__)

MAX_AGE_DAYS = 2


@celery.task
def cleanup_old_jobs() -> dict[str, object]:
    """Delete non-applied jobs older than MAX_AGE_DAYS and their resumes."""

    with task_lock("cleanup_old_jobs") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> int:
            db = get_task_db()
            cutoff = datetime.now(UTC) - timedelta(days=MAX_AGE_DAYS)

            cursor = db.jobs.find(
                {
                    "applied": False,
                    "autopilot_created": {"$lte": cutoff},
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
