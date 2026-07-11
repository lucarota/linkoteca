import bcrypt
import json
import jwt
import math
import metadata_parser
import os
import requests
import secrets

from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from starlette.types import ASGIApp, Receive, Scope, Send
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker, Session
from typing import Optional, List, Any

from models import Base, Collection, AccessToken, Link, Tag

# DB setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./linkami.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

env_path = os.path.join(os.path.dirname(__file__), '.env')
JWT_SECRET = None
ALLOWED_ORIGINS_ENV = ""
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip().startswith('JWT_SECRET='):
                JWT_SECRET = line.strip().split('=', 1)[1].strip()
            elif line.strip().startswith('ALLOWED_ORIGINS='):
                ALLOWED_ORIGINS_ENV = line.strip().split('=', 1)[1].strip()

if not JWT_SECRET:
    JWT_SECRET = secrets.token_hex(16)
    with open(env_path, 'a') as f:
        f.write(f"JWT_SECRET={JWT_SECRET}\n")

if ALLOWED_ORIGINS_ENV:
    frontend_origins = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(',')]
else:
    frontend_origins = ["http://localhost:5173", "http://localhost:3000"]

security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="Linkami API",
    description="Backend API for Linkami, a self-hosted bookmarking tool to save your favorite links in collections. Organize, search and preview your web links with ease.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "Operations for registration and login."},
        {"name": "Collections", "description": "Operations for fetching collection details."},
        {"name": "Settings", "description": "Operations for collection settings and access tokens."},
        {"name": "Links", "description": "Operations to manage and search saved links."}
    ]
)

class DynamicCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        
        # Frontend policy: allows requests from the origins read from .env
        self.frontend_cors = CORSMiddleware(
            app=app,
            allow_origins=frontend_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # "Open" policy (CORS disabled/bypassed) for /api/link
        self.public_cors = CORSMiddleware(
            app=app,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            
            # If the request (including the OPTIONS preflight) is for /api/link
            if path == "/api/link":
                await self.public_cors(scope, receive, send)
                return
                
        # Apply frontend restrictions to all other routes
        await self.frontend_cors(scope, receive, send)

# Use the custom middleware instead of the standard one
app.add_middleware(DynamicCORSMiddleware)


def fetch_metadata_for_url(url: str) -> dict:
    result = {'title': None, 'description': None, 'image': None}
    try:
        page = metadata_parser.MetadataParser(url=url, search_head_only=False)
        img = page.get_metadata_link('image')
        if img:
            result['image'] = img
        title_meta = page.get_metadatas('title')
        if title_meta:
            result['title'] = title_meta[0]
        desc_meta = page.get_metadatas('description')
        if desc_meta:
            result['description'] = desc_meta[0]
    except Exception:
        pass

    if not result['image'] or not result['title'] or not result['description']:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            if not result['title']:
                title_tag = soup.find('title')
                if title_tag and title_tag.string:
                    result['title'] = title_tag.string.strip()
                if not result['title']:
                    for tag in ['og:title', 'twitter:title']:
                        meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                        if meta and meta.get('content'):
                            result['title'] = meta.get('content').strip()
                            break

            if not result['description']:
                for tag in ['description', 'og:description', 'twitter:description']:
                    meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                    if meta and meta.get('content'):
                        result['description'] = meta.get('content').strip()
                        break

            if not result['image']:
                for tag in ['og:image', 'twitter:image', 'image']:
                    meta = soup.find('meta', property=tag) or soup.find('meta', attrs={'name': tag})
                    if meta and meta.get('content'):
                        result['image'] = meta.get('content')
                        break
                if not result['image']:
                    link_tag = soup.find('link', rel='image_src')
                    if link_tag and link_tag.get('href'):
                        result['image'] = link_tag.get('href')

            if not result['image'] or not result['title'] or not result['description']:
                for script in soup.find_all('script', type='application/ld+json'):
                    try:
                        data = json.loads(script.string)

                        def find_keys(obj):
                            if isinstance(obj, dict):
                                if not result['title']:
                                    if 'headline' in obj and isinstance(obj['headline'], str):
                                        result['title'] = obj['headline']
                                    elif 'name' in obj and isinstance(obj['name'], str):
                                        result['title'] = obj['name']
                                if not result['description']:
                                    if 'description' in obj and isinstance(obj['description'], str):
                                        result['description'] = obj['description']
                                if not result['image']:
                                    if 'thumbnailUrl' in obj:
                                        if isinstance(obj['thumbnailUrl'], str):
                                            result['image'] = obj['thumbnailUrl']
                                        elif isinstance(obj['thumbnailUrl'], list) and len(obj['thumbnailUrl']) > 0:
                                            result['image'] = obj['thumbnailUrl'][0]
                                for v in obj.values():
                                    find_keys(v)
                            elif isinstance(obj, list):
                                for item in obj:
                                    find_keys(item)

                        find_keys(data)
                        if result['image'] and result['title'] and result['description']:
                            break
                    except Exception:
                        continue
        except Exception:
            pass

    return result


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class CollectionCreate(BaseModel):
    name: str
    password: str

class CollectionSettings(BaseModel):
    is_public: bool
    display_images: bool
    display_mode: str
    links_per_page: Any = 20

class TokenResponse(BaseModel):
    id: int
    token: str
    created_at: datetime

class LinkCreate(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    image: Optional[str] = None

class LinkResponse(BaseModel):
    id: int
    url: str
    title: Optional[str]
    description: Optional[str]
    tags: Optional[str]
    image: Optional[str]
    archived: bool
    created_at: datetime

class PaginatedLinksResponse(BaseModel):
    items: List[LinkResponse]
    total: int
    page: int
    pages: int

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_current_collection(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        col_id = payload.get("sub")
        if col_id:
            col = db.query(Collection).filter(Collection.id == col_id).first()
            if col:
                return col
    except:
        pass
    raise HTTPException(status_code=401, detail="Not authenticated")

def get_api_or_current_collection(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    token_obj = db.query(AccessToken).filter(AccessToken.token == token).first()
    if token_obj:
        return db.query(Collection).filter(Collection.id == token_obj.collection_id).first()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        col_id = payload.get("sub")
        if col_id:
            col = db.query(Collection).filter(Collection.id == col_id).first()
            if col:
                return col
    except:
        pass
    raise HTTPException(status_code=401, detail="Not authenticated")

@app.post("/api/register", tags=["Authentication"])
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

@app.post("/api/login", tags=["Authentication"])
def login(col: CollectionCreate, db: Session = Depends(get_db)):
    db_col = db.query(Collection).filter(Collection.name == col.name).first()
    if not db_col or not verify_password(col.password, db_col.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect name or password")
    
    exp = datetime.utcnow() + timedelta(hours=1)
    jwt_token = jwt.encode({"sub": str(db_col.id), "exp": exp}, JWT_SECRET, algorithm="HS256")
    return {"token": jwt_token, "name": db_col.name}

@app.get("/api/collection/{name}", tags=["Collections"])
def get_collection_info(name: str, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    col = db.query(Collection).filter(Collection.name == name).first()
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
        
    return {
        "name": col.name,
        "is_public": col.is_public,
        "display_images": col.display_images,
        "display_mode": col.display_mode,
        "is_owner": is_owner
    }

@app.get("/api/settings", tags=["Settings"])
def get_settings(current_col: Collection = Depends(get_current_collection)):
    return {
        "is_public": current_col.is_public,
        "display_images": current_col.display_images,
        "display_mode": current_col.display_mode,
        "name": current_col.name,
        "links_per_page": current_col.links_per_page or 20
    }

@app.put("/api/settings", tags=["Settings"])
def update_settings(settings: CollectionSettings, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    current_col.is_public = settings.is_public
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

@app.get("/api/settings/access_tokens", response_model=List[TokenResponse], tags=["Settings"])
def get_tokens(db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    tokens = db.query(AccessToken).filter(AccessToken.collection_id == current_col.id).all()
    result = []
    for t in tokens:
        masked = t.token[:3] + "*" * 29 if len(t.token) > 3 else "***"
        result.append(TokenResponse(id=t.id, token=masked, created_at=t.created_at))
    return result

@app.post("/api/settings/access_token", response_model=TokenResponse, tags=["Settings"])
def create_access_token(db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    token_str = secrets.token_urlsafe(32)
    new_token = AccessToken(collection_id=current_col.id, token=token_str)
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return new_token

@app.delete("/api/settings/access_token/{token_id}", tags=["Settings"])
def delete_access_token(token_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    token = db.query(AccessToken).filter(AccessToken.id == token_id, AccessToken.collection_id == current_col.id).first()
    if token:
        db.delete(token)
        db.commit()
    return {"status": "success"}

def _format_link(link: Link) -> dict:
    return {
        "id": link.id,
        "url": link.url,
        "title": link.title,
        "description": link.description,
        "tags": ", ".join([tag.name for tag in link.tags]) if link.tags else "",
        "image": link.image,
        "archived": link.archived,
        "created_at": link.created_at
    }

@app.post("/api/link", response_model=LinkResponse, tags=["Links"])
def create_link(link: LinkCreate, db: Session = Depends(get_db), current_col: Collection = Depends(get_api_or_current_collection)):
    existing_link = db.query(Link).filter(Link.collection_id == current_col.id, Link.url == link.url).first()
    if existing_link:
        existing_link.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_link)
        return existing_link

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
        for tag_name in link.tags.split(","):
            tag_name = tag_name.strip()
            if tag_name:
                new_link.tags.append(Tag(name=tag_name))
                
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    # Return dict matching LinkResponse
    return _format_link(new_link)

@app.put("/api/link/{link_id}", response_model=LinkResponse, tags=["Links"])
def update_link(link_id: int, link: LinkCreate, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    db_link = db.query(Link).filter(Link.id == link_id, Link.collection_id == current_col.id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db_link.url = link.url
    db_link.title = link.title
    db_link.description = link.description
    db_link.image = link.image
    
    db_link.tags.clear()
    if link.tags:
        for tag_name in link.tags.split(","):
            tag_name = tag_name.strip()
            if tag_name:
                db_link.tags.append(Tag(name=tag_name))
    
    db.commit()
    db.refresh(db_link)
    return _format_link(db_link)

@app.get("/api/link/{link_id}", response_model=LinkResponse, tags=["Links"])
def get_single_link(link_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    db_link = db.query(Link).filter(Link.id == link_id, Link.collection_id == current_col.id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    return _format_link(db_link)

@app.get("/api/link", tags=["Links"])
def get_link(tags: Optional[str] = None, db: Session = Depends(get_db), current_col: Collection = Depends(get_api_or_current_collection)):
    query = db.query(Link).filter(Link.collection_id == current_col.id, Link.archived == False)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            if tag:
                query = query.filter(Link.tags.any(Tag.name.like(f"%{tag}%")))
    link = query.order_by(Link.created_at.asc()).first()
    if not link:
        raise HTTPException(status_code=404, detail="No unarchived links found")
    link.archived = True
    db.commit()
    db.refresh(link)
    return _format_link(link)

@app.get("/api/links/{name}", response_model=PaginatedLinksResponse, tags=["Links"])
def get_collection_links(name: str, page: int = 1, archived: Optional[bool] = None, q: Optional[str] = None, tags: Optional[str] = None, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    col = db.query(Collection).filter(Collection.name == name).first()
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

    query = db.query(Link).filter(Link.collection_id == col.id)
    if archived is not None:
        query = query.filter(Link.archived == archived)
    if q:
        query = query.filter(or_(Link.url.like(f"%{q}%"), Link.title.like(f"%{q}%"), Link.description.like(f"%{q}%")))
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            if tag:
                query = query.filter(Link.tags.any(Tag.name.like(f"%{tag}%")))
        
    total = query.count()
    links_per_page = col.links_per_page or 20
    pages = math.ceil(total / links_per_page) if total > 0 else 1
    
    if page < 1:
        page = 1
    elif page > pages and pages > 0:
        page = pages
        
    offset = (page - 1) * links_per_page
    items = query.order_by(Link.created_at.desc()).offset(offset).limit(links_per_page).all()
    
    return {"items": [_format_link(item) for item in items], "total": total, "page": page, "pages": pages}

@app.delete("/api/link/{link_id}", tags=["Links"])
def delete_link(link_id: int, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    link = db.query(Link).filter(Link.id == link_id, Link.collection_id == current_col.id).first()
    if link:
        db.delete(link)
        db.commit()
    return {"status": "success"}

@app.post("/api/link/{link_id}/archive", tags=["Links"])
def archive_link(link_id: int, archived: bool = True, db: Session = Depends(get_db), current_col: Collection = Depends(get_current_collection)):
    link = db.query(Link).filter(Link.id == link_id, Link.collection_id == current_col.id).first()
    if link:
        link.archived = archived
        db.commit()
    return {"status": "success"}
