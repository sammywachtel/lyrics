import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from datetime import datetime, timezone

from app.main import app
from app.models import (
    SongSettings, NarrativePOV, StructuralBox, RhymeType, ProsodyStyle, 
    SectionType, SongSettingsUpdate, SongCreate, SongUpdate
)
from app.songs import SongsService


# Mock user context for testing
MOCK_USER = {
    "user_id": "test-user-123",
    "email": "test@example.com",
    "is_authenticated": True
}

MOCK_SONG_ID = "test-song-456"

# Sample settings data for testing
SAMPLE_SETTINGS = {
    "narrative_pov": "first_person",
    "central_theme": "Love conquers all",
    "six_best_friends": {
        "who": "Young lovers",
        "what": "Overcome obstacles",
        "when": "Summer nights",
        "where": "Small town",
        "why": "True love endures",
        "how": "Through determination"
    },
    "structural_boxes": ["box_1", "box_2"],
    "section_structure": [
        {
            "label": "Verse 1",
            "type": "verse",
            "order": 0,
            "line_count_target": 4,
            "stress_count_target": 8
        },
        {
            "label": "Chorus",
            "type": "chorus",
            "order": 1,
            "line_count_target": 4,
            "stress_count_target": 6
        }
    ],
    "rhyme_preferences": {
        "primary_types": ["perfect", "family"],
        "scheme_pattern": "ABAB",
        "allow_slant_rhymes": True,
        "emphasis_on_perfect": False
    },
    "prosody_settings": {
        "rhythmic_stability": 7,
        "phrasing_style": "balanced",
        "syllable_emphasis": True,
        "meter_consistency": 6
    },
    "keyword_settings": {
        "primary_keywords": ["love", "forever", "dreams"],
        "metaphor_themes": ["journey", "light"],
        "avoid_words": ["hate", "never"],
        "synonym_groups": {
            "love": ["affection", "devotion", "passion"]
        }
    },
    "style_guide": {
        "primary_genre": "Pop",
        "sub_genres": ["Acoustic Pop", "Indie Pop"],
        "artist_references": ["Taylor Swift", "Ed Sheeran"],
        "avoid_cliches": True,
        "innovation_level": 6
    },
    "target_duration_minutes": 3.5,
    "overall_mood": "Romantic",
    "energy_level": 7,
    "ai_creativity_level": 5,
    "preserve_user_phrases": True,
    "auto_suggestions": True
}

MOCK_SONG_DATA = {
    "id": MOCK_SONG_ID,
    "user_id": MOCK_USER["user_id"],
    "title": "Test Song",
    "content": "Test lyrics content",
    "metadata": {"artist": "Test Artist", "tags": ["test"], "status": "draft"},
    "settings": SAMPLE_SETTINGS,
    "is_archived": False,
    "created_at": datetime.now(timezone.utc).isoformat(),
    "updated_at": datetime.now(timezone.utc).isoformat()
}


class TestSongSettingsModels:
    """Test Pydantic models for song settings."""
    
    def test_song_settings_model_creation(self):
        """Test creating SongSettings model with valid data."""
        settings = SongSettings(**SAMPLE_SETTINGS)
        
        assert settings.narrative_pov == NarrativePOV.FIRST_PERSON
        assert settings.central_theme == "Love conquers all"
        assert len(settings.structural_boxes) == 2
        assert settings.structural_boxes[0] == StructuralBox.BOX_1
        assert len(settings.section_structure) == 2
        assert settings.section_structure[0].label == "Verse 1"
        assert settings.section_structure[0].type == SectionType.VERSE
        assert settings.rhyme_preferences.primary_types == [RhymeType.PERFECT, RhymeType.FAMILY]
        assert settings.prosody_settings.phrasing_style == ProsodyStyle.BALANCED
        assert settings.energy_level == 7
    
    def test_song_settings_defaults(self):
        """Test SongSettings model with default values."""
        settings = SongSettings()
        
        assert settings.narrative_pov == NarrativePOV.FIRST_PERSON
        assert settings.central_theme is None
        assert settings.six_best_friends.who is None
        assert settings.structural_boxes == []
        assert settings.section_structure == []
        assert settings.rhyme_preferences.allow_slant_rhymes is True
        assert settings.prosody_settings.rhythmic_stability == 5
        assert settings.energy_level == 5
        assert settings.ai_creativity_level == 5
        assert settings.preserve_user_phrases is True
        assert settings.auto_suggestions is True
    
    def test_section_structure_validation(self):
        """Test SectionStructure validation."""
        from app.models import SectionStructure
        
        # Valid section
        section = SectionStructure(
            label="Test Section",
            type=SectionType.VERSE,
            order=0,
            line_count_target=4,
            stress_count_target=8
        )
        
        assert section.label == "Test Section"
        assert section.type == SectionType.VERSE
        assert section.order == 0
        assert section.line_count_target == 4
        assert section.stress_count_target == 8
    
    def test_settings_update_model(self):
        """Test SongSettingsUpdate model."""
        settings = SongSettings(**SAMPLE_SETTINGS)
        update = SongSettingsUpdate(settings=settings)
        
        assert update.settings.narrative_pov == NarrativePOV.FIRST_PERSON
        assert update.settings.central_theme == "Love conquers all"
    
    def test_invalid_enum_values(self):
        """Test validation with invalid enum values."""
        with pytest.raises(ValueError):
            SongSettings(narrative_pov="invalid_pov")
        
        with pytest.raises(ValueError):
            SongSettings(prosody_settings={
                "rhythmic_stability": 5,
                "phrasing_style": "invalid_style",
                "syllable_emphasis": True,
                "meter_consistency": 5
            })


