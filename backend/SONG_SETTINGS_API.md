# Song Settings API Documentation

This document describes the comprehensive backend API for the song settings system that supports the consolidated frontend settings panel with 6 tabs.

## Overview

The song settings system provides a complete backend foundation for AI-assisted songwriting with comprehensive configuration options organized into 6 main categories:

1. **Foundation** - Core narrative elements (who, to whom, why, point of view)
2. **Structure** - Song organization and timing
3. **Sound** - Rhyme schemes and prosody settings
4. **Style** - Genre and artistic direction
5. **Content** - Keywords, metaphors, and content guidelines
6. **AI** - AI assistance configuration

## Data Structure

### Main Settings Model

```json
{
  "foundation": {
    "who_is_talking": "string|null",
    "to_whom": "string|null",
    "why_message": "string|null",
    "point_of_view": "first_person|second_person|third_person|direct_address",
    "central_theme": "string|null",
    "six_best_friends": {
      "who": "string|null",
      "what": "string|null",
      "when": "string|null",
      "where": "string|null",
      "why": "string|null",
      "how": "string|null"
    }
  },
  "structure": {
    "story_boxes": ["box_1", "box_2", "box_3"],
    "section_structure": [
      {
        "label": "Verse 1",
        "type": "verse|chorus|bridge|pre_chorus|intro|outro|hook|custom",
        "order": 0,
        "line_count_target": 8,
        "stress_count_target": 4,
        "custom_rhyme_scheme": "ABAB"
      }
    ],
    "target_duration_minutes": 3.5,
    "overall_energy_arc": "string|null"
  },
  "sound": {
    "rhyme_preferences": {
      "primary_types": ["perfect", "family", "additive", "subtractive", "assonance", "consonance"],
      "scheme_pattern": "ABAB",
      "allow_slant_rhymes": true,
      "emphasis_on_perfect": false
    },
    "prosody_settings": {
      "rhythmic_stability": 5,
      "phrasing_style": "front_heavy|back_heavy|balanced",
      "syllable_emphasis": true,
      "meter_consistency": 5
    },
    "syllable_emphasis": true,
    "rhythmic_consistency": 5
  },
  "style": {
    "primary_genre": "string|null",
    "sub_genres": ["indie", "rock"],
    "artist_references": ["Artist Name"],
    "innovation_level": 5,
    "avoid_cliches": true,
    "overall_mood": "string|null",
    "energy_level": 5
  },
  "content": {
    "primary_keywords": ["keyword1", "keyword2"],
    "metaphor_themes": ["weather", "journey"],
    "avoid_words": ["cliche1", "cliche2"],
    "synonym_groups": {
      "love": ["affection", "passion", "devotion"]
    },
    "content_guidelines": "string|null"
  },
  "ai": {
    "creativity_level": 5,
    "preserve_user_phrases": true,
    "auto_suggestions": true,
    "suggestion_frequency": 3,
    "writing_style_adaptation": true
  }
}
```

## API Endpoints

### Core Settings Operations

#### Get Song Settings
```http
GET /api/songs/{song_id}/settings
```
Returns the current settings for a song.

**Response:**
```json
{
  "message": "Song settings retrieved successfully",
  "settings": { /* SongSettings object */ }
}
```

#### Update All Settings
```http
PUT /api/songs/{song_id}/settings
```
Replace all settings for a song.

**Request Body:**
```json
{
  "settings": { /* Complete SongSettings object */ }
}
```

#### Partial Settings Update (Auto-save)
```http
PATCH /api/songs/{song_id}/settings
```
Update specific settings fields without replacing everything. Ideal for auto-save functionality.

**Request Body (New Structure):**
```json
{
  "foundation": {
    "central_theme": "Updated theme"
  },
  "style": {
    "energy_level": 7
  }
}
```

**Request Body (Backwards Compatible):**
```json
{
  "central_theme": "Updated theme",
  "energy_level": 7,
  "ai_creativity_level": 6
}
```

### Prosody Configuration

#### Get Prosody Config
```http
GET /api/songs/{song_id}/prosody-config
```

#### Update Prosody Config
```http
PUT /api/songs/{song_id}/prosody-config
```

