/**
 * Mock API module for testing
 */

export interface Song {
  id: string
  user_id: string
  title: string
  artist?: string
  lyrics: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  created_at: string
  updated_at: string
  settings: Record<string, unknown>
  metadata: Record<string, unknown>
}

export const createDefaultSettings = () => ({
  narrative_pov: 'first_person',
  central_theme: undefined,
  six_best_friends: {},
  structural_boxes: [],
  section_structure: [],
  rhyme_preferences: {
    primary_types: [],
    allow_slant_rhymes: true,
    emphasis_on_perfect: false,
  },
  prosody_settings: {
    rhythmic_stability: 0.5,
    phrasing_style: 'balanced',
    syllable_emphasis: false,
    meter_consistency: 0.5,
  },
  keyword_settings: {
    primary_keywords: [],
    metaphor_themes: [],
  },
  style_guide: {
    voice_guidelines: '',
    prohibited_words: [],
  },
})

// Mock API client
export const api = {
  songs: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}
