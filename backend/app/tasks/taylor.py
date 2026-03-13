import asyncio
import logging

from bson import ObjectId

from app.agents.taylorer import taylor_resume
from app.celery_app import celery
from app.models.job import JobPost
from app.tasks.utils import get_task_db, task_lock

logger = logging.getLogger(__name__)


async def _taylor(job: dict) -> dict[str, str]:
    job_post = JobPost.model_validate(job)
    result = await taylor_resume(job_post)
    if result is None:
        return {"status": "no_llm", "job_id": job_post.id or ""}

    # db = get_task_db()
    # await db.jobs.update_one(
    #     {"_id": ObjectId(job_post.id)},
    #     {"$set": {"resume_path": result.get("resume_path", "")}},
    # )

    return {"status": "done", "job_id": job_post.id or ""}


@celery.task
def taylor(job: dict) -> dict[str, str]:  # type: ignore[type-arg]
    """Use an LLM agent to rewrite the candidate's resume for a specific job.

    Args:
        job: Job document dict (with string `_id`).

    Returns:
        Dict with task result status and job_id.
    """

    return asyncio.run(_taylor(job))


@celery.task
def taylor_resumes() -> dict[str, object]:  # type: ignore[type-arg]
    """Taylor resumes for high-scoring jobs that haven't been taylored yet.

    Returns:
        dict[str, object]: Dict with dispatched job IDs.
    """

    with task_lock("taylor_resumes") as acquired:
        if not acquired:
            return {"status": "skipped"}

        async def _run() -> dict[str, object]:
            db = get_task_db()

            cursor = db.jobs.find(
                {
                    "$and": [
                        {"score": {"$exists": True}},
                        {"score": {"$gte": 7.0}},
                        {"resume_path": {"$eq": ""}},
                    ]
                }
            )
            jobs = [{**doc, "_id": str(doc["_id"])} async for doc in cursor]
            logger.info("Dispatching taylor tasks for %d jobs", len(jobs))

            for job in jobs[:3]:
                taylor.delay(job=job)
                # await _taylor(job)

        return asyncio.run(_run())
