from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator

# Converts bson.ObjectId → str at Pydantic validation time
PyObjectId = Annotated[str, BeforeValidator(str)]


class JobPost(BaseModel):
    """A job posting scraped from a job board."""

    id: PyObjectId | None = Field(default=None, alias="_id")
    job_id: str = Field(..., description="Original job ID from the source job board")
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Full job description text")
    location: str = Field(..., description="Job location (e.g. 'New York, NY')")
    location_types: list[str] = Field(
        default_factory=list, description="Work types 'Remote', 'Hybrid', 'Onsite'"
    )
    salary: str | None = Field(None, description="Salary range or compensation details")
    company: str | None = Field(None, description="Company offering the job")
    job_board: str = Field(..., description="Source job board")
    score: float = Field(0.0, description="Job score")
    applied: bool = Field(False, description="Whether the job has been applied to")
    applied_date: datetime | None = Field(
        None, description="Date when the job was applied to"
    )
    url: str = Field(..., description="URL to the original job posting")
    keywords: list[str] = Field(
        default_factory=list, description="Keywords extracted from the job description"
    )
    reasoning: str = Field("", description="Reasoning behind the job score by the LLM")
    resume_path: str = Field("", description="Path to the tailored resume")
    autopilot_created: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Date when the job was created by Autopilot",
    )
    deleted: bool = Field(False, description="Whether the job has been deleted")
    job_hash: str | None = Field(None, description="Hash of the job for deduplication")

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
    location_types: list[str]
    work_type: str | None = None
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
    applied_date: datetime | None = None
    job_hash: str | None = None
