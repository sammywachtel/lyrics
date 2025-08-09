import re
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    line_count_target: Optional[int] = Field(
        None, ge=1, le=50, description="Target number of lines"
    )
    stress_count_target: Optional[int] = Field(
        None, ge=1, le=20, description="Target stress count per line"
    )
    custom_rhyme_scheme: Optional[str] = Field(
        None, description="Custom rhyme scheme (e.g., 'ABAB')"
    )


class RhymePreferences(BaseModel):
    """Rhyme scheme and type preferences."""

    primary_types: List[RhymeType] = Field(
        default_factory=list, description="Preferred rhyme types"
    )
    scheme_pattern: Optional[str] = Field(
        None, description="Overall rhyme scheme pattern"
    )
    allow_slant_rhymes: bool = Field(True, description="Allow near/slant rhymes")
    emphasis_on_perfect: bool = Field(False, description="Emphasize perfect rhymes")


class ProsodySettings(BaseModel):
    """Prosody and rhythm settings."""

    rhythmic_stability: int = Field(
        5, ge=1, le=10, description="Rhythmic consistency (1=varied, 10=rigid)"
    )
    phrasing_style: ProsodyStyle = Field(
        ProsodyStyle.BALANCED, description="Phrase weight distribution"
    )
    syllable_emphasis: bool = Field(
        True, description="Consider syllable stress patterns"
    )
    meter_consistency: int = Field(
        5, ge=1, le=10, description="Meter consistency (1=free verse, 10=strict)"
    )


class SixBestFriends(BaseModel):
    """Core storytelling elements - Who, What, When, Where, Why, How."""

    who: Optional[str] = Field(None, description="Who is the song about?")
    what: Optional[str] = Field(None, description="What happens in the song?")
    when: Optional[str] = Field(None, description="When does it take place?")
    where: Optional[str] = Field(None, description="Where does it happen?")
    why: Optional[str] = Field(None, description="Why is this story important?")
    how: Optional[str] = Field(None, description="How does the story unfold?")


# Note: KeywordSettings moved to ContentSettings but keeping for backwards compatibility
class KeywordSettings(BaseModel):
    """[Deprecated] Keyword and metaphor management - use ContentSettings instead."""

    primary_keywords: List[str] = Field(
        default_factory=list, description="Primary keywords to include"
    )
    metaphor_themes: List[str] = Field(
        default_factory=list, description="Metaphorical themes to explore"
    )
    avoid_words: List[str] = Field(default_factory=list, description="Words to avoid")
    synonym_groups: Dict[str, List[str]] = Field(
        default_factory=dict, description="Synonym groups for variety"
    )


# Note: StyleGuide moved to StyleSettings but keeping for backwards compatibility
class StyleGuide(BaseModel):
    """[Deprecated] Genre and artist emulation settings - use StyleSettings instead."""

    primary_genre: Optional[str] = Field(None, description="Primary genre")
    sub_genres: List[str] = Field(
        default_factory=list, description="Sub-genres to incorporate"
    )
    artist_references: List[str] = Field(
        default_factory=list, description="Artists to emulate"
    )
    avoid_cliches: bool = Field(True, description="Avoid common genre cliches")
    innovation_level: int = Field(
        5, ge=1, le=10, description="Innovation vs tradition balance"
    )


class NarrativeSettings(BaseModel):
    """Foundation tab - Core narrative elements."""

    who_is_talking: Optional[str] = Field(None, description="Who is telling the story?")
    to_whom: Optional[str] = Field(None, description="Who is the audience/recipient?")
    why_message: Optional[str] = Field(
        None, description="Why is this message important?"
    )
    point_of_view: NarrativePOV = Field(
        NarrativePOV.FIRST_PERSON, description="Narrative perspective"
    )
    central_theme: Optional[str] = Field(None, description="Main theme or message")
    six_best_friends: SixBestFriends = Field(
        default_factory=SixBestFriends, description="Core story elements"
    )


class StructureSettings(BaseModel):
    """Structure tab - Song structure and organization."""

    story_boxes: List[StructuralBox] = Field(
        default_factory=list, description="Story progression boxes"
    )
    section_structure: List[SectionStructure] = Field(
        default_factory=list, description="Section organization"
    )
    target_duration_minutes: Optional[float] = Field(
        None, ge=0.5, le=15.0, description="Target song duration"
    )
    overall_energy_arc: Optional[str] = Field(
        None, description="Energy progression throughout song"
    )


