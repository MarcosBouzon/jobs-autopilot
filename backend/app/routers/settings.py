from typing import Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.database import get_db
from app.models.settings import SETTINGS_DOC_ID, Settings

router = APIRouter(tags=["Settings"])


@router.get("/settings/", response_model=Settings)
async def get_settings(
    db: AsyncIOMotorDatabase[Any] = Depends(get_db),
) -> Settings:
    """Return the current application settings."""
    doc = await db.settings.find_one({"_id": SETTINGS_DOC_ID})
    if doc is None:
        return Settings()
    return Settings.model_validate(doc)


@router.patch("/settings/", response_model=Settings)
async def update_settings(
    body: Settings,
    db: AsyncIOMotorDatabase[Any] = Depends(get_db),
) -> Settings:
    """Update and return the application settings (upserts on first call)."""
    doc = await db.settings.find_one_and_update(
        {"_id": SETTINGS_DOC_ID},
        {"$set": body.model_dump()},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return Settings.model_validate(doc)
