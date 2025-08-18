/**
 * API Index - Backward Compatibility Layer
 *
 * This file maintains backward compatibility while delegating to the new organized structure:
 * - Types from types/song.ts
 * - Utilities from utils/songDefaults.ts
 * - API client from lib/backendApi.ts
 */

// Re-export all types
export type {
  NarrativePOV,
  StructuralBox,
  RhymeType,
  ProsodyStyle,
  SectionType,
  SectionStructure,
  RhymePreferences,
  ProsodySettings,
  SixBestFriends,
  KeywordSettings,
  StyleGuide,
  SongSettings,
  Song,
  SongCreate,
  SongUpdate,
  SongSettingsUpdate,
  SongSettingsResponse,
  SongListResponse,
  SongResponse
} from '../types/song'

// Re-export constants
export {
  NARRATIVE_POV_OPTIONS,
  STRUCTURAL_BOX_OPTIONS,
  RHYME_TYPE_OPTIONS,
  PROSODY_STYLE_OPTIONS,
  SECTION_TYPE_OPTIONS
} from '../types/song'

// Re-export utilities
export {
  createDefaultSettings,
  createDefaultSectionStructure
} from '../utils/songDefaults'

// Re-export API client
export {
  backendApiClient,
  apiClient
} from './backendApi'