class SoundSettings(BaseModel):
    """Sound tab - Rhyme schemes and prosody."""

    rhyme_preferences: RhymePreferences = Field(
        default_factory=RhymePreferences, description="Rhyme settings"
    )
    prosody_settings: ProsodySettings = Field(
        default_factory=ProsodySettings, description="Rhythm and meter"
    )
    syllable_emphasis: bool = Field(
        True, description="Consider syllable stress patterns"
    )
    rhythmic_consistency: int = Field(
        5, ge=1, le=10, description="How consistent should rhythm be"
    )


class StyleSettings(BaseModel):
    """Style tab - Genre and artistic direction."""

    primary_genre: Optional[str] = Field(None, description="Primary musical genre")
    sub_genres: List[str] = Field(
        default_factory=list, description="Additional genre influences"
    )
    artist_references: List[str] = Field(
        default_factory=list, description="Artists to emulate"
    )
    innovation_level: int = Field(
        5, ge=1, le=10, description="Innovation vs traditional balance"
    )
    avoid_cliches: bool = Field(True, description="Avoid common genre cliches")
    overall_mood: Optional[str] = Field(None, description="Emotional tone")
    energy_level: int = Field(5, ge=1, le=10, description="Energy intensity")


class ContentSettings(BaseModel):
    """Content tab - Keywords, metaphors, and content guidelines."""

    primary_keywords: List[str] = Field(
        default_factory=list, description="Key words to include"
    )
    metaphor_themes: List[str] = Field(
        default_factory=list, description="Metaphorical themes"
    )
    avoid_words: List[str] = Field(default_factory=list, description="Words to avoid")
    synonym_groups: Dict[str, List[str]] = Field(
        default_factory=dict, description="Synonym alternatives"
    )
    content_guidelines: Optional[str] = Field(
        None, description="Additional content guidance"
    )


class AISettings(BaseModel):
    """AI tab - AI assistance configuration."""

    creativity_level: int = Field(5, ge=1, le=10, description="AI creativity level")
    preserve_user_phrases: bool = Field(
        True, description="Preserve original user phrases"
    )
    auto_suggestions: bool = Field(True, description="Enable automatic suggestions")
    suggestion_frequency: int = Field(3, ge=1, le=5, description="How often to suggest")
    writing_style_adaptation: bool = Field(
        True, description="Adapt to user's writing style"
    )


