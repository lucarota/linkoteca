import jwt
from auth import get_password_hash, verify_password
from config import JWT_SECRET
from database import get_db
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from models import Collection, Link
from schemas import CollectionCreate
from sqlalchemy import select, func
from sqlalchemy.orm import Session

router = APIRouter(tags=["Authentication"])

@router.post("/api/register")
def register(col: CollectionCreate, db: Session = Depends(get_db)):
    """Registers a new collection and returns a JWT token."""
    col.name = col.name.lower()
    if col.name in ["directory", "api", "settings", "admin", "static"]:
        raise HTTPException(status_code=400, detail="This collection name is reserved")
        
    db_col = db.scalar(select(Collection).filter(Collection.name == col.name))
    if db_col:
        raise HTTPException(status_code=400, detail="Name already registered")
    hashed_password = get_password_hash(col.password)
    new_col = Collection(name=col.name, password_hash=hashed_password)
    db.add(new_col)
    db.commit()
    db.refresh(new_col)
    
    exp = datetime.utcnow() + timedelta(hours=1)
    jwt_token = jwt.encode({"sub": str(new_col.id), "exp": exp}, JWT_SECRET, algorithm="HS256")
    return {"token": jwt_token, "name": new_col.name}

@router.post("/api/login")
def login(col: CollectionCreate, db: Session = Depends(get_db)):
    """Authenticates a collection login and returns a JWT token."""
    col.name = col.name.lower()
    db_col = db.scalar(select(Collection).filter(Collection.name == col.name))
    if not db_col or not verify_password(col.password, db_col.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect name or password")
    
    exp = datetime.utcnow() + timedelta(hours=1)
    jwt_token = jwt.encode({"sub": str(db_col.id), "exp": exp}, JWT_SECRET, algorithm="HS256")
    return {"token": jwt_token, "name": db_col.name}

@router.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Retrieves global statistics about collections and links."""
    collections_count = db.scalar(select(func.count()).select_from(Collection))
    links_count = db.scalar(select(func.count()).select_from(Link))
    return {"collections": collections_count, "links": links_count}
