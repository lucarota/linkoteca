from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
import secrets
from typing import List

from schemas import CollectionSettings, TokenResponse
from models import Collection, AccessToken
from database import get_db
from auth import get_current_collection

router = APIRouter(tags=["Settings"])

@router.get("/api/settings")
def get_settings(current_col: Collection = Depends(get_current_collection)):
    """Retrieves the current settings for the authenticated collection."""
    return {
        "is_public": current_col.is_public,
        "show_in_public_list": current_col.show_in_public_list,
        "description": current_col.description,
        "display_images": current_col.display_images,
        "display_mode": current_col.display_mode,
        "name": current_col.name,
        "links_per_page": current_col.links_per_page or 20
    }

@router.put("/api/settings")
def update_settings(settings: CollectionSettings, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Updates the settings for the authenticated collection."""
    current_col.is_public = settings.is_public
    current_col.show_in_public_list = settings.show_in_public_list
    
    if settings.description:
        current_col.description = settings.description[:200]
    else:
        current_col.description = None
        
    current_col.display_images = settings.display_images
    current_col.display_mode = settings.display_mode
    
    try:
        lpp = int(settings.links_per_page)
        if lpp < 1 or lpp > 200:
            lpp = 20
    except (ValueError, TypeError):
        lpp = 20
    current_col.links_per_page = lpp
    
    db.commit()
    return {"status": "success"}

@router.get("/api/settings/access_tokens", response_model=List[TokenResponse])
def get_tokens(db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Lists all access tokens for the collection, masking their full values."""
    tokens = db.scalars(select(AccessToken).filter(AccessToken.collection_id == current_col.id)).all()
    result = []
    for t in tokens:
        masked = t.token[:3] + "*" * 29 if len(t.token) > 3 else "***"
        result.append(TokenResponse(id=t.id, token=masked, created_at=t.created_at))
    return result

@router.post("/api/settings/access_token", response_model=TokenResponse)
def create_access_token(db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Generates and stores a new permanent access token."""
    token_str = secrets.token_urlsafe(32)
    new_token = AccessToken(collection_id=current_col.id, token=token_str)
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return new_token

@router.delete("/api/settings/access_token/{token_id}")
def delete_access_token(token_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Revokes and deletes an access token by its ID."""
    token = db.scalar(select(AccessToken).filter(AccessToken.id == token_id, AccessToken.collection_id == current_col.id))
    if token:
        db.delete(token)
        db.commit()
    return {"status": "success"}
