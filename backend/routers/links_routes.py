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
from utils import fetch_metadata_for_url, format_link, background_fetch_metadata, metadata_executor

router = APIRouter(tags=["Links"])


@router.post("/api/link", response_model=LinkResponse)
def create_link(link: LinkCreate, db: Session = Depends(get_db),
                current_col: Collection = Depends(get_api_or_current_collection)):
    """Creates a new link in the collection or updates its creation time if it already exists."""
    existing_link = db.scalar(select(Link).filter(Link.collection_id == current_col.id, Link.url == link.url))
    if existing_link:
        existing_link.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_link)
        return format_link(existing_link)

    new_link = Link(
        collection_id=current_col.id,
        url=link.url,
        title=link.title,
        description=link.description,
        image=link.image
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

    if not new_link.title or not new_link.description or not new_link.image:
        metadata_executor.submit(background_fetch_metadata, new_link.id)

    return format_link(new_link)


@router.put("/api/link/{link_id}", response_model=LinkResponse)
def update_link(link_id: int, link: LinkCreate, db: Session = Depends(get_db),
                current_col: Collection = Depends(get_current_collection)):
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
def get_single_link(link_id: int, db: Session = Depends(get_db),
                    current_col: Collection = Depends(get_current_collection)):
    """Retrieves a single link by its ID."""
    db_link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    return format_link(db_link)


@router.get("/api/links")
def get_link(tags: Optional[str] = None, archived: Optional[bool] = False, db: Session = Depends(get_db),
             current_col: Collection = Depends(get_api_or_current_collection)):
    """Fetches the oldest unarchived link (optionally filtered by tags)."""
    query = select(Link).filter(Link.collection_id == current_col.id, Link.archived == archived)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            if tag:
                query = query.filter(Link.tags.any(Tag.name.like(f"%{tag}%")))
    links = db.scalars(query.order_by(Link.created_at.asc())).all()
    if not links:
        raise HTTPException(status_code=404, detail="No links found")

    return [format_link(item) for item in links]


@router.get("/api/links/stats")
def get_links_stats(db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    """Returns the count of archived and unarchived links for the logged-in user."""
    counts = db.execute(
        select(Link.archived, func.count(Link.id))
        .filter(Link.collection_id == current_col.id)
        .group_by(Link.archived)
    ).all()
    
    stats = {True: 0, False: 0}
    for is_archived, count in counts:
        stats[bool(is_archived)] = count
        
    return {
        "archived": stats[True],
        "unarchived": stats[False]
    }


@router.get("/api/links/{name}", response_model=PaginatedLinksResponse)
def get_collection_links(page: int = 1, archived: Optional[bool] = None, q: Optional[str] = None,
                         tags: Optional[str] = None, db: Session = Depends(get_db),
                         access_info: dict = Depends(verify_collection_access)):
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
def archive_link(link_id: int, archived: bool = True, db: Session = Depends(get_db),
                 current_col: Collection = Depends(get_current_collection)):
    """Changes the archive status of a link."""
    link = db.scalar(select(Link).filter(Link.id == link_id, Link.collection_id == current_col.id))
    if link:
        link.archived = archived
        db.commit()
    return {"status": "success"}
