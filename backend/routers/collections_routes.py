import jwt
from auth import verify_collection_access
from database import get_db
from fastapi import APIRouter, Depends
from models import Tag, Link, Collection
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from typing import List
from schemas import PaginatedCollectionsResponse, PublicCollectionResponse

router = APIRouter(tags=["Collections"])

@router.get("/api/collection/{name}")
def get_collection_info(access_info: dict = Depends(verify_collection_access)):
    """Retrieves basic information and settings for a specific collection."""
    col = access_info["col"]
    is_owner = access_info["is_owner"]
        
    return {
        "name": col.name,
        "description": col.description,
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

@router.get("/api/directory", response_model=PaginatedCollectionsResponse)
def get_public_directory(page: int = 1, q: str = None, db: Session = Depends(get_db)):
    """Retrieves a paginated list of public collections that opted in to be listed."""
    per_page = 20
    query = select(Collection).filter(Collection.is_public == True, Collection.show_in_public_list == True)
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(or_(Collection.name.ilike(search_term), Collection.description.ilike(search_term)))
    
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    if total is None:
        total = 0
    pages = (total + per_page - 1) // per_page
    if page < 1:
        page = 1
    if pages == 0:
        pages = 1
        
    collections = db.scalars(query.order_by(Collection.name.asc()).offset((page - 1) * per_page).limit(per_page)).all()
    
    items = [PublicCollectionResponse(name=c.name, description=c.description) for c in collections]
    
    return PaginatedCollectionsResponse(
        items=items,
        total=total,
        page=page,
        pages=pages
    )
