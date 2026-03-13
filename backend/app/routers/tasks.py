from pathlib import Path

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import config
from app.database import DB
from app.tasks.apply import apply_job
from app.tasks.score import score_job

router = APIRouter(tags=["Tasks"])


def _parse_object_id(jid: str) -> ObjectId:
    """Parse a string into a bson ObjectId, raising HTTP 422 on invalid input."""

    try:
        return ObjectId(jid)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid job id: {jid!r}",
        ) from exc


@router.post("/score/{jid}/")
async def initiate_score(jid: str, db: DB) -> dict[str, str]:
    """Dispatch a Celery score task for the given job ID."""

    oid = _parse_object_id(jid)
    job = await db.jobs.find_one({"_id": oid})

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    task = score_job.delay(job=job)

    return {"task_id": task.id}


@router.post("/apply/{jid}/")
async def initiate_apply(jid: str, db: DB) -> dict[str, str]:
    """Dispatch a Celery apply task for the given job ID."""

    oid = _parse_object_id(jid)
    job = await db.jobs.find_one({"_id": oid})

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    task = apply_job.delay(job=job)

    return {"task_id": task.id}
