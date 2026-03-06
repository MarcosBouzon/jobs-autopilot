import asyncio
import logging

from celery import Task

from app.celery_app import celery
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.utils import get_task_db, task_lock

logger = logging.getLogger(__name__)


@celery.task
def apply_job(job: dict) -> dict[str, str]:  # type: ignore[type-arg]
    """Automate applying to a job posting using Playwright.

    Args:
        job: Job document dict (with string `_id`).

    Returns:
        Dict with task result status and job_id.
    """
    job_post = JobPost.model_validate(job)

    # TODO: implement apply automation logic
    # 1.If job don't have a resume_path value:
    #   1.1. Taylor resume using LLM
    #   1.2. Save tailored resume to the resumes directory with a unique name and path
    #   1.3. Update the resume_path field in the job document in the database with the new tailored resume path
    # 2. Use Playwright to navigate to job application page, fill application form, and upload tailored resume
    # 3. Mark job as applied in the database

    return {"status": "done", "job_id": job_post.id or ""}


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

            settings: Settings = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
            min_score: float = 0.0
            if settings:
                min_score = float(settings.config.min_score)

            cursor = db.jobs.find({"score": {"$gte": min_score}, "applied": False})
            jobs = [{**doc, "_id": str(doc["_id"])} async for doc in cursor]

            msg = "Dispatching apply tasks for %d jobs with score >= %.2f"
            logger.info(msg, len(jobs), min_score)

            for job in jobs:
                apply_job.delay(job=job)

        return asyncio.run(_run())
