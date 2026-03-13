from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator

# Converts bson.ObjectId → str at Pydantic validation time
PyObjectId = Annotated[str, BeforeValidator(str)]


class JobPost(BaseModel):
    """A job posting scraped from a job board."""

    id: PyObjectId | None = Field(default=None, alias="_id")
    job_id: str
    title: str
    description: str
    location: str
    salary: str | None = None
    company: str | None = None
    job_board: str
    score: float = 0.0
    applied: bool = False
    url: str
    keywords: list[str] = []
    reasoning: str = ""
    resume_path: str = ""
    autopilot_created: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class JobPostCreate(BaseModel):
    """Payload for creating a new job posting."""

    job_id: str
    title: str
    description: str
    location: str
    salary: str | None = None
    company: str | None = None
    job_board: str
    url: str
    score: float = 0.0
    applied: bool = False
    keywords: list[str] = []
    reasoning: str = ""
    resume_path: str = ""
    autopilot_created: datetime = Field(default_factory=lambda: datetime.now(UTC))