class TestSongsService:
    """Test SongsService methods for settings operations."""
    
    @pytest.fixture
    def mock_supabase(self):
        """Create mock Supabase client."""
        mock_client = Mock()
        mock_client.table.return_value = mock_client
        return mock_client
    
    @pytest.fixture
    def songs_service(self, mock_supabase):
        """Create SongsService instance with mock client."""
        return SongsService(mock_supabase)
    
    def test_get_song_settings_success(self, songs_service, mock_supabase):
        """Test successful retrieval of song settings."""
        # Mock successful response
        mock_response = Mock()
        mock_response.data = [{"settings": SAMPLE_SETTINGS}]
        mock_supabase.execute.return_value = mock_response
        
        # Call service method
        result = songs_service.get_song_settings(MOCK_SONG_ID, MOCK_USER)
        
        # Verify response
        assert isinstance(result, SongSettings)
        assert result.narrative_pov == NarrativePOV.FIRST_PERSON
        assert result.central_theme == "Love conquers all"
        
        # Verify database call
        mock_supabase.select.assert_called_with("settings")
        mock_supabase.eq.assert_any_call("id", MOCK_SONG_ID)
        mock_supabase.eq.assert_any_call("user_id", MOCK_USER["user_id"])
    
    def test_get_song_settings_not_found(self, songs_service, mock_supabase):
        """Test song not found error."""
        # Mock empty response
        mock_response = Mock()
        mock_response.data = []
        mock_supabase.execute.return_value = mock_response
        
        # Call service method and expect exception
        with pytest.raises(Exception) as exc_info:
            songs_service.get_song_settings(MOCK_SONG_ID, MOCK_USER)
        
        assert "Song not found" in str(exc_info.value)
    
    def test_get_song_settings_empty_settings(self, songs_service, mock_supabase):
        """Test handling of empty settings data."""
        # Mock response with empty settings
        mock_response = Mock()
        mock_response.data = [{"settings": {}}]
        mock_supabase.execute.return_value = mock_response
        
        # Call service method
        result = songs_service.get_song_settings(MOCK_SONG_ID, MOCK_USER)
        
        # Should return default settings
        assert isinstance(result, SongSettings)
        assert result.narrative_pov == NarrativePOV.FIRST_PERSON
        assert result.energy_level == 5
    
    def test_update_song_settings_success(self, songs_service, mock_supabase):
        """Test successful settings update."""
        # Mock existing song check
        mock_get_song = Mock()
        mock_get_song.data = [MOCK_SONG_DATA]
        
        # Mock update response
        mock_update = Mock()
        mock_update.data = [MOCK_SONG_DATA]
        mock_supabase.execute.side_effect = [mock_get_song, mock_update]
        
        # Create settings update
        settings = SongSettings(**SAMPLE_SETTINGS)
        settings_update = SongSettingsUpdate(settings=settings)
        
        # Call service method
        result = songs_service.update_song_settings(MOCK_SONG_ID, settings_update, MOCK_USER)
        
        # Verify response
        assert isinstance(result, SongSettings)
        assert result.narrative_pov == NarrativePOV.FIRST_PERSON
        
        # Verify database calls
        assert mock_supabase.execute.call_count == 2  # get + update
    
    def test_create_song_with_settings(self, songs_service, mock_supabase):
        """Test creating song with settings."""
        # Mock successful creation
        mock_response = Mock()
        mock_response.data = [MOCK_SONG_DATA]
        mock_supabase.execute.return_value = mock_response
        
        # Create song with settings
        song_data = SongCreate(
            title="Test Song",
            lyrics="Test lyrics",
            status="draft",
            tags=["test"],
            settings=SongSettings(**SAMPLE_SETTINGS),
            metadata={}
        )
        
        # Call service method
        result = songs_service.create_song(song_data, MOCK_USER)
        
        # Verify response
        assert result.title == "Test Song"
        assert isinstance(result.settings, SongSettings)
        assert result.settings.narrative_pov == NarrativePOV.FIRST_PERSON
    
    def test_update_song_with_settings(self, songs_service, mock_supabase):
        """Test updating song with new settings."""
        # Mock existing song and update response
        mock_get_song = Mock()
        mock_get_song.data = [MOCK_SONG_DATA]
        
        updated_song_data = MOCK_SONG_DATA.copy()
        updated_song_data["settings"]["energy_level"] = 9
        
        mock_update = Mock()
        mock_update.data = [updated_song_data]
        mock_supabase.execute.side_effect = [mock_get_song, mock_update]
        
        # Create updated settings
        new_settings = SongSettings(**SAMPLE_SETTINGS)
        new_settings.energy_level = 9
        
        song_update = SongUpdate(
            title="Updated Song",
            settings=new_settings
        )
        
        # Call service method
        result = songs_service.update_song(MOCK_SONG_ID, song_update, MOCK_USER)
        
        # Verify response
        assert result.title == "Updated Song"
        assert result.settings.energy_level == 9


