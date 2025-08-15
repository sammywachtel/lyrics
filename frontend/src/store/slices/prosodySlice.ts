/**
 * Prosody Slice - Stress Analysis State Management
 *
 * Manages prosody analysis state, caching, and UI preferences
 * for stress patterns, syllable analysis, and related features.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface SyllableAnalysis {
  text: string
  stressed: boolean
  confidence: number
}

export interface LineAnalysis {
  line: string
  syllables: SyllableAnalysis[]
  confidence: number
  meter?: string // e.g., "iambic pentameter"
  pattern?: string // e.g., "da-DUM da-DUM da-DUM"
}

export interface ProsodyState {
  // Analysis cache (keyed by line content)
  analysisCache: Record<string, LineAnalysis>

  // Current analysis state
  currentAnalysis: {
    songId: string | null
    lines: LineAnalysis[]
    isAnalyzing: boolean
    lastAnalyzed: string | null
  } | null

  // UI preferences
  visualizationMode: 'marks' | 'colors' | 'both'
  showConfidenceScores: boolean
  autoAnalyze: boolean

  // Analysis settings
  analysisSettings: {
    minConfidence: number // 0-1 scale
    showLowConfidence: boolean
    highlightMeter: boolean
  }

  // Error state
  lastError: string | null
}

const initialState: ProsodyState = {
  analysisCache: {},
  currentAnalysis: null,
  visualizationMode: 'both',
  showConfidenceScores: false,
  autoAnalyze: true,
  analysisSettings: {
    minConfidence: 0.7,
    showLowConfidence: true,
    highlightMeter: true,
  },
  lastError: null,
}

const prosodySlice = createSlice({
  name: 'prosody',
  initialState,
  reducers: {
    // Analysis Management
    startAnalysis: (state, action: PayloadAction<{ songId: string; lines: string[] }>) => {
      const { songId, lines } = action.payload
      state.currentAnalysis = {
        songId,
        lines: lines.map(line => ({
          line,
          syllables: [],
          confidence: 0,
        })),
        isAnalyzing: true,
        lastAnalyzed: null,
      }
      state.lastError = null
    },

    completeAnalysis: (state, action: PayloadAction<LineAnalysis[]>) => {
      if (state.currentAnalysis) {
        state.currentAnalysis.lines = action.payload
        state.currentAnalysis.isAnalyzing = false
        state.currentAnalysis.lastAnalyzed = new Date().toISOString()

        // Update cache
        action.payload.forEach(lineAnalysis => {
          state.analysisCache[lineAnalysis.line] = lineAnalysis
        })
      }
    },

    failAnalysis: (state, action: PayloadAction<string>) => {
      if (state.currentAnalysis) {
        state.currentAnalysis.isAnalyzing = false
      }
      state.lastError = action.payload
    },

    clearAnalysis: (state) => {
      state.currentAnalysis = null
      state.lastError = null
    },

    // Cache Management
    updateCache: (state, action: PayloadAction<Record<string, LineAnalysis>>) => {
      Object.assign(state.analysisCache, action.payload)
    },

    clearCache: (state) => {
      state.analysisCache = {}
    },

    removeFromCache: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(line => {
        delete state.analysisCache[line]
      })
    },

    // UI Preferences
    setVisualizationMode: (state, action: PayloadAction<'marks' | 'colors' | 'both'>) => {
      state.visualizationMode = action.payload
    },

    toggleConfidenceScores: (state) => {
      state.showConfidenceScores = !state.showConfidenceScores
    },

    toggleAutoAnalyze: (state) => {
      state.autoAnalyze = !state.autoAnalyze
    },

    // Analysis Settings
    setMinConfidence: (state, action: PayloadAction<number>) => {
      state.analysisSettings.minConfidence = Math.max(0, Math.min(1, action.payload))
    },

    toggleShowLowConfidence: (state) => {
      state.analysisSettings.showLowConfidence = !state.analysisSettings.showLowConfidence
    },

    toggleHighlightMeter: (state) => {
      state.analysisSettings.highlightMeter = !state.analysisSettings.highlightMeter
    },

    // Individual Line Updates (for real-time editing)
    updateLineAnalysis: (state, action: PayloadAction<{ originalLine: string; newLine: string }>) => {
      const { originalLine, newLine } = action.payload

      // Update current analysis if it exists
      if (state.currentAnalysis) {
        const lineIndex = state.currentAnalysis.lines.findIndex(l => l.line === originalLine)
        if (lineIndex !== -1) {
          state.currentAnalysis.lines[lineIndex].line = newLine
          // Clear analysis for updated line (will be re-analyzed)
          state.currentAnalysis.lines[lineIndex].syllables = []
          state.currentAnalysis.lines[lineIndex].confidence = 0
        }
      }

      // Remove old cache entry and mark for re-analysis
      if (state.analysisCache[originalLine]) {
        delete state.analysisCache[originalLine]
      }
    },

    // Error Management
    clearError: (state) => {
      state.lastError = null
    },
  },
})

// Export actions
export const {
  startAnalysis,
  completeAnalysis,
  failAnalysis,
  clearAnalysis,
  updateCache,
  clearCache,
  removeFromCache,
  setVisualizationMode,
  toggleConfidenceScores,
  toggleAutoAnalyze,
  setMinConfidence,
  toggleShowLowConfidence,
  toggleHighlightMeter,
  updateLineAnalysis,
  clearError,
} = prosodySlice.actions

// Selectors
export const selectAnalysisCache = (state: { prosody: ProsodyState }) => state.prosody.analysisCache
export const selectCurrentAnalysis = (state: { prosody: ProsodyState }) => state.prosody.currentAnalysis
export const selectIsAnalyzing = (state: { prosody: ProsodyState }) =>
  state.prosody.currentAnalysis?.isAnalyzing ?? false
export const selectVisualizationMode = (state: { prosody: ProsodyState }) => state.prosody.visualizationMode
export const selectShowConfidenceScores = (state: { prosody: ProsodyState }) => state.prosody.showConfidenceScores
export const selectAutoAnalyze = (state: { prosody: ProsodyState }) => state.prosody.autoAnalyze
export const selectAnalysisSettings = (state: { prosody: ProsodyState }) => state.prosody.analysisSettings
export const selectLastError = (state: { prosody: ProsodyState }) => state.prosody.lastError

// Complex selectors
export const selectCachedAnalysis = (line: string) => (state: { prosody: ProsodyState }) =>
  state.prosody.analysisCache[line]

export const selectAnalysisForSong = (songId: string) => (state: { prosody: ProsodyState }) =>
  state.prosody.currentAnalysis?.songId === songId ? state.prosody.currentAnalysis.lines : []

export default prosodySlice.reducer
