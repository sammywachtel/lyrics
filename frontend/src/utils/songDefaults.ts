/**
 * Song default utilities
 *
 * Moved from lib/api.ts for better organization
 */

import type { SongSettings, SectionStructure } from '../types/song'

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
