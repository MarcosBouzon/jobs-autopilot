from pydantic import BaseModel


class ExperienceEntry(BaseModel):
    """A single work experience entry."""

    title: str
    company: str
    date_range: str
    location: str
    bullets: list[str]


class ProjectEntry(BaseModel):
    """A single project entry."""

    header: str
    bullets: list[str]


class Skills(BaseModel):
    """Skills section of a taylored resume."""

    languages: str = ""
    frameworks: str = ""
    devops_and_infra: str = ""
    tools: str = ""


class EducationEntry(BaseModel):
    school: str
    degree: str
    date_range: str
    description: str


class TayloredResume(BaseModel):
    """Structured output from the taylorer agent."""

    title: str
    summary: str
    skills: Skills
    experience: list[ExperienceEntry]
    projects: list[ProjectEntry]
    education: list[EducationEntry]


class JudgeVeredict(BaseModel):
    """Output from the judge LLM validating the taylored resume."""

    is_valid: bool
    errors: list[str]