import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import JWT_SECRET
from database import get_db
from models import Collection, AccessToken

security = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a stored bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_current_collection(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Authenticates requests using exclusively JWT session tokens.
    Typically used for normal web interface (frontend) requests.

    Args:
        credentials (HTTPAuthorizationCredentials): The Bearer token from the Authorization header.
        db (Session): The SQLAlchemy database session.

    Returns:
        Collection: The authenticated user's collection.

    Raises:
        HTTPException: If the token is invalid or missing (401 Unauthorized).
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        col_id = payload.get("sub")
        if col_id:
            col = db.scalar(select(Collection).filter(Collection.id == col_id))
            if col:
                return col
    except:
        pass
    raise HTTPException(status_code=401, detail="Not authenticated")

def get_api_or_current_collection(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Authenticates requests using either a permanent API token (AccessToken) 
    or a JWT session token as fallback. Useful for programmatic access.

    Args:
        credentials (HTTPAuthorizationCredentials): The Bearer token from the Authorization header.
        db (Session): The SQLAlchemy database session.

    Returns:
        Collection: The authenticated user's collection.

    Raises:
        HTTPException: If the token is invalid or missing (401 Unauthorized).
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    token_obj = db.scalar(select(AccessToken).filter(AccessToken.token == token))
    if token_obj:
        return db.scalar(select(Collection).filter(Collection.id == token_obj.collection_id))
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        col_id = payload.get("sub")
        if col_id:
            col = db.scalar(select(Collection).filter(Collection.id == col_id))
            if col:
                return col
    except:
        pass
    raise HTTPException(status_code=401, detail="Not authenticated")

def verify_collection_access(
    name: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Verifies if the current user has access to a specific collection.
    Checks visibility and ownership based on the provided credentials.
    """
    col = db.scalar(select(Collection).filter(Collection.name == name))
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    is_owner = False
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
            if str(payload.get("sub")) == str(col.id):
                is_owner = True
        except:
            pass

    if not col.is_public and not is_owner:
        raise HTTPException(status_code=403, detail="Private collection")
        
    return {"col": col, "is_owner": is_owner}
