/**
 * Songs Slice - Local State Management
 *
 * Manages client-side song state including current song selection,
 * editing state, and UI-specific song data that doesn't belong in the API cache.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SongState {
  // Currently selected/active song
  currentSongId: string | null

  // UI state for song management
  isCreating: boolean
  isEditing: boolean

  // Local draft state for unsaved changes
  localDraft: {
    songId: string | null
    title: string
    content: string
    hasUnsavedChanges: boolean
    lastSaved: string | null
  } | null

  // UI preferences
  viewMode: 'edit' | 'preview' | 'split'
  showProsody: boolean
  showSectionTags: boolean

  // Selection and cursor state
  selection: {
    start: number
    end: number
  } | null
}

const initialState: SongState = {
  currentSongId: null,
  isCreating: false,
  isEditing: false,
  localDraft: null,
  viewMode: 'edit',
  showProsody: true,
  showSectionTags: true,
  selection: null,
}

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Song Selection
    setCurrentSong: (state, action: PayloadAction<string | null>) => {
      state.currentSongId = action.payload
      // Clear draft when switching songs
      state.localDraft = null
      state.isEditing = false
    },

    // Creation/Editing State
    startCreatingSong: (state) => {
      state.isCreating = true
      state.currentSongId = null
      state.localDraft = {
        songId: null,
        title: '',
        content: '',
        hasUnsavedChanges: false,
        lastSaved: null,
      }
    },

    cancelCreatingSong: (state) => {
      state.isCreating = false
      state.localDraft = null
    },

    startEditingSong: (state, action: PayloadAction<{ id: string; title: string; content: string }>) => {
      const { id, title, content } = action.payload
      state.isEditing = true
      state.currentSongId = id
      state.localDraft = {
        songId: id,
        title,
        content,
        hasUnsavedChanges: false,
        lastSaved: new Date().toISOString(),
      }
    },

    stopEditingSong: (state) => {
      state.isEditing = false
      state.localDraft = null
    },

    // Draft Management
    updateDraftTitle: (state, action: PayloadAction<string>) => {
      if (state.localDraft) {
        state.localDraft.title = action.payload
        state.localDraft.hasUnsavedChanges = true
      }
    },

    updateDraftContent: (state, action: PayloadAction<string>) => {
      if (state.localDraft) {
        state.localDraft.content = action.payload
        state.localDraft.hasUnsavedChanges = true
      }
    },

    markDraftSaved: (state) => {
      if (state.localDraft) {
        state.localDraft.hasUnsavedChanges = false
        state.localDraft.lastSaved = new Date().toISOString()
      }
    },

    discardDraft: (state) => {
      state.localDraft = null
      state.isEditing = false
      state.isCreating = false
    },

    // View Preferences
    setViewMode: (state, action: PayloadAction<'edit' | 'preview' | 'split'>) => {
      state.viewMode = action.payload
    },

    toggleProsodyView: (state) => {
      state.showProsody = !state.showProsody
    },

    toggleSectionTags: (state) => {
      state.showSectionTags = !state.showSectionTags
    },

    // Text Selection
    setTextSelection: (state, action: PayloadAction<{ start: number; end: number } | null>) => {
      state.selection = action.payload
    },

    // Auto-save functionality
    autoSaveDraft: (state) => {
      if (state.localDraft?.hasUnsavedChanges) {
        // This action can be listened to by middleware for auto-save
        state.localDraft.lastSaved = new Date().toISOString()
      }
    },
  },
})

// Export actions
export const {
  setCurrentSong,
  startCreatingSong,
  cancelCreatingSong,
  startEditingSong,
  stopEditingSong,
  updateDraftTitle,
  updateDraftContent,
  markDraftSaved,
  discardDraft,
  setViewMode,
  toggleProsodyView,
  toggleSectionTags,
  setTextSelection,
  autoSaveDraft,
} = songsSlice.actions

// Selectors
export const selectCurrentSongId = (state: { songs: SongState }) => state.songs.currentSongId
export const selectIsCreating = (state: { songs: SongState }) => state.songs.isCreating
export const selectIsEditing = (state: { songs: SongState }) => state.songs.isEditing
export const selectLocalDraft = (state: { songs: SongState }) => state.songs.localDraft
export const selectHasUnsavedChanges = (state: { songs: SongState }) =>
  state.songs.localDraft?.hasUnsavedChanges ?? false
export const selectViewMode = (state: { songs: SongState }) => state.songs.viewMode
export const selectShowProsody = (state: { songs: SongState }) => state.songs.showProsody
export const selectShowSectionTags = (state: { songs: SongState }) => state.songs.showSectionTags
export const selectTextSelection = (state: { songs: SongState }) => state.songs.selection

export default songsSlice.reducer
