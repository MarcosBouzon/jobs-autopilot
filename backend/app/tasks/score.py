import asyncio
import logging

from bson import ObjectId

from app.agents.scorer import score_job as agent_score_job
from app.celery_app import celery
from app.models.job import JobPost
from app.models.settings import SETTINGS_DOC_ID, Settings
from app.tasks.taylor import taylor
from app.tasks.utils import get_task_db, task_lock

logger = logging.getLogger(__name__)


@celery.task
def score_job(job: dict) -> dict[str, str]:  # type: ignore[type-arg]
    """Score a job posting using an LLM.

    Args:
        job: Job document dict (with string `_id`).

    Returns:
        Dict with task result status and job_id.
    """

    job_post = JobPost.model_validate(job)

    async def _run() -> dict[str, str]:
        result = await agent_score_job(job_post)
        if result is None:
            return {"status": "no_llm", "job_id": job_post.id or ""}

        db = get_task_db()
        await db.jobs.update_one(
            {"_id": ObjectId(job_post.id)},
            {
                "$set": {
                    "score": result.score,
                    "keywords": result.keywords,
                    "reasoning": result.reasoning,
                }
            },
        )

        doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
        settings = Settings.model_validate(doc) if doc else Settings()

        if result.score >= settings.config.min_score:
            job_post.score = result.score
            job_post.keywords = result.keywords
            job_post.reasoning = result.reasoning
            taylor.delay(job=job_post.model_dump(mode="json"))

        return {"status": "done", "job_id": job_post.id or ""}

    return asyncio.run(_run())


@celery.task
def score_jobs() -> dict[str, object]:  # type: ignore[type-arg]
    """Retrieve unscored jobs and dispatch a score task for each.

    Queries all jobs with no score or a score of 0.0 and dispatches
    score_job for each.

    Returns:
        Dict with dispatched job IDs.
    """

    with task_lock("score_jobs") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> dict[str, object]:
            db = get_task_db()

            cursor = db.jobs.find(
                {"$or": [{"score": {"$exists": False}}, {"score": 0.0}]}
            )
            jobs = [{**doc, "_id": str(doc["_id"])} async for doc in cursor]
            logger.info("Dispatching score tasks for %d jobs", len(jobs))

            for job in jobs:
                score_job.delay(job=job)

        return asyncio.run(_run())
