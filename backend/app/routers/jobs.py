from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.models.job import JobPost

router = APIRouter(tags=["Jobs"])


def _parse_object_id(oid: str) -> ObjectId:
    """Parse a string into a bson ObjectId, raising HTTP 422 on invalid input."""

    try:
        return ObjectId(oid)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid job id: {oid!r}",
        ) from exc


@router.get("/jobs/", response_model=list[JobPost])
async def list_jobs(
    applied: bool | None = None, db: AsyncIOMotorDatabase[Any] = Depends(get_db)
) -> list[JobPost]:
    """Return all job postings, optionally filtered by applied status."""

    query: dict[str, Any] = {}

    if applied is not None:
        query["applied"] = applied
    docs = await db.jobs.find(query).to_list(length=None)

    return [JobPost.model_validate(doc) for doc in docs]


@router.get("/jobs/{jid}/", response_model=JobPost)
async def get_job(jid: str, db: AsyncIOMotorDatabase[Any] = Depends(get_db)) -> JobPost:
    """Return a single job posting by ID."""

    oid = _parse_object_id(jid)
    doc = await db.jobs.find_one({"_id": oid})

    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    return JobPost.model_validate(doc)


@router.delete("/jobs/{jid}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(jid: str, db: AsyncIOMotorDatabase[Any] = Depends(get_db)) -> None:
    """Delete a job posting by ID."""

    oid = _parse_object_id(jid)
    result = await db.jobs.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