**Request Body:**
```json
{
  "prosody_config": {
    "custom_meter_patterns": ["/u-u", "-u/u"],
    "stress_patterns": {
      "verse": [1, 0, 1, 0, 1, 0, 1, 0],
      "chorus": [1, 0, 0, 1, 1, 0, 0, 1]
    },
    "syllable_targets": {
      "verse": 8,
      "chorus": 6
    },
    "rhythm_constraints": {
      "allow_syncopation": true
    }
  }
}
```

### Version Control

#### Create Song Version
```http
POST /api/songs/{song_id}/versions
```
Create a snapshot of the current song state.

**Request Body:**
```json
{
  "change_summary": "Updated chorus melody and lyrics"
}
```

#### Get Version History
```http
GET /api/songs/{song_id}/versions?page=1&per_page=10
```

### Change Tracking

#### Get Settings Change History
```http
GET /api/songs/{song_id}/settings/history?page=1&per_page=10
```
View detailed history of settings changes with before/after comparisons.

### Utility Endpoints

#### Validate Settings
```http
POST /api/songs/{song_id}/settings/validate
```
Validate settings without saving them.

**Response:**
```json
{
  "valid": true,
  "message": "Settings are valid",
  "warnings": [],
  "errors": []
}
```

#### Get Default Settings
```http
GET /api/songs/{song_id}/settings/defaults
```
Get a template with default settings values.

#### Reset Settings
```http
POST /api/songs/{song_id}/settings/reset
```
Reset all settings to defaults.

## Validation Rules

### Foundation Tab
- `central_theme`: Max 500 characters
- `point_of_view`: Must be valid enum value

### Structure Tab
- `target_duration_minutes`: 0.5 - 15.0 minutes
- `section_structure`: Max 20 sections
- `line_count_target`: 1 - 50 lines
- `stress_count_target`: 1 - 20 stresses

### Sound Tab
- `rhythmic_stability`: 1 - 10
- `meter_consistency`: 1 - 10
- `custom_meter_patterns`: Must use only `/`, `-`, `u` characters

### Style Tab
- `energy_level`: 1 - 10
- `innovation_level`: 1 - 10
- `overall_mood`: Max 100 characters

### AI Tab
- `creativity_level`: 1 - 10
- `suggestion_frequency`: 1 - 5

## Database Schema

The settings are stored in PostgreSQL JSONB columns with the following schema:

```sql
-- Extended songs table
ALTER TABLE songs ADD COLUMN settings JSONB DEFAULT '{}';
ALTER TABLE songs ADD COLUMN prosody_config JSONB DEFAULT '{}';

-- Version history
CREATE TABLE song_versions (
    id UUID PRIMARY KEY,
    song_id UUID REFERENCES songs(id),
    user_id UUID REFERENCES users(id),
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    prosody_config JSONB DEFAULT '{}',
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(song_id, version_number)
);

-- Settings change tracking
CREATE TABLE song_settings_history (
    id UUID PRIMARY KEY,
    song_id UUID REFERENCES songs(id),
    user_id UUID REFERENCES users(id),
    settings_before JSONB DEFAULT '{}',
    settings_after JSONB DEFAULT '{}',
    prosody_config_before JSONB DEFAULT '{}',
    prosody_config_after JSONB DEFAULT '{}',
    changed_fields JSONB DEFAULT '[]',
    change_type VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Considerations

- JSONB columns allow efficient queries and indexing
- GIN indexes on settings fields for fast searches
- Automatic triggers track changes without manual intervention
- Pagination on history endpoints prevents large response payloads

## Backwards Compatibility

The API maintains full backwards compatibility with the previous field structure:
- Old field names like `narrative_pov`, `central_theme`, `energy_level` still work
- Partial updates automatically map legacy fields to new structure
- Existing database records are automatically parsed to new format

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Validation failed",
  "details": "Energy level must be between 1 and 10",
  "code": "VALIDATION_ERROR"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Song not found
- `500` - Internal server error

## Integration Examples

### Auto-save Implementation
```javascript
// Frontend auto-save every 2 seconds
const autoSave = debounce(async (changes) => {
  await fetch(`/api/songs/${songId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  });
}, 2000);

// Track field changes
onFieldChange((field, value) => {
  autoSave({ [field]: value });
});
```

### Settings Validation
```javascript
// Validate before major operations
const validateSettings = async (settings) => {
  const response = await fetch(`/api/songs/${songId}/settings/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  return response.json();
};
```

This comprehensive backend provides all the functionality needed to support the consolidated frontend settings panel with robust data management, validation, and change tracking capabilities.
