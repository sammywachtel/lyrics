from fastapi import APIRouter, HTTPException, Depends, Query, status
from supabase import Client
from typing import Optional, List
from datetime import datetime, timezone
import logging
import uuid

from .models import (
    Song, SongCreate, SongUpdate, SongResponse, SongListResponse, 
    ErrorResponse, UserContext, SongStatus
)

logger = logging.getLogger(__name__)


class SongsService:
    """Service for managing songs in the database."""
    
    def __init__(self, supabase_client: Optional[Client]):
        self.supabase = supabase_client
    
    def _db_to_song(self, db_record: dict) -> Song:
        """Convert database record to Song model."""
        metadata = db_record.get("metadata", {})
        
        # Determine status from metadata and is_archived flag
        if db_record.get("is_archived", False):
            status = SongStatus.ARCHIVED
        else:
            status = SongStatus(metadata.get("status", "draft"))
        
        return Song(
            id=db_record["id"],
            user_id=db_record["user_id"],
            title=db_record["title"],
            artist=metadata.get("artist"),
            lyrics=db_record.get("content", ""),
            status=status,
            tags=metadata.get("tags", []),
            metadata={k: v for k, v in metadata.items() if k not in ["artist", "tags", "status"]},
            created_at=db_record["created_at"],
            updated_at=db_record["updated_at"]
        )
    
    def _check_database(self):
        """Check if database is available."""
        if not self.supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service unavailable"
            )
    
    async def create_song(self, song_data: SongCreate, user: UserContext) -> Song:
        """Create a new song."""
        self._check_database()
        
        try:
            # Map API model to database schema
            metadata = song_data.metadata.copy()
            metadata["artist"] = song_data.artist
            metadata["tags"] = song_data.tags
            metadata["status"] = song_data.status.value
            
            song_dict = {
                "id": str(uuid.uuid4()),
                "user_id": user.user_id,
                "title": song_data.title,
                "content": song_data.lyrics,
                "metadata": metadata,
                "is_archived": song_data.status == SongStatus.ARCHIVED
            }
            
            response = self.supabase.table("songs").insert(song_dict).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create song"
                )
            
            return self._db_to_song(response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create song"
            )
    
    async def get_song(self, song_id: str, user: UserContext) -> Song:
        """Get a song by ID."""
        self._check_database()
        
        try:
            response = self.supabase.table("songs").select("*").eq("id", song_id).eq("user_id", user.user_id).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Song not found"
                )
            
            return self._db_to_song(response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve song"
            )
    
    async def list_songs(
        self, 
        user: UserContext, 
        page: int = 1, 
        per_page: int = 10,
        status_filter: Optional[SongStatus] = None
    ) -> SongListResponse:
        """List songs for a user with pagination."""
        self._check_database()
        
        try:
            offset = (page - 1) * per_page
            
            query = self.supabase.table("songs").select("*").eq("user_id", user.user_id)
            
            if status_filter:
                if status_filter == SongStatus.ARCHIVED:
                    query = query.eq("is_archived", True)
                else:
                    query = query.eq("is_archived", False).eq("metadata->>status", status_filter.value)
            
            # Get total count
            count_response = self.supabase.table("songs").select("id", count="exact").eq("user_id", user.user_id)
            if status_filter:
                if status_filter == SongStatus.ARCHIVED:
                    count_response = count_response.eq("is_archived", True)
                else:
                    count_response = count_response.eq("is_archived", False).eq("metadata->>status", status_filter.value)
            count_result = count_response.execute()
            total = count_result.count or 0
            
            # Get paginated results
            response = query.order("updated_at", desc=True).range(offset, offset + per_page - 1).execute()
            
            songs = [self._db_to_song(song_data) for song_data in response.data]
            
            return SongListResponse(
                songs=songs,
                total=total,
                page=page,
                per_page=per_page
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error listing songs: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve songs"
            )
    
    async def update_song(self, song_id: str, song_update: SongUpdate, user: UserContext) -> Song:
        """Update an existing song."""
        self._check_database()
        
        try:
            # First check if song exists and belongs to user
            existing = await self.get_song(song_id, user)
            
            # Prepare update data - map to database schema
            update_data = {}
            metadata_updates = {}
            
            if song_update.title is not None:
                update_data["title"] = song_update.title
            if song_update.lyrics is not None:
                update_data["content"] = song_update.lyrics
            if song_update.artist is not None:
                metadata_updates["artist"] = song_update.artist
            if song_update.tags is not None:
                metadata_updates["tags"] = song_update.tags
            if song_update.status is not None:
                metadata_updates["status"] = song_update.status.value
                update_data["is_archived"] = song_update.status == SongStatus.ARCHIVED
            if song_update.metadata is not None:
                metadata_updates.update(song_update.metadata)
            
            # Update metadata if there are changes
            if metadata_updates:
                # Get current metadata and merge
                current_metadata = existing.metadata.copy()
                current_metadata.update(metadata_updates)
                update_data["metadata"] = current_metadata
            
            
            response = self.supabase.table("songs").update(update_data).eq("id", song_id).eq("user_id", user.user_id).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update song"
                )
            
            return self._db_to_song(response.data[0])
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update song"
            )
    
    async def delete_song(self, song_id: str, user: UserContext) -> bool:
        """Delete a song."""
        self._check_database()
        
        try:
            # First check if song exists and belongs to user
            await self.get_song(song_id, user)
            
            response = self.supabase.table("songs").delete().eq("id", song_id).eq("user_id", user.user_id).execute()
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete song"
            )


def create_songs_router(supabase_client: Optional[Client], get_current_user) -> APIRouter:
    """Create songs router with dependencies."""
    router = APIRouter(prefix="/api/songs", tags=["songs"])
    songs_service = SongsService(supabase_client)
    
    @router.post("/", response_model=SongResponse, status_code=status.HTTP_201_CREATED)
    async def create_song(
        song_data: SongCreate,
        user: UserContext = Depends(get_current_user)
    ):
        """Create a new song."""
        song = await songs_service.create_song(song_data, user)
        return SongResponse(message="Song created successfully", song=song)
    
    @router.get("/{song_id}", response_model=SongResponse)
    async def get_song(
        song_id: str,
        user: UserContext = Depends(get_current_user)
    ):
        """Get a song by ID."""
        song = await songs_service.get_song(song_id, user)
        return SongResponse(message="Song retrieved successfully", song=song)
    
    @router.get("/", response_model=SongListResponse)
    async def list_songs(
        user: UserContext = Depends(get_current_user),
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=100, description="Items per page"),
        status: Optional[SongStatus] = Query(None, description="Filter by status")
    ):
        """List songs for the current user."""
        return await songs_service.list_songs(user, page, per_page, status)
    
    @router.put("/{song_id}", response_model=SongResponse)
    async def update_song(
        song_id: str,
        song_update: SongUpdate,
        user: UserContext = Depends(get_current_user)
    ):
        """Update an existing song."""
        song = await songs_service.update_song(song_id, song_update, user)
        return SongResponse(message="Song updated successfully", song=song)
    
    @router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_song(
        song_id: str,
        user: UserContext = Depends(get_current_user)
    ):
        """Delete a song."""
        await songs_service.delete_song(song_id, user)
        return None
    
    return router