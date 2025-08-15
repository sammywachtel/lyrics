/**
 * Song-related type definitions
 *
 * Moved from lib/api.ts for better organization
 */

// Enums matching backend
export type NarrativePOV = 'first_person' | 'second_person' | 'third_person' | 'direct_address'
export type StructuralBox = 'box_1' | 'box_2' | 'box_3'
export type RhymeType = 'perfect' | 'family' | 'additive' | 'subtractive' | 'assonance' | 'consonance'
export type ProsodyStyle = 'front_heavy' | 'back_heavy' | 'balanced'
export type SectionType = 'verse' | 'chorus' | 'bridge' | 'pre_chorus' | 'intro' | 'outro' | 'hook' | 'custom'

// Setting interfaces matching backend models
export interface SectionStructure {
  label: string
  type: SectionType
  order: number
  line_count_target?: number
  stress_count_target?: number
  custom_rhyme_scheme?: string
}

export interface RhymePreferences {
  primary_types: RhymeType[]
  scheme_pattern?: string
  allow_slant_rhymes: boolean
  emphasis_on_perfect: boolean
}

export interface ProsodySettings {
  rhythmic_stability: number
  phrasing_style: ProsodyStyle
  syllable_emphasis: boolean
  meter_consistency: number
}

export interface SixBestFriends {
  who?: string
  what?: string
  when?: string
  where?: string
  why?: string
  how?: string
}

export interface KeywordSettings {
  primary_keywords: string[]
  metaphor_themes: string[]
  avoid_words: string[]
  synonym_groups: Record<string, string[]>
}

export interface StyleGuide {
  primary_genre?: string
  sub_genres: string[]
  artist_references: string[]
  avoid_cliches: boolean
  innovation_level: number
}

export interface SongSettings {
  // Core Narrative
  narrative_pov: NarrativePOV
  central_theme?: string
  six_best_friends: SixBestFriends

  // Structure
  structural_boxes: StructuralBox[]
  section_structure: SectionStructure[]

  // Rhyme and Prosody
  rhyme_preferences: RhymePreferences
  prosody_settings: ProsodySettings

  // Content and Style
  keyword_settings: KeywordSettings
  style_guide: StyleGuide

  // Global Targets
  target_duration_minutes?: number
  overall_mood?: string
  energy_level: number

  // AI Assistance
  ai_creativity_level: number
  preserve_user_phrases: boolean
  auto_suggestions: boolean
}

// Main Song interface
export interface Song {
  id: string
  user_id: string
  title: string
  artist?: string
  lyrics: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  settings: SongSettings
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SongCreate {
  title: string
  artist?: string
  lyrics: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  settings?: SongSettings
  metadata: Record<string, unknown>
}

export interface SongUpdate {
  title?: string
  artist?: string
  lyrics?: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags?: string[]
  settings?: SongSettings
  metadata?: Record<string, unknown>
}

export interface SongSettingsUpdate {
  settings: SongSettings
}

export interface SongSettingsResponse {
  message: string
  settings?: SongSettings
}

export interface SongListResponse {
  songs: Song[]
  total: number
  page: number
  per_page: number
}

export interface SongResponse {
  message: string
  song?: Song
  songs?: Song[]
}

// Constants for form options
export const NARRATIVE_POV_OPTIONS: Array<{ value: NarrativePOV; label: string }> = [
  { value: 'first_person', label: 'First Person (I, me, my)' },
  { value: 'second_person', label: 'Second Person (You, your)' },
  { value: 'third_person', label: 'Third Person (He, she, they)' },
  { value: 'direct_address', label: 'Direct Address' },
]

export const STRUCTURAL_BOX_OPTIONS: Array<{ value: StructuralBox; label: string }> = [
  { value: 'box_1', label: 'Box 1 - Setup/Introduction' },
  { value: 'box_2', label: 'Box 2 - Development/Conflict' },
  { value: 'box_3', label: 'Box 3 - Resolution/Conclusion' },
]

export const RHYME_TYPE_OPTIONS: Array<{ value: RhymeType; label: string }> = [
  { value: 'perfect', label: 'Perfect Rhymes' },
  { value: 'family', label: 'Family Rhymes' },
  { value: 'additive', label: 'Additive Rhymes' },
  { value: 'subtractive', label: 'Subtractive Rhymes' },
  { value: 'assonance', label: 'Assonance' },
  { value: 'consonance', label: 'Consonance' },
]

export const PROSODY_STYLE_OPTIONS: Array<{ value: ProsodyStyle; label: string }> = [
  { value: 'front_heavy', label: 'Front-Heavy Phrasing' },
  { value: 'back_heavy', label: 'Back-Heavy Phrasing' },
  { value: 'balanced', label: 'Balanced Phrasing' },
]

export const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string }> = [
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'pre_chorus', label: 'Pre-Chorus' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'hook', label: 'Hook' },
  { value: 'custom', label: 'Custom' },
]
