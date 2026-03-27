from pathlib import Path

from pydantic import BaseModel, Field

SETTINGS_DOC_ID = "singleton"

from pydantic import BaseModel


class Config(BaseModel):
    resumes_dir: str = str(Path.home() / "Desktop" / "resumes")
    auto_apply: bool = False
    openai_api_key: str = ""
    gemini_api_key: str = ""
    claude_api_key: str = ""
    local_llm_path: str = ""
    local_llm_model: str = ""
    li_at: str = ""
    li_rm: str = ""
    jsession_id: str = ""
    linkedin_user: str = ""
    linkedin_pass: str = ""
    hc_email: str = ""
    hc_password: str = ""
    remote: bool = False
    hybrid: bool = False
    on_site: bool = False
    min_score: float = 7.0


class Form(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    country: str = ""
    zip_code: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    website_url: str = ""
    portfolio_url: str = ""
    legally_authorized: str = ""
    require_sponsorship: str = ""
    work_permit_type: str = ""
    salary: str = ""
    currency: str = ""
    salary_range: str = ""
    current_title: str = ""
    target_role: list[str] = []
    years_of_experience: str = ""
    school: str = ""
    education_level: str = ""
    programming_languages: list[str] = []
    frameworks: list[str] = []
    tools: list[str] = []
    earliest_start_date: str = "Immediately"
    about: str = ""


class Eeo(BaseModel):
    gender: str = "Decline to self-identify"
    race_ethnicity: str = "Decline to self-identify"
    veteran_status: str = "Decline to self-identify"
    disability_status: str = "Decline to self-identify"


class Settings(BaseModel):
    """Application-wide settings stored as a singleton document."""

    config: Config = Config()
    form: Form = Form()
    eeo: Eeo = Eeo()
