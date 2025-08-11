/**
 * Tests for Songs Redux Slice
 */

import { configureStore } from '@reduxjs/toolkit'
import songsReducer, {
  setCurrentSong,
  startCreatingSong,
  cancelCreatingSong,
  startEditingSong,
  stopEditingSong,
  updateDraftTitle,
  updateDraftContent,
  markDraftSaved,
  setViewMode,
  toggleProsodyView,
} from '../slices/songsSlice'
import type { SongState } from '../slices/songsSlice'

// Helper to create a test store with songs slice
const createTestStore = (initialState?: Partial<SongState>) => {
  return configureStore({
    reducer: {
      songs: songsReducer,
    },
    preloadedState: initialState ? { songs: { ...getInitialState(), ...initialState } } : undefined,
  })
}

const getInitialState = (): SongState => ({
  currentSongId: null,
  isCreating: false,
  isEditing: false,
  localDraft: null,
  viewMode: 'edit',
  showProsody: true,
  showSectionTags: true,
  selection: null,
})

describe('songsSlice', () => {
  describe('song selection', () => {
    it('should set current song', () => {
      const store = createTestStore()

      store.dispatch(setCurrentSong('song-1'))

      const state = store.getState().songs
      expect(state.currentSongId).toBe('song-1')
      expect(state.localDraft).toBeNull()
      expect(state.isEditing).toBe(false)
    })

    it('should clear current song', () => {
      const store = createTestStore({
        currentSongId: 'song-1',
        localDraft: {
          songId: 'song-1',
          title: 'Test',
          content: 'Content',
          hasUnsavedChanges: true,
          lastSaved: null,
        },
      })

      store.dispatch(setCurrentSong(null))

      const state = store.getState().songs
      expect(state.currentSongId).toBeNull()
      expect(state.localDraft).toBeNull()
      expect(state.isEditing).toBe(false)
    })
  })

  describe('song creation', () => {
    it('should start creating song', () => {
      const store = createTestStore()

      store.dispatch(startCreatingSong())

      const state = store.getState().songs
      expect(state.isCreating).toBe(true)
      expect(state.currentSongId).toBeNull()
      expect(state.localDraft).toEqual({
        songId: null,
        title: '',
        content: '',
        hasUnsavedChanges: false,
        lastSaved: null,
      })
    })

    it('should cancel creating song', () => {
      const store = createTestStore({
        isCreating: true,
        localDraft: {
          songId: null,
          title: 'Draft title',
          content: 'Draft content',
          hasUnsavedChanges: true,
          lastSaved: null,
        },
      })

      store.dispatch(cancelCreatingSong())

      const state = store.getState().songs
      expect(state.isCreating).toBe(false)
      expect(state.localDraft).toBeNull()
    })
  })

  describe('song editing', () => {
    it('should start editing song', () => {
      const store = createTestStore()

      store.dispatch(startEditingSong({
        id: 'song-1',
        title: 'Test Song',
        content: 'Test content',
      }))

      const state = store.getState().songs
      expect(state.isEditing).toBe(true)
      expect(state.currentSongId).toBe('song-1')
      expect(state.localDraft?.songId).toBe('song-1')
      expect(state.localDraft?.title).toBe('Test Song')
      expect(state.localDraft?.content).toBe('Test content')
      expect(state.localDraft?.hasUnsavedChanges).toBe(false)
    })

    it('should stop editing song', () => {
      const store = createTestStore({
        isEditing: true,
        localDraft: {
          songId: 'song-1',
          title: 'Test',
          content: 'Content',
          hasUnsavedChanges: true,
          lastSaved: null,
        },
      })

      store.dispatch(stopEditingSong())

      const state = store.getState().songs
      expect(state.isEditing).toBe(false)
      expect(state.localDraft).toBeNull()
    })
  })

  describe('draft management', () => {
    it('should update draft title', () => {
      const store = createTestStore({
        localDraft: {
          songId: 'song-1',
          title: 'Original title',
          content: 'Content',
          hasUnsavedChanges: false,
          lastSaved: null,
        },
      })

      store.dispatch(updateDraftTitle('New title'))

      const state = store.getState().songs
      expect(state.localDraft?.title).toBe('New title')
      expect(state.localDraft?.hasUnsavedChanges).toBe(true)
    })

    it('should update draft content', () => {
      const store = createTestStore({
        localDraft: {
          songId: 'song-1',
          title: 'Title',
          content: 'Original content',
          hasUnsavedChanges: false,
          lastSaved: null,
        },
      })

      store.dispatch(updateDraftContent('New content'))

      const state = store.getState().songs
      expect(state.localDraft?.content).toBe('New content')
      expect(state.localDraft?.hasUnsavedChanges).toBe(true)
    })

    it('should mark draft as saved', () => {
      const store = createTestStore({
        localDraft: {
          songId: 'song-1',
          title: 'Title',
          content: 'Content',
          hasUnsavedChanges: true,
          lastSaved: null,
        },
      })

      store.dispatch(markDraftSaved())

      const state = store.getState().songs
      expect(state.localDraft?.hasUnsavedChanges).toBe(false)
      expect(state.localDraft?.lastSaved).toBeTruthy()
    })
  })

  describe('view preferences', () => {
    it('should set view mode', () => {
      const store = createTestStore()

      store.dispatch(setViewMode('preview'))

      const state = store.getState().songs
      expect(state.viewMode).toBe('preview')
    })

    it('should toggle prosody view', () => {
      const store = createTestStore({ showProsody: true })

      store.dispatch(toggleProsodyView())

      let state = store.getState().songs
      expect(state.showProsody).toBe(false)

      store.dispatch(toggleProsodyView())

      state = store.getState().songs
      expect(state.showProsody).toBe(true)
    })
  })

  describe('selectors', () => {
    it('should have proper initial state', () => {
      const store = createTestStore()
      const state = store.getState().songs

      expect(state.currentSongId).toBeNull()
      expect(state.isCreating).toBe(false)
      expect(state.isEditing).toBe(false)
      expect(state.localDraft).toBeNull()
      expect(state.viewMode).toBe('edit')
      expect(state.showProsody).toBe(true)
      expect(state.showSectionTags).toBe(true)
      expect(state.selection).toBeNull()
    })
  })
})
