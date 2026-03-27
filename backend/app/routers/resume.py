from pathlib import Path

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.database import DB
from app.models.settings import SETTINGS_DOC_ID, Settings

router = APIRouter(tags=["Resume"])


@router.get(
    "/resume/{jid}/",
    response_class=FileResponse,
    responses={200: {"content": {"application/pdf": {}}}},
)
async def get_resume(jid: str, db: DB) -> FileResponse:
    """Return the taylored resume PDF for a given job ID."""

    try:
        oid = ObjectId(jid)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid job id: {jid!r}",
        ) from exc

    doc = await db.jobs.find_one({"_id": oid}, {"resume_path": 1})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    resume_path = doc.get("resume_path", "")
    if not resume_path or not Path(resume_path).is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No taylored resume found for this job",
        )

    return FileResponse(
        resume_path, media_type="application/pdf", filename=Path(resume_path).name
    )


@router.post("/resume/")
async def upload_resume(db: DB, file: UploadFile = File(...)) -> dict[str, str]:
    """Accept a PDF resume upload and save it to the resumes directory."""

    doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
    settings = Settings.model_validate(doc) if doc else Settings()
    dest = Path(settings.config.resumes_dir) / "user_resume.pdf"
    dest.parent.mkdir(parents=True, exist_ok=True)
    contents = await file.read()
    dest.write_bytes(contents)

    return {"path": str(dest)}