class TestSongSettingsAPI:
    """Test API endpoints for song settings."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_auth(self):
        """Mock authentication."""
        with patch('app.auth.get_current_user') as mock:
            mock.return_value = MOCK_USER
            yield mock
    
    @pytest.fixture
    def mock_supabase_client(self):
        """Mock Supabase client."""
        with patch('app.main.supabase') as mock:
            yield mock
    
    def test_get_song_settings_endpoint(self, client, mock_auth, mock_supabase_client):
        """Test GET /api/songs/{id}/settings endpoint."""
        # Mock successful response
        mock_response = Mock()
        mock_response.data = [{"settings": SAMPLE_SETTINGS}]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        # Make request
        response = client.get(f"/api/songs/{MOCK_SONG_ID}/settings")
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Song settings retrieved successfully"
        assert data["settings"]["narrative_pov"] == "first_person"
        assert data["settings"]["energy_level"] == 7
    
    def test_update_song_settings_endpoint(self, client, mock_auth, mock_supabase_client):
        """Test PUT /api/songs/{id}/settings endpoint."""
        # Mock existing song check
        mock_get_response = Mock()
        mock_get_response.data = [MOCK_SONG_DATA]
        
        # Mock update response
        mock_update_response = Mock()
        mock_update_response.data = [MOCK_SONG_DATA]
        
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_get_response
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_update_response
        
        # Prepare request data
        request_data = {
            "settings": SAMPLE_SETTINGS
        }
        
        # Make request
        response = client.put(
            f"/api/songs/{MOCK_SONG_ID}/settings",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Song settings updated successfully"
        assert data["settings"]["narrative_pov"] == "first_person"
    
    def test_update_song_settings_invalid_data(self, client, mock_auth):
        """Test settings update with invalid data."""
        # Prepare invalid request data
        invalid_data = {
            "settings": {
                "narrative_pov": "invalid_pov",  # Invalid enum value
                "energy_level": 15  # Out of range
            }
        }
        
        # Make request
        response = client.put(
            f"/api/songs/{MOCK_SONG_ID}/settings",
            json=invalid_data
        )
        
        # Verify validation error
        assert response.status_code == 422
    
    def test_song_settings_not_found(self, client, mock_auth, mock_supabase_client):
        """Test settings endpoint with non-existent song."""
        # Mock empty response
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        # Make request
        response = client.get(f"/api/songs/nonexistent-id/settings")
        
        # Verify 404 response
        assert response.status_code == 404


if __name__ == "__main__":
    # Run tests with: python -m pytest test_song_settings.py -v
    pytest.main([__file__, "-v"])