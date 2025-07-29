from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum


class SongStatus(str, Enum):
    """Song status enumeration."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class NarrativePOV(str, Enum):
    """Narrative point of view options."""
    FIRST_PERSON = "first_person"
    SECOND_PERSON = "second_person"
    THIRD_PERSON = "third_person"
    DIRECT_ADDRESS = "direct_address"


class StructuralBox(str, Enum):
    """Structural boxes for song progression."""
    BOX_1 = "box_1"
    BOX_2 = "box_2"
    BOX_3 = "box_3"


class RhymeType(str, Enum):
    """Types of rhyme schemes."""
    PERFECT = "perfect"
    FAMILY = "family"
    ADDITIVE = "additive"
    SUBTRACTIVE = "subtractive"
    ASSONANCE = "assonance"
    CONSONANCE = "consonance"


class ProsodyStyle(str, Enum):
    """Prosody/rhythm style preferences."""
    FRONT_HEAVY = "front_heavy"
    BACK_HEAVY = "back_heavy"
    BALANCED = "balanced"


class SectionType(str, Enum):
    """Common song section types."""
    VERSE = "verse"
    CHORUS = "chorus"
    BRIDGE = "bridge"
    PRE_CHORUS = "pre_chorus"
    INTRO = "intro"
    OUTRO = "outro"
    HOOK = "hook"
    CUSTOM = "custom"


class SectionStructure(BaseModel):
    """Configuration for a song section."""
    label: str = Field(..., description="Section label (e.g., 'Verse 1', 'Chorus')")
    type: SectionType = Field(SectionType.CUSTOM, description="Section type")
    order: int = Field(..., description="Order in song structure")
    line_count_target: Optional[int] = Field(None, ge=1, le=50, description="Target number of lines")
    stress_count_target: Optional[int] = Field(None, ge=1, le=20, description="Target stress count per line")
    custom_rhyme_scheme: Optional[str] = Field(None, description="Custom rhyme scheme (e.g., 'ABAB')")


class RhymePreferences(BaseModel):
    """Rhyme scheme and type preferences."""
    primary_types: List[RhymeType] = Field(default_factory=list, description="Preferred rhyme types")
    scheme_pattern: Optional[str] = Field(None, description="Overall rhyme scheme pattern")
    allow_slant_rhymes: bool = Field(True, description="Allow near/slant rhymes")
    emphasis_on_perfect: bool = Field(False, description="Emphasize perfect rhymes")


class ProsodySettings(BaseModel):
    """Prosody and rhythm settings."""
    rhythmic_stability: int = Field(5, ge=1, le=10, description="Rhythmic consistency (1=varied, 10=rigid)")
    phrasing_style: ProsodyStyle = Field(ProsodyStyle.BALANCED, description="Phrase weight distribution")
    syllable_emphasis: bool = Field(True, description="Consider syllable stress patterns")
    meter_consistency: int = Field(5, ge=1, le=10, description="Meter consistency (1=free verse, 10=strict)")


class SixBestFriends(BaseModel):
    """Core storytelling elements - Who, What, When, Where, Why, How."""
    who: Optional[str] = Field(None, description="Who is the song about?")
    what: Optional[str] = Field(None, description="What happens in the song?")
    when: Optional[str] = Field(None, description="When does it take place?")
    where: Optional[str] = Field(None, description="Where does it happen?")
    why: Optional[str] = Field(None, description="Why is this story important?")
    how: Optional[str] = Field(None, description="How does the story unfold?")


class KeywordSettings(BaseModel):
    """Keyword and metaphor management."""
    primary_keywords: List[str] = Field(default_factory=list, description="Primary keywords to include")
    metaphor_themes: List[str] = Field(default_factory=list, description="Metaphorical themes to explore")
    avoid_words: List[str] = Field(default_factory=list, description="Words to avoid")
    synonym_groups: Dict[str, List[str]] = Field(default_factory=dict, description="Synonym groups for variety")


class StyleGuide(BaseModel):
    """Genre and artist emulation settings."""
    primary_genre: Optional[str] = Field(None, description="Primary genre")
    sub_genres: List[str] = Field(default_factory=list, description="Sub-genres to incorporate")
    artist_references: List[str] = Field(default_factory=list, description="Artists to emulate")
    avoid_cliches: bool = Field(True, description="Avoid common genre cliches")
    innovation_level: int = Field(5, ge=1, le=10, description="Innovation vs tradition balance")


class SongSettings(BaseModel):
    """Comprehensive song settings for AI-assisted songwriting."""
    
    # Core Narrative
    narrative_pov: NarrativePOV = Field(NarrativePOV.FIRST_PERSON, description="Narrative point of view")
    central_theme: Optional[str] = Field(None, description="Central theme/message of the song")
    six_best_friends: SixBestFriends = Field(default_factory=SixBestFriends, description="Core story elements")
    
    # Structure
    structural_boxes: List[StructuralBox] = Field(default_factory=list, description="Structural progression boxes")
    section_structure: List[SectionStructure] = Field(default_factory=list, description="Song section configuration")
    
    # Rhyme and Prosody
    rhyme_preferences: RhymePreferences = Field(default_factory=RhymePreferences, description="Rhyme settings")
    prosody_settings: ProsodySettings = Field(default_factory=ProsodySettings, description="Rhythm and meter settings")
    
    # Content and Style
    keyword_settings: KeywordSettings = Field(default_factory=KeywordSettings, description="Keyword management")
    style_guide: StyleGuide = Field(default_factory=StyleGuide, description="Genre and style preferences")
    
    # Global Targets
    target_duration_minutes: Optional[float] = Field(None, ge=0.5, le=15.0, description="Target song duration")
    overall_mood: Optional[str] = Field(None, description="Overall emotional mood")
    energy_level: int = Field(5, ge=1, le=10, description="Energy level (1=calm, 10=intense)")
    
    # AI Assistance
    ai_creativity_level: int = Field(5, ge=1, le=10, description="AI creativity (1=conservative, 10=experimental)")
    preserve_user_phrases: bool = Field(True, description="Preserve user's original phrases when editing")
    auto_suggestions: bool = Field(True, description="Enable automatic suggestions")


class SongBase(BaseModel):
    """Base song model with common fields."""
    title: str = Field(..., min_length=1, max_length=200, description="Song title")
    artist: Optional[str] = Field(None, max_length=100, description="Artist name")
    lyrics: str = Field("", description="Song lyrics content")
    status: SongStatus = Field(SongStatus.DRAFT, description="Song status")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    settings: SongSettings = Field(default_factory=SongSettings, description="Comprehensive song settings")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata for backwards compatibility")


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
    settings: Optional[SongSettings] = None
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


class SongSettingsUpdate(BaseModel):
    """Model for updating only song settings."""
    settings: SongSettings = Field(..., description="Updated song settings")


class SongSettingsResponse(BaseModel):
    """API response for song settings operations."""
    message: str
    settings: Optional[SongSettings] = None


class UserContext(BaseModel):
    """User context from authentication."""
    user_id: str
    email: Optional[str] = None
    is_authenticated: bool = True