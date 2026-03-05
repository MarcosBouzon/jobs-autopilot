from pydantic import BaseModel


class Resume(BaseModel):
    """A resume file linked to a job posting."""

    path: str
    job_id: str
