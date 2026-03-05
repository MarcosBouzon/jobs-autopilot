from pydantic import BaseModel, Field

SETTINGS_DOC_ID = "singleton"


class Settings(BaseModel):
    """Application-wide settings stored as a singleton document."""

    eeo: dict = Field(default_factory=dict)  # type: ignore[type-arg]
    form: dict = Field(default_factory=dict)  # type: ignore[type-arg]
    config: dict = Field(default_factory=dict)  # type: ignore[type-arg]
