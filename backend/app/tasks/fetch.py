import asyncio
import logging

from app.celery_app import celery
from app.scrappers import Scrapper
from app.scrappers.hiringcafe import HiringCafe
from app.scrappers.indeed import Indeed
from app.scrappers.linkedin import LinkedIn
from app.tasks.utils import task_lock

JOB_BOARDS = {
    "indeed": Indeed,
    "linkedin": LinkedIn,
    "hiringcafe": HiringCafe,
}
logger = logging.getLogger(__name__)


@celery.task
def fetch_jobs_for_board(board: str) -> dict:
    """Fetch job postings from a single job board and store them in the database.

    Args:
        board: Job board key (e.g. "indeed", "linkedin").

    Returns:
        Dict with task result status and board name.
    """

    async def _run() -> dict:
        try:
            job_board: Scrapper = await JOB_BOARDS[board].create()
        except KeyError:
            logger.error("Unknown job board: %s", board)
            return {"status": "error", "message": f"Unknown job board: {board}"}
        except Exception as e:
            logger.error("Error initializing scrapper for %s: %s", board, str(e))
            return {
                "status": "error",
                "message": f"Error initializing scrapper for {board}: {str(e)}",
            }

        jobs = await job_board.fetch_jobs()
        if not jobs:
            logger.warning("No jobs returned from %s", board.capitalize())
            return {"status": "done", "jobs": []}

        logger.info("Fetched %d jobs from %s", len(jobs), board.capitalize())
        return {"status": "done", "jobs": jobs}

    return asyncio.run(_run())


@celery.task
def fetch_jobs():
    """Dispatch a fetch task for each configured job board.

    Returns:
        Dict with dispatched board names.
    """

    with task_lock("fetch_jobs") as acquired:
        if not acquired:
            logger.info("fetch_jobs already running, skipping")
            return {"status": "skipped"}

        boards = ", ".join(b.capitalize() for b in JOB_BOARDS)
        logger.info("Fetching jobs for: %s", boards)

        for board in JOB_BOARDS:
            fetch_jobs_for_board.delay(board=board)
            # fetch_jobs_for_board(board=board)

        return {"dispatched": list(JOB_BOARDS.keys())}
