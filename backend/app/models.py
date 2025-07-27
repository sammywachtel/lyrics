from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class SongStatus(str, Enum):
    """Song status enumeration."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SongBase(BaseModel):
    """Base song model with common fields."""
    title: str = Field(..., min_length=1, max_length=200, description="Song title")
    artist: Optional[str] = Field(None, max_length=100, description="Artist name")
    lyrics: str = Field("", description="Song lyrics content")
    status: SongStatus = Field(SongStatus.DRAFT, description="Song status")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata (genre, tempo, etc.)")


class SongCreate(SongBase):
    """Model for creating a new song."""
    pass


class SongUpdate(BaseModel):
    """Model for updating an existing song."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    artist: Optional[str] = Field(None, max_length=100)
    lyrics: Optional[str] = None
    status: Optional[SongStatus] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class Song(SongBase):
    """Complete song model with database fields."""
    id: str = Field(..., description="Unique song identifier")
    user_id: str = Field(..., description="User who owns this song")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class SongResponse(BaseModel):
    """API response for song operations."""
    message: str
    song: Optional[Song] = None
    songs: Optional[List[Song]] = None


class SongListResponse(BaseModel):
    """API response for listing songs."""
    songs: List[Song]
    total: int
    page: int
    per_page: int


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str
    details: Optional[str] = None
    code: Optional[str] = None


class UserContext(BaseModel):
    """User context from authentication."""
    user_id: str
    email: Optional[str] = None
    is_authenticated: bool = True