class SongSettings(BaseModel):
    """Comprehensive song settings matching the consolidated frontend settings panel with 6 tabs."""

    # Foundation tab - Core narrative
    foundation: NarrativeSettings = Field(
        default_factory=NarrativeSettings, description="Foundation/narrative settings"
    )

    # Structure tab - Song organization
    structure: StructureSettings = Field(
        default_factory=StructureSettings, description="Structure settings"
    )

    # Sound tab - Rhyme and prosody
    sound: SoundSettings = Field(
        default_factory=SoundSettings, description="Sound/prosody settings"
    )

    # Style tab - Genre and artistic direction
    style: StyleSettings = Field(
        default_factory=StyleSettings, description="Style and genre settings"
    )

    # Content tab - Keywords and content guidelines
    content: ContentSettings = Field(
        default_factory=ContentSettings, description="Content management settings"
    )

    # AI tab - AI assistance configuration
    ai: AISettings = Field(
        default_factory=AISettings, description="AI assistance settings"
    )

    # Backwards compatibility fields (deprecated but maintained)
    narrative_pov: Optional[NarrativePOV] = Field(
        None, description="[Deprecated] Use foundation.point_of_view"
    )
    central_theme: Optional[str] = Field(
        None, description="[Deprecated] Use foundation.central_theme"
    )
    six_best_friends: Optional[SixBestFriends] = Field(
        None, description="[Deprecated] Use foundation.six_best_friends"
    )
    structural_boxes: Optional[List[StructuralBox]] = Field(
        None, description="[Deprecated] Use structure.story_boxes"
    )
    section_structure: Optional[List[SectionStructure]] = Field(
        None, description="[Deprecated] Use structure.section_structure"
    )
    rhyme_preferences: Optional[RhymePreferences] = Field(
        None, description="[Deprecated] Use sound.rhyme_preferences"
    )
    prosody_settings: Optional[ProsodySettings] = Field(
        None, description="[Deprecated] Use sound.prosody_settings"
    )
    keyword_settings: Optional[KeywordSettings] = Field(
        None, description="[Deprecated] Use content settings"
    )
    style_guide: Optional[StyleGuide] = Field(
        None, description="[Deprecated] Use style settings"
    )
    target_duration_minutes: Optional[float] = Field(
        None, description="[Deprecated] Use structure.target_duration_minutes"
    )
    overall_mood: Optional[str] = Field(
        None, description="[Deprecated] Use style.overall_mood"
    )
    energy_level: Optional[int] = Field(
        None, description="[Deprecated] Use style.energy_level"
    )
    ai_creativity_level: Optional[int] = Field(
        None, description="[Deprecated] Use ai.creativity_level"
    )
    preserve_user_phrases: Optional[bool] = Field(
        None, description="[Deprecated] Use ai.preserve_user_phrases"
    )
    auto_suggestions: Optional[bool] = Field(
        None, description="[Deprecated] Use ai.auto_suggestions"
    )

    @field_validator("foundation")
    @classmethod
    def validate_foundation(cls, v: NarrativeSettings) -> NarrativeSettings:
        """Validate foundation settings."""
        if v.central_theme and len(v.central_theme.strip()) == 0:
            v.central_theme = None
        if v.central_theme and len(v.central_theme) > 500:
            raise ValueError("Central theme must be less than 500 characters")
        return v

    @field_validator("structure")
    @classmethod
    def validate_structure(cls, v: StructureSettings) -> StructureSettings:
        """Validate structure settings."""
        if len(v.section_structure) > 20:
            raise ValueError("Cannot have more than 20 sections")

        # Ensure order values are sequential
        orders = [section.order for section in v.section_structure]
        if orders and orders != list(range(len(orders))):
            # Fix order if needed
            for i, section in enumerate(v.section_structure):
                section.order = i

        if v.target_duration_minutes is not None and (
            v.target_duration_minutes < 0.5 or v.target_duration_minutes > 15.0
        ):
            raise ValueError("Duration must be between 0.5 and 15.0 minutes")

        return v

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: StyleSettings) -> StyleSettings:
        """Validate style settings."""
        if v.overall_mood and len(v.overall_mood.strip()) == 0:
            v.overall_mood = None
        if v.overall_mood and len(v.overall_mood) > 100:
            raise ValueError("Overall mood must be less than 100 characters")
        return v

    @field_validator("ai")
    @classmethod
    def validate_ai(cls, v: AISettings) -> AISettings:
        """Validate AI settings."""
        if v.creativity_level < 1 or v.creativity_level > 10:
            raise ValueError("AI creativity level must be between 1 and 10")
        if v.suggestion_frequency < 1 or v.suggestion_frequency > 5:
            raise ValueError("Suggestion frequency must be between 1 and 5")
        return v


class SongBase(BaseModel):
    """Base song model with common fields."""

    title: str = Field(..., min_length=1, max_length=200, description="Song title")
    artist: Optional[str] = Field(None, max_length=100, description="Artist name")
    lyrics: str = Field("", description="Song lyrics content")
    status: SongStatus = Field(SongStatus.DRAFT, description="Song status")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    settings: SongSettings = Field(
        default_factory=SongSettings, description="Comprehensive song settings"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata for backwards compatibility",
    )


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

    model_config = ConfigDict(from_attributes=True)


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


class ProsodyConfig(BaseModel):
    """Advanced prosody configuration for detailed rhythm and meter control."""

    custom_meter_patterns: List[str] = Field(
        default_factory=list, description="Custom meter patterns"
    )
    stress_patterns: Dict[str, List[int]] = Field(
        default_factory=dict, description="Stress patterns by section"
    )
    syllable_targets: Dict[str, int] = Field(
        default_factory=dict, description="Syllable targets by section"
    )
    rhythm_constraints: Dict[str, Any] = Field(
        default_factory=dict, description="Additional rhythm constraints"
    )

    @field_validator("custom_meter_patterns")
    @classmethod
    def validate_meter_patterns(cls, v: List[str]) -> List[str]:
        valid_pattern = re.compile(r"^[/\-u]+$")
        for pattern in v:
            if not valid_pattern.match(pattern):
                raise ValueError(
                    f'Invalid meter pattern: {pattern}. Use only "/", "-", and "u" characters'
                )
        return v


