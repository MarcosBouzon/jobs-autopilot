from pathlib import Path
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.celery_app import celery
from app.config import config
from app.database import get_db
from app.tasks.apply import apply_job
from app.tasks.score import score_job

router = APIRouter(tags=["Tasks"])


def _parse_object_id(id: str) -> ObjectId:
    """Parse a string into a bson ObjectId, raising HTTP 422 on invalid input."""
    try:
        return ObjectId(id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid job id: {id!r}",
        )


@router.post("/score/{id}/")
async def initiate_score(
    id: str,
    db: AsyncIOMotorDatabase[Any] = Depends(get_db),
) -> dict[str, str]:
    """Dispatch a Celery score task for the given job ID."""
    oid = _parse_object_id(id)
    doc = await db.jobs.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    task = score_job.delay(job_id=id)
    return {"task_id": task.id}


@router.post("/apply/{id}/")
async def initiate_apply(
    id: str,
    db: AsyncIOMotorDatabase[Any] = Depends(get_db),
) -> dict[str, str]:
    """Dispatch a Celery apply task for the given job ID."""
    oid = _parse_object_id(id)
    doc = await db.jobs.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    task = apply_job.delay(job_id=id)
    return {"task_id": task.id}


@router.post("/resume/")
async def upload_resume(file: UploadFile = File(...)) -> dict[str, str]:
    """Accept a PDF resume upload and save it to the resumes directory."""
    dest = Path(config.resumes_dir) / "user_resume.pdf"
    dest.parent.mkdir(parents=True, exist_ok=True)
    contents = await file.read()
    dest.write_bytes(contents)
    return {"path": str(dest)}
