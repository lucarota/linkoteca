import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Collection(Base):
    __tablename__ = "collection"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_public = Column(Boolean, default=False)
    show_in_public_list = Column(Boolean, default=False)
    description = Column(String, nullable=True)
    display_images = Column(Boolean, default=True)
    display_mode = Column(String, default="list")
    links_per_page = Column(Integer, default=20)
    
    tokens = relationship("AccessToken", back_populates="collection", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="collection", cascade="all, delete-orphan")

class AccessToken(Base):
    __tablename__ = "access_token"
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collection.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    collection = relationship("Collection", back_populates="tokens")

class Tag(Base):
    __tablename__ = "tag"
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("link.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    
    link = relationship("Link", back_populates="tags")

class Link(Base):
    __tablename__ = "link"
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collection.id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)
    archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    collection = relationship("Collection", back_populates="links")
    tags = relationship("Tag", back_populates="link", cascade="all, delete-orphan")