class SongVersion(BaseModel):
    """Song version for history tracking."""

    id: str = Field(..., description="Version ID")
    song_id: str = Field(..., description="Parent song ID")
    user_id: str = Field(..., description="User who created this version")
    version_number: int = Field(..., description="Version number")
    title: str = Field(..., description="Song title at this version")
    content: str = Field(..., description="Song content at this version")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Metadata at this version"
    )
    settings: SongSettings = Field(
        default_factory=lambda: SongSettings(), description="Settings at this version"
    )
    prosody_config: ProsodyConfig = Field(
        default_factory=ProsodyConfig, description="Prosody config at this version"
    )
    change_summary: Optional[str] = Field(
        None, description="Summary of changes in this version"
    )
    created_at: datetime = Field(..., description="Version creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class SongVersionCreate(BaseModel):
    """Model for creating a new song version."""

    change_summary: Optional[str] = Field(None, description="Summary of changes")


class SongVersionResponse(BaseModel):
    """API response for song version operations."""

    message: str
    version: Optional[SongVersion] = None
    versions: Optional[List[SongVersion]] = None


class SongSettingsHistory(BaseModel):
    """Settings change history record."""

    id: str = Field(..., description="History record ID")
    song_id: str = Field(..., description="Song ID")
    user_id: str = Field(..., description="User ID")
    settings_before: Dict[str, Any] = Field(
        default_factory=dict, description="Settings before change"
    )
    settings_after: Dict[str, Any] = Field(
        default_factory=dict, description="Settings after change"
    )
    prosody_config_before: Dict[str, Any] = Field(
        default_factory=dict, description="Prosody config before change"
    )
    prosody_config_after: Dict[str, Any] = Field(
        default_factory=dict, description="Prosody config after change"
    )
    changed_fields: List[str] = Field(
        default_factory=list, description="List of changed field names"
    )
    change_type: str = Field("manual", description="Type of change (manual, auto, ai)")
    created_at: datetime = Field(..., description="Change timestamp")

    model_config = ConfigDict(from_attributes=True)


class SongSettingsHistoryResponse(BaseModel):
    """API response for settings history."""

    message: str
    history: List[SongSettingsHistory]
    total: int
    page: int
    per_page: int


class ProsodyConfigUpdate(BaseModel):
    """Model for updating prosody configuration."""

    prosody_config: ProsodyConfig = Field(
        ..., description="Updated prosody configuration"
    )


class ProsodyConfigResponse(BaseModel):
    """API response for prosody config operations."""

    message: str
    prosody_config: Optional[ProsodyConfig] = None


class SongSettingsPartialUpdate(BaseModel):
    """Model for partial settings updates (for auto-save functionality)."""

    # New consolidated structure
    foundation: Optional[NarrativeSettings] = None
    structure: Optional[StructureSettings] = None
    sound: Optional[SoundSettings] = None
    style: Optional[StyleSettings] = None
    content: Optional[ContentSettings] = None
    ai: Optional[AISettings] = None

    # Backwards compatibility - deprecated fields
    narrative_pov: Optional[NarrativePOV] = None
    central_theme: Optional[str] = None
    six_best_friends: Optional[SixBestFriends] = None
    structural_boxes: Optional[List[StructuralBox]] = None
    section_structure: Optional[List[SectionStructure]] = None
    rhyme_preferences: Optional[RhymePreferences] = None
    prosody_settings: Optional[ProsodySettings] = None
    keyword_settings: Optional[KeywordSettings] = None
    style_guide: Optional[StyleGuide] = None
    target_duration_minutes: Optional[float] = None
    overall_mood: Optional[str] = None
    energy_level: Optional[int] = None
    ai_creativity_level: Optional[int] = None
    preserve_user_phrases: Optional[bool] = None
    auto_suggestions: Optional[bool] = None

    @field_validator("target_duration_minutes")
    @classmethod
    def validate_duration(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0.5 or v > 15.0):
            raise ValueError("Duration must be between 0.5 and 15.0 minutes")
        return v

    @field_validator("energy_level")
    @classmethod
    def validate_energy_level(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 10):
            raise ValueError("Energy level must be between 1 and 10")
        return v

    @field_validator("ai_creativity_level")
    @classmethod
    def validate_ai_creativity_level(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 10):
            raise ValueError("AI creativity level must be between 1 and 10")
        return v


class UserContext(BaseModel):
    """User context from authentication."""

    user_id: str
    email: Optional[str] = None
    is_authenticated: bool = True
