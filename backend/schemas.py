from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List, Any


class CollectionCreate(BaseModel):
    name: str
    password: str

class CollectionSettings(BaseModel):
    is_public: bool
    show_in_public_list: bool = False
    description: Optional[str] = None
    display_images: bool
    display_mode: str
    links_per_page: Any = 20

class TokenResponse(BaseModel):
    id: int
    token: str
    created_at: datetime

class LinkstoreImportRequest(BaseModel):
    token: str

class UrlRequest(BaseModel):
    url: str

class LinkCreate(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    image: Optional[str] = None
    favicon: Optional[str] = None

class LinkResponse(BaseModel):
    id: int
    url: str
    favicon: str
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

class PublicCollectionResponse(BaseModel):
    name: str
    description: Optional[str] = None

class PaginatedCollectionsResponse(BaseModel):
    items: List[PublicCollectionResponse]
    total: int
    page: int
    pages: int
