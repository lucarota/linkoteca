from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, select, func
from typing import Optional
from datetime import datetime
import math
import jwt
from fastapi.security import HTTPAuthorizationCredentials

from database import get_db
from models import Collection, Link, Tag
from schemas import LinkCreate, LinkResponse, PaginatedLinksResponse
from auth import get_current_collection, get_api_or_current_collection, security, verify_collection_access
from utils import fetch_metadata_for_url, format_link
from config import JWT_SECRET

router = APIRouter(tags=["Links"])

@router.post("/api/link", response_model=LinkResponse)
def create_link(link: LinkCreate, db: Session = Depends(get_db), current_col: Collection = Depends(get_api_or_current_collection)):
    """Creates a new link in the collection or updates its creation time if it already exists."""
    existing_link = db.scalar(select(Link).filter(Link.collection_id == current_col.id, Link.url == link.url))
    if existing_link:
        existing_link.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_link)
        return format_link(existing_link)

    final_image = link.image
    final_title = link.title
    final_description = link.description

    if not final_image or not final_title or not final_description:
        meta = fetch_metadata_for_url(link.url)
        if not final_image and meta['image']:
            final_image = meta['image']
        if not final_title and meta['title']:
            final_title = meta['title']
        if not final_description and meta['description']:
            final_description = meta['description']

    new_link = Link(
        collection_id=current_col.id,
        url=link.url,
        title=final_title,
        description=final_description,
        image=final_image
    )
    if link.tags:
        seen_tags = set()
        for tag_name in link.tags.split(","):
            tag_name = tag_name.strip()
            if tag_name and tag_name not in seen_tags:
                seen_tags.add(tag_name)
                new_link.tags.append(Tag(name=tag_name))
                
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    return format_link(new_link)

@router.put("/api/link/{link_id}", response_model=LinkResponse)
def update_link(link_id: int, link: LinkCreate, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Updates the details and tags of an existing link."""
    db_link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db_link.url = link.url
    db_link.title = link.title
    db_link.description = link.description
    db_link.image = link.image
    
    db_link.tags.clear()
    if link.tags:
        seen_tags = set()
        for tag_name in link.tags.split(","):
            tag_name = tag_name.strip()
            if tag_name and tag_name not in seen_tags:
                seen_tags.add(tag_name)
                db_link.tags.append(Tag(name=tag_name))
    
    db.commit()
    db.refresh(db_link)
    return format_link(db_link)

@router.get("/api/link/{link_id}", response_model=LinkResponse)
def get_single_link(link_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Retrieves a single link by its ID."""
    db_link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    return format_link(db_link)

@router.get("/api/link")
def get_link(tags: Optional[str] = None, db: Session = Depends(get_db), current_col: Collection = Depends(get_api_or_current_collection)):
    """Fetches the oldest unarchived link (optionally filtered by tags) and archives it."""
    query = select(Link).filter(Link.collection_id == current_col.id, Link.archived == False)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            if tag:
                query = query.filter(Link.tags.any(Tag.name.like(f"%{tag}%")))
    link = db.scalars(query.order_by(Link.created_at.asc())).first()
    if not link:
        raise HTTPException(status_code=404, detail="No unarchived links found")
    link.archived = True
    db.commit()
    db.refresh(link)
    return format_link(link)

@router.get("/api/links/{name}", response_model=PaginatedLinksResponse)
def get_collection_links(page: int = 1, archived: Optional[bool] = None, q: Optional[str] = None, tags: Optional[str] = None, db: Session = Depends(get_db), access_info: dict = Depends(verify_collection_access)):
    """Fetches a paginated list of links for a collection, supporting search and filtering."""
    col = access_info["col"]

    query = select(Link).filter(Link.collection_id == col.id)
    if archived is not None:
        query = query.filter(Link.archived == archived)
    if q:
        query = query.filter(or_(Link.url.like(f"%{q}%"), Link.title.like(f"%{q}%"), Link.description.like(f"%{q}%")))
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            if tag:
                query = query.filter(Link.tags.any(Tag.name.like(f"%{tag}%")))
        
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    links_per_page = col.links_per_page or 20
    pages = math.ceil(total / links_per_page) if total > 0 else 1
    
    if page < 1:
        page = 1
    elif page > pages > 0:
        page = pages
        
    offset = (page - 1) * links_per_page
    items = db.scalars(query.order_by(Link.created_at.desc()).offset(offset).limit(links_per_page)).all()
    
    return {"items": [format_link(item) for item in items], "total": total, "page": page, "pages": pages}

@router.delete("/api/link/{link_id}")
def delete_link(link_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Deletes a link permanently."""
    link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if link:
        db.delete(link)
        db.commit()
    return {"status": "success"}

@router.post("/api/link/{link_id}/archive")
def archive_link(link_id: int, archived: bool = True, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Changes the archive status of a link."""
    link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if link:
        link.archived = archived
        db.commit()
    return {"status": "success"}
