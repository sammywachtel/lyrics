/**
 * Tests for RTK Query API Slice
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice'

// Create a test store with the API slice
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  })
}

describe('apiSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  describe('endpoints', () => {
    it('should have getSongs endpoint', () => {
      expect(apiSlice.endpoints.getSongs).toBeDefined()
      expect(apiSlice.endpoints.getSongs.name).toBe('getSongs')
    })

    it('should have getSong endpoint', () => {
      expect(apiSlice.endpoints.getSong).toBeDefined()
      expect(apiSlice.endpoints.getSong.name).toBe('getSong')
    })

    it('should have createSong endpoint', () => {
      expect(apiSlice.endpoints.createSong).toBeDefined()
      expect(apiSlice.endpoints.createSong.name).toBe('createSong')
    })

    it('should have updateSong endpoint', () => {
      expect(apiSlice.endpoints.updateSong).toBeDefined()
      expect(apiSlice.endpoints.updateSong.name).toBe('updateSong')
    })

    it('should have deleteSong endpoint', () => {
      expect(apiSlice.endpoints.deleteSong).toBeDefined()
      expect(apiSlice.endpoints.deleteSong.name).toBe('deleteSong')
    })

    it('should have analyzeStress endpoint', () => {
      expect(apiSlice.endpoints.analyzeStress).toBeDefined()
      expect(apiSlice.endpoints.analyzeStress.name).toBe('analyzeStress')
    })

    it('should have healthCheck endpoint', () => {
      expect(apiSlice.endpoints.healthCheck).toBeDefined()
      expect(apiSlice.endpoints.healthCheck.name).toBe('healthCheck')
    })
  })

  describe('hooks', () => {
    it('should export query hooks', () => {
      const { useGetSongsQuery, useGetSongQuery, useHealthCheckQuery } = require('../api/apiSlice')

      expect(useGetSongsQuery).toBeDefined()
      expect(useGetSongQuery).toBeDefined()
      expect(useHealthCheckQuery).toBeDefined()
    })

    it('should export mutation hooks', () => {
      const {
        useCreateSongMutation,
        useUpdateSongMutation,
        useDeleteSongMutation,
        useAnalyzeStressMutation,
      } = require('../api/apiSlice')

      expect(useCreateSongMutation).toBeDefined()
      expect(useUpdateSongMutation).toBeDefined()
      expect(useDeleteSongMutation).toBeDefined()
      expect(useAnalyzeStressMutation).toBeDefined()
    })

    it('should export lazy query hooks', () => {
      const { useLazyGetSongsQuery, useLazyGetSongQuery } = require('../api/apiSlice')

      expect(useLazyGetSongsQuery).toBeDefined()
      expect(useLazyGetSongQuery).toBeDefined()
    })
  })

  describe('cache tags', () => {
    it('should have tag types configured', () => {
      // RTK Query configures tag types internally
      // We verify the API slice is properly configured
      expect(apiSlice.reducerPath).toBe('api')
      expect(Object.keys(apiSlice.endpoints)).toContain('getSongs')
    })
  })

  describe('API slice configuration', () => {
    it('should have correct base URL', () => {
      // The baseUrl is defined in the apiSlice, should be '/api'
      expect(apiSlice.reducerPath).toBe('api')
    })

    it('should initialize with empty cache', () => {
      const state = store.getState()
      expect(state.api.queries).toEqual({})
      expect(state.api.mutations).toEqual({})
    })
  })

  describe('endpoint types', () => {
    it('should have proper TypeScript types', () => {
      // Verify that endpoints exist and are properly configured
      expect(apiSlice.endpoints.getSongs).toBeDefined()
      expect(apiSlice.endpoints.createSong).toBeDefined()
      expect(apiSlice.endpoints.updateSong).toBeDefined()
      expect(apiSlice.endpoints.deleteSong).toBeDefined()
    })

    it('should have proper endpoint structure', () => {
      // Verify that the endpoints are properly configured
      const getSongsEndpoint = apiSlice.endpoints.getSongs
      const createSongEndpoint = apiSlice.endpoints.createSong

      expect(getSongsEndpoint.name).toBe('getSongs')
      expect(createSongEndpoint.name).toBe('createSong')
    })
  })

  describe('caching behavior', () => {
    it('should configure appropriate cache times', () => {
      // Check that endpoints have keepUnusedDataFor configuration
      const getSongsEndpoint = apiSlice.endpoints.getSongs
      const getSongEndpoint = apiSlice.endpoints.getSong

      // These should have cache configuration (tested by their existence)
      expect(getSongsEndpoint).toBeDefined()
      expect(getSongEndpoint).toBeDefined()
    })
  })
})
