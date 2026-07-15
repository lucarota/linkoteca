from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt

from schemas import CollectionCreate
from models import Collection
from database import get_db
from config import JWT_SECRET
from auth import get_password_hash, verify_password

router = APIRouter(tags=["Authentication"])

@router.post("/api/register")
def register(col: CollectionCreate, db: Session = Depends(get_db)):
    db_col = db.query(Collection).filter(Collection.name == col.name).first()
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
    db_col = db.query(Collection).filter(Collection.name == col.name).first()
    if not db_col or not verify_password(col.password, db_col.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect name or password")
    
    exp = datetime.utcnow() + timedelta(hours=1)
    jwt_token = jwt.encode({"sub": str(db_col.id), "exp": exp}, JWT_SECRET, algorithm="HS256")
    return {"token": jwt_token, "name": db_col.name}
