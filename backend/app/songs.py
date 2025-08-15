import logging
import uuid

# datetime and timezone available if needed in future
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from .models import (
    ProsodyConfig,
    ProsodyConfigResponse,
    ProsodyConfigUpdate,
    Song,
    SongCreate,
    SongListResponse,
    SongResponse,
    SongSettings,
    SongSettingsHistory,
    SongSettingsHistoryResponse,
    SongSettingsPartialUpdate,
    SongSettingsResponse,
    SongSettingsUpdate,
    SongStatus,
    SongUpdate,
    SongVersion,
    SongVersionCreate,
    SongVersionResponse,
    UserContext,
)

logger = logging.getLogger(__name__)


class SongsService:
    """Service for managing songs in the database."""

    def __init__(self, supabase_client: Optional[Client]):
        self.supabase = supabase_client
        self._admin_client = None

    def _get_client_for_user(self, user: UserContext) -> Optional[Client]:
        """Get appropriate client for the user."""
        # Use regular client for all users - RLS policies should handle access control
        return self.supabase

    def _db_to_song(self, db_record: dict) -> Song:
        """Convert database record to Song model."""
        metadata = db_record.get("metadata", {})
        settings_data = db_record.get("settings", {})

        # Determine status from metadata and is_archived flag
        if db_record.get("is_archived", False):
            status = SongStatus.ARCHIVED
        else:
            status = SongStatus(metadata.get("status", "draft"))

        # Parse settings or create default
        try:
            settings = (
                SongSettings(**settings_data) if settings_data else SongSettings()
            )
        except Exception as e:
            logger.warning(f"Error parsing song settings: {e}. Using defaults.")
            settings = SongSettings()

        return Song(
            id=db_record["id"],
            user_id=db_record["user_id"],
            title=db_record["title"],
            artist=metadata.get("artist"),
            lyrics=db_record.get("content", ""),
            status=status,
            tags=metadata.get("tags", []),
            settings=settings,
            metadata={
                k: v
                for k, v in metadata.items()
                if k not in ["artist", "tags", "status"]
            },
            created_at=db_record["created_at"],
            updated_at=db_record["updated_at"],
        )

    def _check_database(self):
        """Check if database is available."""
        if not self.supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service unavailable",
            )

    async def create_song(self, song_data: SongCreate, user: UserContext) -> Song:
        """Create a new song."""
        self._check_database()

        try:
            # Get appropriate client for this user
            client = self._get_client_for_user(user)
            if not client:
                client = self.supabase

            # Map API model to database schema
            metadata = song_data.metadata.copy()
            metadata["artist"] = song_data.artist
            metadata["tags"] = song_data.tags
            metadata["status"] = song_data.status.value

            # Convert settings to dict for JSON storage
            settings_dict = (
                song_data.settings.model_dump() if song_data.settings else {}
            )

            song_dict = {
                "id": str(uuid.uuid4()),
                "user_id": user.user_id,
                "title": song_data.title,
                "content": song_data.lyrics,
                "metadata": metadata,
                "settings": settings_dict,
                "is_archived": song_data.status == SongStatus.ARCHIVED,
            }

            response = client.table("songs").insert(song_dict).execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create song",
                )

            return self._db_to_song(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create song",
            )

    async def get_song(self, song_id: str, user: UserContext) -> Song:
        """Get a song by ID."""
        self._check_database()

        try:
            # Use authenticated client for this user to ensure proper RLS context
            client = self._get_client_for_user(user)
            if not client:
                client = self.supabase

            response = (
                client.table("songs")
                .select("*")
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Song not found",
                )

            return self._db_to_song(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve song",
            )

    async def list_songs(
        self,
        user: UserContext,
        page: int = 1,
        per_page: int = 10,
        status_filter: Optional[SongStatus] = None,
    ) -> SongListResponse:
        """List songs for a user with pagination."""
        self._check_database()

        try:
            offset = (page - 1) * per_page

            # Get appropriate client for this user
            client = self._get_client_for_user(user)
            if not client:
                client = self.supabase

            query = client.table("songs").select("*").eq("user_id", user.user_id)

            if status_filter:
                if status_filter == SongStatus.ARCHIVED:
                    query = query.eq("is_archived", True)
                else:
                    query = query.eq("is_archived", False).eq(
                        "metadata->>status", status_filter.value
                    )

            # Get total count
            count_response = (
                client.table("songs")
                .select("id", count="exact")
                .eq("user_id", user.user_id)
            )
            if status_filter:
                if status_filter == SongStatus.ARCHIVED:
                    count_response = count_response.eq("is_archived", True)
                else:
                    count_response = count_response.eq("is_archived", False).eq(
                        "metadata->>status", status_filter.value
                    )
            count_result = count_response.execute()
            total = count_result.count or 0

            # Get paginated results
            response = (
                query.order("updated_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            songs = [self._db_to_song(song_data) for song_data in response.data]

            return SongListResponse(
                songs=songs, total=total, page=page, per_page=per_page
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error listing songs: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve songs",
            )

    async def update_song(
        self, song_id: str, song_update: SongUpdate, user: UserContext
    ) -> Song:
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

            # Update settings if provided
            if song_update.settings is not None:
                update_data["settings"] = song_update.settings.model_dump()

            # Update metadata if there are changes
            if metadata_updates:
                # Get current metadata and merge
                current_metadata = existing.metadata.copy()
                current_metadata.update(metadata_updates)
                update_data["metadata"] = current_metadata

            # Use authenticated client for this user
            client = self._get_client_for_user(user)
            if not client:
                client = self.supabase

            response = (
                client.table("songs")
                .update(update_data)
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update song",
                )

            return self._db_to_song(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update song",
            )

    async def delete_song(self, song_id: str, user: UserContext) -> bool:
        """Delete a song."""
        self._check_database()

        try:
            # First check if song exists and belongs to user
            await self.get_song(song_id, user)

            # Use authenticated client for this user
            client = self._get_client_for_user(user)
            if not client:
                client = self.supabase

            (
                client.table("songs")
                .delete()
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting song: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete song",
            )

    async def get_song_settings(self, song_id: str, user: UserContext) -> SongSettings:
        """Get settings for a specific song."""
        self._check_database()

        try:
            response = (
                self.supabase.table("songs")
                .select("settings")
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Song not found",
                )

            settings_data = response.data[0].get("settings", {})
            try:
                return (
                    SongSettings(**settings_data) if settings_data else SongSettings()
                )
            except Exception as e:
                logger.warning(f"Error parsing song settings: {e}. Using defaults.")
                return SongSettings()

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting song settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve song settings",
            )

    async def update_song_settings(
        self,
        song_id: str,
        settings_update: SongSettingsUpdate,
        user: UserContext,
    ) -> SongSettings:
        """Update settings for a specific song."""
        self._check_database()

        try:
            # Get current settings for change tracking
            # current_settings = await self.get_song_settings(song_id, user)  # Available if needed
            # current_dict = current_settings.model_dump()  # Available if needed

            # Convert new settings to dict for JSON storage
            settings_dict = settings_update.settings.model_dump()

            # Update database
            response = (
                self.supabase.table("songs")
                .update({"settings": settings_dict})
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update song settings",
                )

            # Log the significant change
            logger.info(f"Full settings update for song {song_id}")

            return settings_update.settings

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating song settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update song settings",
            )

    async def update_song_settings_partial(
        self,
        song_id: str,
        partial_update: SongSettingsPartialUpdate,
        user: UserContext,
    ) -> SongSettings:
        """Update song settings partially (for auto-save functionality)."""
        self._check_database()

        try:
            # Get current settings
            current_settings = await self.get_song_settings(song_id, user)
            current_dict = current_settings.model_dump()

            # Store original for change tracking
            # original_settings = current_dict.copy()  # Available if needed

            # Apply partial updates - handle both old and new structure
            update_data = partial_update.model_dump(exclude_unset=True)
            changed_fields = []

            for key, value in update_data.items():
                if value is not None and key in current_dict:
                    if current_dict[key] != value:
                        changed_fields.append(key)
                        current_dict[key] = value

            # Handle backwards compatibility - map old fields to new structure
            if partial_update.narrative_pov is not None:
                current_dict["foundation"][
                    "point_of_view"
                ] = partial_update.narrative_pov
                changed_fields.append("foundation.point_of_view")
            if partial_update.central_theme is not None:
                current_dict["foundation"][
                    "central_theme"
                ] = partial_update.central_theme
                changed_fields.append("foundation.central_theme")
            if partial_update.target_duration_minutes is not None:
                current_dict["structure"][
                    "target_duration_minutes"
                ] = partial_update.target_duration_minutes
                changed_fields.append("structure.target_duration_minutes")
            if partial_update.overall_mood is not None:
                current_dict["style"]["overall_mood"] = partial_update.overall_mood
                changed_fields.append("style.overall_mood")
            if partial_update.energy_level is not None:
                current_dict["style"]["energy_level"] = partial_update.energy_level
                changed_fields.append("style.energy_level")
            if partial_update.ai_creativity_level is not None:
                current_dict["ai"][
                    "creativity_level"
                ] = partial_update.ai_creativity_level
                changed_fields.append("ai.creativity_level")

            # Only update if there are actual changes
            if not changed_fields:
                return current_settings

            # Create updated settings
            updated_settings = SongSettings(**current_dict)
            settings_dict = updated_settings.model_dump()

            # Update database
            response = (
                self.supabase.table("songs")
                .update({"settings": settings_dict})
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update song settings",
                )

            # Log the change for tracking (this will trigger the database trigger)
            logger.info(
                f"Settings updated for song {song_id}: {', '.join(changed_fields)}"
            )

            return updated_settings

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating song settings partially: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update song settings",
            )

    async def get_prosody_config(
        self, song_id: str, user: UserContext
    ) -> ProsodyConfig:
        """Get prosody configuration for a specific song."""
        self._check_database()

        try:
            response = (
                self.supabase.table("songs")
                .select("prosody_config")
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Song not found",
                )

            prosody_data = response.data[0].get("prosody_config", {})
            try:
                return (
                    ProsodyConfig(**prosody_data) if prosody_data else ProsodyConfig()
                )
            except Exception as e:
                logger.warning(f"Error parsing prosody config: {e}. Using defaults.")
                return ProsodyConfig()

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting prosody config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve prosody config",
            )

    async def update_prosody_config(
        self,
        song_id: str,
        config_update: ProsodyConfigUpdate,
        user: UserContext,
    ) -> ProsodyConfig:
        """Update prosody configuration for a specific song."""
        self._check_database()

        try:
            # Get current prosody config for change tracking
            # current_config = await self.get_prosody_config(song_id, user)  # Available if needed
            # current_dict = current_config.model_dump()  # Available if needed

            # Convert new config to dict for JSON storage
            config_dict = config_update.prosody_config.model_dump()

            # Update database
            response = (
                self.supabase.table("songs")
                .update({"prosody_config": config_dict})
                .eq("id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update prosody config",
                )

            # Log the change
            logger.info(f"Prosody config updated for song {song_id}")

            return config_update.prosody_config

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating prosody config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update prosody config",
            )

    async def create_song_version(
        self, song_id: str, version_data: SongVersionCreate, user: UserContext
    ) -> SongVersion:
        """Create a new version of a song."""
        self._check_database()

        try:
            # Get current song state
            current_song = await self.get_song(song_id, user)

            # Get next version number
            version_response = (
                self.supabase.table("song_versions")
                .select("version_number")
                .eq("song_id", song_id)
                .order("version_number", desc=True)
                .limit(1)
                .execute()
            )

            next_version = 1
            if version_response.data:
                next_version = version_response.data[0]["version_number"] + 1

            # Create version record
            version_dict = {
                "id": str(uuid.uuid4()),
                "song_id": song_id,
                "user_id": user.user_id,
                "version_number": next_version,
                "title": current_song.title,
                "content": current_song.lyrics,
                "metadata": current_song.metadata,
                "settings": current_song.settings.model_dump(),
                "prosody_config": (
                    await self.get_prosody_config(song_id, user)
                ).model_dump(),
                "change_summary": version_data.change_summary,
            }

            response = (
                self.supabase.table("song_versions").insert(version_dict).execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create song version",
                )

            return self._db_to_song_version(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating song version: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create song version",
            )

    async def get_song_versions(
        self,
        song_id: str,
        user: UserContext,
        page: int = 1,
        per_page: int = 10,
    ) -> SongVersionResponse:
        """Get version history for a song."""
        self._check_database()

        try:
            # Verify song exists and belongs to user
            await self.get_song(song_id, user)

            offset = (page - 1) * per_page

            # Get versions
            response = (
                self.supabase.table("song_versions")
                .select("*")
                .eq("song_id", song_id)
                .eq("user_id", user.user_id)
                .order("version_number", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            versions = [
                self._db_to_song_version(version_data) for version_data in response.data
            ]

            return SongVersionResponse(
                message="Song versions retrieved successfully",
                versions=versions,
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting song versions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve song versions",
            )

    async def get_settings_history(
        self,
        song_id: str,
        user: UserContext,
        page: int = 1,
        per_page: int = 10,
    ) -> SongSettingsHistoryResponse:
        """Get settings change history for a song."""
        self._check_database()

        try:
            # Verify song exists and belongs to user
            await self.get_song(song_id, user)

            offset = (page - 1) * per_page

            # Get total count
            count_response = (
                self.supabase.table("song_settings_history")
                .select("id", count="exact")
                .eq("song_id", song_id)
                .eq("user_id", user.user_id)
                .execute()
            )
            total = count_response.count or 0

            # Get history records
            response = (
                self.supabase.table("song_settings_history")
                .select("*")
                .eq("song_id", song_id)
                .eq("user_id", user.user_id)
                .order("created_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            history = [
                self._db_to_settings_history(history_data)
                for history_data in response.data
            ]

            return SongSettingsHistoryResponse(
                message="Settings history retrieved successfully",
                history=history,
                total=total,
                page=page,
                per_page=per_page,
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting settings history: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve settings history",
            )

    def _db_to_song_version(self, db_record: dict) -> SongVersion:
        """Convert database record to SongVersion model."""
        settings_data = db_record.get("settings", {})
        prosody_data = db_record.get("prosody_config", {})

        try:
            settings = (
                SongSettings(**settings_data) if settings_data else SongSettings()
            )
        except Exception as e:
            logger.warning(f"Error parsing version settings: {e}. Using defaults.")
            settings = SongSettings()

        try:
            prosody_config = (
                ProsodyConfig(**prosody_data) if prosody_data else ProsodyConfig()
            )
        except Exception as e:
            logger.warning(
                f"Error parsing version prosody config: {e}. Using defaults."
            )
            prosody_config = ProsodyConfig()

        return SongVersion(
            id=db_record["id"],
            song_id=db_record["song_id"],
            user_id=db_record["user_id"],
            version_number=db_record["version_number"],
            title=db_record["title"],
            content=db_record["content"],
            metadata=db_record.get("metadata", {}),
            settings=settings,
            prosody_config=prosody_config,
            change_summary=db_record.get("change_summary"),
            created_at=db_record["created_at"],
        )

    def _db_to_settings_history(self, db_record: dict) -> SongSettingsHistory:
        """Convert database record to SongSettingsHistory model."""
        return SongSettingsHistory(
            id=db_record["id"],
            song_id=db_record["song_id"],
            user_id=db_record["user_id"],
            settings_before=db_record.get("settings_before", {}),
            settings_after=db_record.get("settings_after", {}),
            prosody_config_before=db_record.get("prosody_config_before", {}),
            prosody_config_after=db_record.get("prosody_config_after", {}),
            changed_fields=db_record.get("changed_fields", []),
            change_type=db_record.get("change_type", "manual"),
            created_at=db_record["created_at"],
        )

    def _detect_settings_changes(
        self, old_settings: dict, new_settings: dict
    ) -> List[str]:
        """Detect which settings fields have changed between two settings objects."""
        changed_fields = []

        def compare_nested(old_dict, new_dict, prefix=""):
            for key in set(list(old_dict.keys()) + list(new_dict.keys())):
                full_key = f"{prefix}.{key}" if prefix else key

                old_val = old_dict.get(key)
                new_val = new_dict.get(key)

                if isinstance(old_val, dict) and isinstance(new_val, dict):
                    compare_nested(old_val, new_val, full_key)
                elif old_val != new_val:
                    changed_fields.append(full_key)

        compare_nested(old_settings, new_settings)
        return changed_fields

    async def create_settings_history_entry(
        self,
        song_id: str,
        user_id: str,
        old_settings: dict,
        new_settings: dict,
        old_prosody: dict = None,
        new_prosody: dict = None,
        change_type: str = "manual",
    ) -> None:
        """Manually create a settings history entry (useful for API-level tracking)."""
        try:
            changed_fields = self._detect_settings_changes(old_settings, new_settings)

            if old_prosody and new_prosody:
                prosody_changes = self._detect_settings_changes(
                    old_prosody, new_prosody
                )
                changed_fields.extend([f"prosody.{field}" for field in prosody_changes])

            if changed_fields:  # Only create entry if there are actual changes
                history_record = {
                    "id": str(uuid.uuid4()),
                    "song_id": song_id,
                    "user_id": user_id,
                    "settings_before": old_settings,
                    "settings_after": new_settings,
                    "prosody_config_before": old_prosody or {},
                    "prosody_config_after": new_prosody or {},
                    "changed_fields": changed_fields,
                    "change_type": change_type,
                }

                self.supabase.table("song_settings_history").insert(
                    history_record
                ).execute()
        except Exception as e:
            logger.warning(f"Failed to create settings history entry: {e}")


def create_songs_router(
    supabase_client: Optional[Client], get_current_user
) -> APIRouter:
    """Create songs router with dependencies."""
    print("DEBUGGING: Starting create_songs_router initialization")
    logger.info(
        "Creating songs router with supabase_client and get_current_user dependencies"
    )

    if supabase_client:
        print("DEBUGGING: supabase_client is available")
        logger.info("Supabase client is available for songs router")
    else:
        print("DEBUGGING: WARNING - supabase_client is None!")
        logger.warning("Supabase client is None - this may cause issues")

    router = APIRouter(prefix="/api/songs", tags=["songs"])
    songs_service = SongsService(supabase_client)

    print("DEBUGGING: Router and service created successfully")
    logger.info("Songs router and service initialized successfully")

    @router.post("/", response_model=SongResponse, status_code=status.HTTP_201_CREATED)
    async def create_song(
        song_data: SongCreate, user: UserContext = Depends(get_current_user)
    ) -> SongResponse:
        """Create a new song."""
        print(f"DEBUGGING: create_song endpoint called for user: {user.user_id}")
        print(f"DEBUGGING: Creating song with title: {song_data.title}")
        logger.info(
            f"Create song endpoint called for user: {user.user_id}, title: {song_data.title}"
        )

        try:
            song = await songs_service.create_song(song_data, user)
            print(f"DEBUGGING: Successfully created song: {song.title} (ID: {song.id})")
            logger.info(f"Successfully created song: {song.title} with ID: {song.id}")
            return SongResponse(message="Song created successfully", song=song)
        except Exception as e:
            print(f"DEBUGGING: Error in create_song endpoint: {str(e)}")
            logger.error(f"Error in create_song endpoint: {str(e)}")
            raise

    @router.get("/{song_id}", response_model=SongResponse)
    async def get_song(
        song_id: str, user: UserContext = Depends(get_current_user)
    ) -> SongResponse:
        """Get a song by ID."""
        print(f"DEBUGGING: get_song endpoint called with song_id: {song_id}")
        logger.info(
            f"Get song endpoint called for song_id: {song_id}, user_id: {user.user_id}"
        )

        try:
            song = await songs_service.get_song(song_id, user)
            print(
                f"DEBUGGING: Successfully retrieved song: {song.title} (ID: {song.id})"
            )
            logger.info(
                f"Successfully retrieved song: {song.title} for user: {user.user_id}"
            )
            return SongResponse(message="Song retrieved successfully", song=song)
        except Exception as e:
            print(f"DEBUGGING: Error in get_song endpoint: {str(e)}")
            logger.error(f"Error in get_song endpoint: {str(e)}")
            raise

    @router.get("/", response_model=SongListResponse)
    async def list_songs(
        user: UserContext = Depends(get_current_user),
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=100, description="Items per page"),
        status: Optional[SongStatus] = Query(None, description="Filter by status"),
    ) -> SongListResponse:
        """List songs for the current user."""
        print(f"DEBUGGING: list_songs endpoint called for user: {user.user_id}")
        print(
            f"DEBUGGING: Parameters - page: {page}, per_page: {per_page}, status: {status}"
        )
        logger.info(
            f"List songs endpoint called for user: {user.user_id}, page: {page}, per_page: {per_page}, status: {status}"
        )

        try:
            result = await songs_service.list_songs(user, page, per_page, status)
            print(
                f"DEBUGGING: Retrieved {len(result.songs)} songs, total: {result.total}"
            )
            logger.info(
                f"Successfully retrieved {len(result.songs)} songs for user: {user.user_id}"
            )
            return result
        except Exception as e:
            print(f"DEBUGGING: Error in list_songs endpoint: {str(e)}")
            logger.error(f"Error in list_songs endpoint: {str(e)}")
            raise

    @router.put("/{song_id}", response_model=SongResponse)
    async def update_song(
        song_id: str,
        song_update: SongUpdate,
        user: UserContext = Depends(get_current_user),
    ) -> SongResponse:
        """Update an existing song."""
        song = await songs_service.update_song(song_id, song_update, user)
        return SongResponse(message="Song updated successfully", song=song)

    @router.patch("/{song_id}", response_model=SongResponse)
    async def update_song_partial(
        song_id: str,
        song_update: SongUpdate,
        user: UserContext = Depends(get_current_user),
    ) -> SongResponse:
        """Partially update an existing song (for auto-save functionality)."""
        song = await songs_service.update_song(song_id, song_update, user)
        return SongResponse(message="Song updated successfully", song=song)

    @router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_song(
        song_id: str, user: UserContext = Depends(get_current_user)
    ) -> None:
        """Delete a song."""
        await songs_service.delete_song(song_id, user)
        return None

    @router.get("/{song_id}/settings", response_model=SongSettingsResponse)
    async def get_song_settings(
        song_id: str, user: UserContext = Depends(get_current_user)
    ):
        """Get settings for a specific song."""
        settings = await songs_service.get_song_settings(song_id, user)
        return SongSettingsResponse(
            message="Song settings retrieved successfully", settings=settings
        )

    @router.put("/{song_id}/settings", response_model=SongSettingsResponse)
    async def update_song_settings(
        song_id: str,
        settings_update: SongSettingsUpdate,
        user: UserContext = Depends(get_current_user),
    ):
        """Update settings for a specific song."""
        settings = await songs_service.update_song_settings(
            song_id, settings_update, user
        )
        return SongSettingsResponse(
            message="Song settings updated successfully", settings=settings
        )

    @router.patch("/{song_id}/settings", response_model=SongSettingsResponse)
    async def update_song_settings_partial(
        song_id: str,
        partial_update: SongSettingsPartialUpdate,
        user: UserContext = Depends(get_current_user),
    ):
        """Partially update song settings (for auto-save functionality)."""
        settings = await songs_service.update_song_settings_partial(
            song_id, partial_update, user
        )
        return SongSettingsResponse(
            message="Song settings updated successfully", settings=settings
        )

    @router.get("/{song_id}/prosody-config", response_model=ProsodyConfigResponse)
    async def get_prosody_config(
        song_id: str, user: UserContext = Depends(get_current_user)
    ):
        """Get prosody configuration for a specific song."""
        prosody_config = await songs_service.get_prosody_config(song_id, user)
        return ProsodyConfigResponse(
            message="Prosody config retrieved successfully",
            prosody_config=prosody_config,
        )

    @router.put("/{song_id}/prosody-config", response_model=ProsodyConfigResponse)
    async def update_prosody_config(
        song_id: str,
        config_update: ProsodyConfigUpdate,
        user: UserContext = Depends(get_current_user),
    ):
        """Update prosody configuration for a specific song."""
        prosody_config = await songs_service.update_prosody_config(
            song_id, config_update, user
        )
        return ProsodyConfigResponse(
            message="Prosody config updated successfully",
            prosody_config=prosody_config,
        )

    @router.post(
        "/{song_id}/versions",
        response_model=SongVersionResponse,
        status_code=status.HTTP_201_CREATED,
    )
    async def create_song_version(
        song_id: str,
        version_data: SongVersionCreate,
        user: UserContext = Depends(get_current_user),
    ):
        """Create a new version of a song."""
        version = await songs_service.create_song_version(song_id, version_data, user)
        return SongVersionResponse(
            message="Song version created successfully", version=version
        )

    @router.get("/{song_id}/versions", response_model=SongVersionResponse)
    async def get_song_versions(
        song_id: str,
        user: UserContext = Depends(get_current_user),
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=50, description="Items per page"),
    ):
        """Get version history for a song."""
        return await songs_service.get_song_versions(song_id, user, page, per_page)

    @router.get(
        "/{song_id}/settings/history",
        response_model=SongSettingsHistoryResponse,
    )
    async def get_settings_history(
        song_id: str,
        user: UserContext = Depends(get_current_user),
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=50, description="Items per page"),
    ):
        """Get settings change history for a song."""
        return await songs_service.get_settings_history(song_id, user, page, per_page)

    @router.post("/{song_id}/settings/validate", response_model=dict)
    async def validate_song_settings(
        song_id: str,
        settings: SongSettings,
        user: UserContext = Depends(get_current_user),
    ):
        """Validate song settings without saving them."""
        try:
            # Verify song exists and belongs to user
            await songs_service.get_song(song_id, user)

            # Validate settings by creating the model
            # validated_settings = SongSettings(**settings.model_dump())  # Available if needed
            SongSettings(**settings.model_dump())  # Validation check

            return {
                "valid": True,
                "message": "Settings are valid",
                "warnings": [],
                "errors": [],
            }
        except ValueError as e:
            return {
                "valid": False,
                "message": "Settings validation failed",
                "warnings": [],
                "errors": [str(e)],
            }

    @router.get("/{song_id}/settings/defaults", response_model=SongSettingsResponse)
    async def get_default_settings(
        song_id: str, user: UserContext = Depends(get_current_user)
    ):
        """Get default settings template for a song."""
        # Verify song exists and belongs to user
        await songs_service.get_song(song_id, user)

        default_settings = SongSettings()
        return SongSettingsResponse(
            message="Default settings retrieved successfully",
            settings=default_settings,
        )

    @router.post("/{song_id}/settings/reset", response_model=SongSettingsResponse)
    async def reset_song_settings(
        song_id: str, user: UserContext = Depends(get_current_user)
    ):
        """Reset song settings to defaults."""
        default_settings = SongSettings()
        settings_update = SongSettingsUpdate(settings=default_settings)

        updated_settings = await songs_service.update_song_settings(
            song_id, settings_update, user
        )
        return SongSettingsResponse(
            message="Settings reset to defaults successfully",
            settings=updated_settings,
        )

    print("DEBUGGING: Songs router fully configured and ready to return")
    logger.info("Songs router configuration completed successfully")
    return router
