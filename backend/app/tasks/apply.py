import asyncio
import logging

from celery import Task

from app.celery_app import celery
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db, publish_message, task_lock

logger = logging.getLogger(__name__)


async def _apply(job: dict) -> dict[str, str]:
    job_post = JobPost.model_validate(job)

    # TODO: implement apply automation logic
    # 1. Use Playwright to navigate to job application page, fill application form, and
    # upload tailored resume
    # 2. Mark job as applied in the database

    return {"status": "done", "job_id": job_post.id}


@celery.task
def apply_job(job: dict) -> dict[str, str]:  # type: ignore[type-arg]
    """Automate applying to a job posting using Playwright.

    Args:
        job: Job document dict (with string `_id`).

    Returns:
        Dict with task result status and job_id.
    """

    return asyncio.run(_apply(job))


@celery.task
def apply_jobs() -> dict[str, object]:  # type: ignore[type-arg]
    """Retrieve high-scoring jobs and dispatch an apply task for each.

    Reads `min_score` from settings.config, queries all jobs with
    score >= min_score, and dispatches apply_job for each.

    Returns:
        Dict with dispatched job IDs.
    """

    with task_lock("apply_jobs") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> dict[str, object]:
            db = get_task_db()

            doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
            settings = Settings.model_validate(doc)
            min_score: float = 0.0

            if settings:
                min_score = float(settings.config.min_score)

            cursor = db.jobs.find(
                {
                    "score": {"$gte": min_score},
                    "resume_path": {"$ne": ""},
                    "applied": False,
                }
            )
            jobs = [{**doc, "_id": str(doc["_id"])} async for doc in cursor]

            msg = "Dispatching apply tasks for %d jobs with score >= %.2f"
            logger.info(msg, len(jobs), min_score)

            for job in jobs:
                apply_job.delay(job=job)

        asyncio.run(_run())

        publish_message(
            "reload",
            {
                "title": "Applied Jobs",
                "message": "Newly applied jobs are available for review.",
                "success": True,
            },
        )
        
        return {"status": "dispatched"}
