from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi.security import HTTPAuthorizationCredentials
import jwt
from typing import List

from database import get_db
from models import Collection, Tag, Link
from auth import security, verify_collection_access
from config import JWT_SECRET

router = APIRouter(tags=["Collections"])

@router.get("/api/collection/{name}")
def get_collection_info(access_info: dict = Depends(verify_collection_access)):
    """Retrieves basic information and settings for a specific collection."""
    col = access_info["col"]
    is_owner = access_info["is_owner"]
        
    return {
        "name": col.name,
        "is_public": col.is_public,
        "display_images": col.display_images,
        "display_mode": col.display_mode,
        "is_owner": is_owner
    }

@router.get("/api/collection/{name}/tags", response_model=List[str])
def get_collection_tags(access_info: dict = Depends(verify_collection_access), db: Session = Depends(get_db)):
    """Fetches all unique tags used within a specific collection."""
    col = access_info["col"]
    tags = db.scalars(select(Tag.name).join(Link).filter(Link.collection_id == col.id).distinct().order_by(Tag.name.asc())).all()
    return list(tags)
