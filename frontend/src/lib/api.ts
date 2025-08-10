import { supabase } from './supabase'

// Simple fallback to avoid Jest parsing issues with import.meta
const API_BASE_URL = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  ? 'http://localhost:8001'  // Test environment
  : (typeof window !== 'undefined' && (window as { __VITE_API_URL__?: string }).__VITE_API_URL__) || 'http://localhost:8001'  // Use environment variable or fallback to local

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

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session }, error } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (error) {
      console.warn('Error getting session:', error)
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        console.warn('Received 401, attempting to refresh session...')

        // Try to refresh the session
        const { data: { session }, error } = await supabase.auth.refreshSession()

        if (session && !error) {
          console.log('Session refreshed successfully, retrying request')

          // Retry with new token
          headers = await this.getAuthHeaders()
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              ...options.headers,
            },
          })

          if (retryResponse.ok) {
            return retryResponse.json()
          }
        }

        // If refresh failed or retry still got 401, sign out
        console.warn('Session refresh failed or retry unsuccessful, signing out user')
        await supabase.auth.signOut()
        throw new Error('Session expired. Please log in again.')
      }

      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Song API methods
  async createSong(songData: SongCreate): Promise<SongResponse> {
    return this.request<SongResponse>('/api/songs/', {
      method: 'POST',
      body: JSON.stringify(songData),
    })
  }

  async getSong(songId: string): Promise<SongResponse> {
    return this.request<SongResponse>(`/api/songs/${songId}`)
  }

  async listSongs(
    page: number = 1,
    perPage: number = 10,
    status?: string
  ): Promise<SongListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })

    if (status) {
      params.append('status', status)
    }

    return this.request<SongListResponse>(`/api/songs/?${params}`)
  }

  async updateSong(songId: string, songData: SongUpdate): Promise<SongResponse> {
    return this.request<SongResponse>(`/api/songs/${songId}`, {
      method: 'PUT',
      body: JSON.stringify(songData),
    })
  }

  async deleteSong(songId: string): Promise<void> {
    await this.request<void>(`/api/songs/${songId}`, {
      method: 'DELETE',
    })
  }

  // Song Settings API methods
  async getSongSettings(songId: string): Promise<SongSettingsResponse> {
    return this.request<SongSettingsResponse>(`/api/songs/${songId}/settings`)
  }

  async updateSongSettings(songId: string, settingsData: SongSettingsUpdate): Promise<SongSettingsResponse> {
    return this.request<SongSettingsResponse>(`/api/songs/${songId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return this.request<{ status: string; timestamp: string; database: string }>('/health')
  }
}

export const apiClient = new ApiClient()

// Helper functions for creating default settings
export const createDefaultSettings = (): SongSettings => ({
  // Core Narrative
  narrative_pov: 'first_person',
  central_theme: undefined,
  six_best_friends: {},

  // Structure
  structural_boxes: [],
  section_structure: [],

  // Rhyme and Prosody
  rhyme_preferences: {
    primary_types: [],
    allow_slant_rhymes: true,
    emphasis_on_perfect: false,
  },
  prosody_settings: {
    rhythmic_stability: 5,
    phrasing_style: 'balanced',
    syllable_emphasis: true,
    meter_consistency: 5,
  },

  // Content and Style
  keyword_settings: {
    primary_keywords: [],
    metaphor_themes: [],
    avoid_words: [],
    synonym_groups: {},
  },
  style_guide: {
    sub_genres: [],
    artist_references: [],
    avoid_cliches: true,
    innovation_level: 5,
  },

  // Global Targets
  energy_level: 5,

  // AI Assistance
  ai_creativity_level: 5,
  preserve_user_phrases: true,
  auto_suggestions: true,
})

export const createDefaultSectionStructure = (order: number): SectionStructure => ({
  label: `Section ${order + 1}`,
  type: 'custom',
  order,
})

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
