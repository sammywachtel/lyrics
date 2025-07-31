# Comprehensive Song Settings Backend Implementation

## Overview

This document summarizes the comprehensive backend support for the song settings system that has been implemented to support the frontend consolidated settings panel with 6 tabs (Foundation, Structure, Sound, Style, Content, AI).

## Database Schema Extensions

### 1. Enhanced Songs Table
- **Added**: `prosody_config JSONB DEFAULT '{}'` column for advanced rhythm and meter control
- **Existing**: `settings JSONB DEFAULT '{}'` column for main settings

### 2. New Tables Created

#### `song_versions` Table
```sql
- id UUID (Primary Key)
- song_id UUID (Foreign Key to songs)
- user_id UUID (Foreign Key to users)
- version_number INTEGER
- title TEXT
- content TEXT
- metadata JSONB
- settings JSONB
- prosody_config JSONB
- change_summary TEXT
- created_at TIMESTAMP
```

#### `song_settings_history` Table
```sql
- id UUID (Primary Key)  
- song_id UUID (Foreign Key to songs)
- user_id UUID (Foreign Key to users)
- settings_before JSONB
- settings_after JSONB
- prosody_config_before JSONB
- prosody_config_after JSONB
- changed_fields JSONB
- change_type VARCHAR(50)
- created_at TIMESTAMP
```

### 3. Database Triggers & Functions
- **Auto-versioning**: Automatically creates song versions on major content changes
- **Settings tracking**: Tracks all settings changes for history/audit
- **RLS policies**: Row-level security for all new tables
- **Performance indexes**: GIN indexes for JSON queries, composite indexes for version lookups

## Pydantic Models Enhancement

### 1. Core Settings Models (Updated)

#### `SongSettings` - Matches Frontend Structure Exactly
```python
class SongSettings(BaseModel):
    # Narrative tab (Foundation)
    narrative_pov: NarrativePOV = "first_person"
    central_theme: Optional[str] = None
    six_best_friends: SixBestFriends = Field(default_factory=SixBestFriends)
    
    # Structure tab
    structural_boxes: List[StructuralBox] = Field(default_factory=list)
    section_structure: List[SectionStructure] = Field(default_factory=list)
    
    # Sound tab (Rhyme & Prosody)
    rhyme_preferences: RhymePreferences = Field(default_factory=RhymePreferences)
    prosody_settings: ProsodySettings = Field(default_factory=ProsodySettings)
    
    # Style & Content tabs
    keyword_settings: KeywordSettings = Field(default_factory=KeywordSettings)
    style_guide: StyleGuide = Field(default_factory=StyleGuide)
    
    # Global Targets
    target_duration_minutes: Optional[float] = None
    overall_mood: Optional[str] = None
    energy_level: int = 5  # 1-10 scale
    
    # AI tab
    ai_creativity_level: int = 5  # 1-10 scale
    preserve_user_phrases: bool = True
    auto_suggestions: bool = True
```

### 2. New Advanced Models

#### `ProsodyConfig` - Advanced Rhythm Control
```python
class ProsodyConfig(BaseModel):
    custom_meter_patterns: List[str] = Field(default_factory=list)
    stress_patterns: Dict[str, List[int]] = Field(default_factory=dict)
    syllable_targets: Dict[str, int] = Field(default_factory=dict)
    rhythm_constraints: Dict[str, Any] = Field(default_factory=dict)
```

#### `SongSettingsPartialUpdate` - Auto-save Support
```python
class SongSettingsPartialUpdate(BaseModel):
    # All fields optional for partial updates
    narrative_pov: Optional[NarrativePOV] = None
    central_theme: Optional[str] = None
    # ... all other settings fields as optional
```

### 3. Version Control Models

#### `SongVersion` - Version History
```python
class SongVersion(BaseModel):
    id: str
    song_id: str
    user_id: str
    version_number: int
    title: str
    content: str
    metadata: Dict[str, Any]
    settings: SongSettings
    prosody_config: ProsodyConfig
    change_summary: Optional[str]
    created_at: datetime
```

#### `SongSettingsHistory` - Change Tracking
```python
class SongSettingsHistory(BaseModel):
    id: str
    song_id: str
    user_id: str
    settings_before: Dict[str, Any]
    settings_after: Dict[str, Any]
    prosody_config_before: Dict[str, Any]
    prosody_config_after: Dict[str, Any]
    changed_fields: List[str]
    change_type: str  # manual, auto, ai
    created_at: datetime
```

## API Endpoints

### 1. Settings Management
```
GET    /api/songs/{id}/settings          - Get current settings
PUT    /api/songs/{id}/settings          - Update complete settings
PATCH  /api/songs/{id}/settings          - Partial update (auto-save)
```

### 2. Prosody Configuration  
```
GET    /api/songs/{id}/prosody-config    - Get prosody config
PUT    /api/songs/{id}/prosody-config    - Update prosody config
```

### 3. Version History
```
POST   /api/songs/{id}/versions          - Create new version
GET    /api/songs/{id}/versions          - Get version history
```

### 4. Change Tracking
```
GET    /api/songs/{id}/settings/history  - Get settings change history
```

## Business Logic Features

### 1. Comprehensive Validation
- **Field validation**: Range checks for numeric fields (energy_level: 1-10)
- **Content validation**: Length limits for text fields
- **Structure validation**: Section order consistency
- **Meter pattern validation**: Prosody patterns use valid symbols
- **Enum validation**: All enums match frontend options exactly

### 2. Auto-save Support
- **Partial updates**: Only update changed fields
- **Optimistic merging**: Merge partial updates with existing settings
- **Change detection**: Track what fields were modified
- **Conflict resolution**: Handle concurrent updates gracefully

### 3. Version Control
- **Automatic versioning**: Create versions on major content changes
- **Manual versioning**: Allow explicit version creation
- **Change summaries**: Track reasons for version creation
- **History preservation**: Keep complete snapshots of all versions

### 4. Settings History
- **Change tracking**: Log all settings modifications
- **Before/after snapshots**: Complete audit trail
- **Change types**: Distinguish manual vs AI changes
- **Field-level tracking**: Know exactly what changed

## Frontend Integration Points

### 1. Tab Structure Mapping
- **Narrative tab** → `narrative_pov`, `central_theme`, `six_best_friends`
- **Structure tab** → `structural_boxes`, `section_structure`  
- **Rhyme tab** → `rhyme_preferences`
- **Prosody tab** → `prosody_settings` + `prosody_config`
- **Keywords tab** → `keyword_settings`
- **Style tab** → `style_guide`
- **Targets tab** → `target_duration_minutes`, `overall_mood`, `energy_level`
- **AI tab** → `ai_creativity_level`, `preserve_user_phrases`, `auto_suggestions`

### 2. Real-time Features Ready
- **WebSocket foundation**: Database triggers ready for real-time notifications
- **Change events**: Settings history provides change event stream
- **Conflict detection**: Version control prevents data loss
- **Auto-save endpoints**: PATCH endpoints for seamless auto-save

### 3. Data Consistency
- **Exact model matching**: Backend models match frontend interfaces precisely
- **Serialization compatibility**: Full JSON serialization/deserialization
- **Default value consistency**: Same defaults between frontend and backend
- **Validation alignment**: Same validation rules in both layers

## Performance Optimizations

### 1. Database Indexes
- **GIN indexes**: For JSON field queries
- **Composite indexes**: For version and history lookups
- **User-scoped indexes**: Optimize for per-user queries
- **Timestamp indexes**: Fast chronological queries

### 2. Query Optimization
- **Selective loading**: Get only settings when needed
- **Pagination support**: Version history and change history
- **Efficient updates**: Only update changed fields
- **Bulk operations**: Ready for batch settings updates

### 3. Caching Ready
- **Structured models**: Easy to cache with Redis
- **Version-aware**: Cache invalidation on version changes
- **Partial updates**: Cache partial settings efficiently

## Error Handling & Logging

### 1. Comprehensive Error Responses
- **Validation errors**: Detailed field-level error messages
- **Business logic errors**: Clear error descriptions
- **Authentication errors**: Proper 401/403 responses
- **Not found errors**: Consistent 404 handling

### 2. Logging & Monitoring
- **Settings changes**: Log all modifications
- **Performance tracking**: Monitor API response times
- **Error tracking**: Capture and categorize errors
- **User activity**: Track settings usage patterns

## Security Features

### 1. Row-Level Security
- **User isolation**: Users can only access their own data
- **History protection**: Settings history secured per user
- **Version control**: Version history properly isolated

### 2. Input Validation
- **XSS prevention**: Sanitize all text inputs
- **Injection protection**: Parameterized queries only
- **Data limits**: Prevent oversized payloads
- **Rate limiting ready**: API structure supports rate limiting

## Testing & Quality Assurance

### 1. Comprehensive Test Suite
- **Model validation tests**: All Pydantic models tested
- **API endpoint tests**: Complete API coverage
- **Business logic tests**: Settings operations tested
- **Integration tests**: Full request/response cycle tested

### 2. Data Integrity
- **Constraint validation**: Database-level data integrity
- **Transaction safety**: Atomic operations for complex updates
- **Rollback capability**: Version control enables safe rollbacks
- **Backup-friendly**: Full data export/import capability

## Deployment Readiness

### 1. Production Ready
- **Environment configuration**: Settings via environment variables
- **Database migrations**: Schema changes versioned and documented
- **Health checks**: API health endpoints implemented
- **Monitoring hooks**: Ready for APM integration

### 2. Scalability
- **Stateless design**: Horizontal scaling ready
- **Database optimization**: Efficient queries and indexes
- **Caching integration**: Redis-ready architecture
- **CDN compatible**: Static assets can be CDN-served

## Summary

The comprehensive song settings backend now provides:

✅ **Complete frontend support** - All 6 settings tabs fully supported
✅ **Advanced prosody control** - Detailed rhythm and meter configuration  
✅ **Version history** - Full version control with change tracking
✅ **Auto-save functionality** - Partial updates for seamless UX
✅ **Change audit trail** - Complete history of all modifications
✅ **Performance optimized** - Efficient queries and caching ready
✅ **Production ready** - Security, validation, and error handling
✅ **Real-time ready** - WebSocket foundation for live collaboration
✅ **Scalable architecture** - Horizontal scaling and monitoring ready

The backend now provides comprehensive support for the sophisticated songwriting assistance features envisioned in the frontend, with robust data management, version control, and performance optimization.