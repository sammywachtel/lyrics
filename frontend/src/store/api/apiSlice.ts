/**
 * RTK Query API Slice
 *
 * Centralized API communication with automatic caching, invalidation,
 * and optimistic updates for the songwriting application.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Import Song type from lib/api to maintain consistency
import type { Song, SongSettings } from '../../lib/api'

// Export Song type for components to use
export type { Song, SongSettings }

export interface CreateSongRequest {
  title: string
  artist?: string
  lyrics: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags?: string[]
  settings?: SongSettings
}

export interface UpdateSongRequest {
  id: string
  title?: string
  artist?: string
  lyrics?: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags?: string[]
  settings?: SongSettings
}

export interface StressAnalysisRequest {
  lines: string[]
}

export interface StressAnalysisResponse {
  results: Array<{
    line: string
    analysis: {
      syllables: Array<{
        text: string
        stressed: boolean
      }>
      confidence: number
    }
  }>
}

// API base configuration
export const apiSlice = createApi({
  reducerPath: 'api',

  baseQuery: fetchBaseQuery({
    baseUrl: '/api',

    // Add auth headers when available
    prepareHeaders: (headers) => {
      // TODO: Add authentication headers when auth is implemented
      headers.set('content-type', 'application/json')
      return headers
    },
  }),

  // Cache tags for intelligent invalidation
  tagTypes: ['Song', 'StressAnalysis', 'User'],

  endpoints: (builder) => ({
    // Song Management Endpoints
    getSongs: builder.query<Song[], void>({
      query: () => '/songs',
      providesTags: ['Song'],

      // Cache for 5 minutes
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getSong: builder.query<Song, string>({
      query: (id) => `/songs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Song', id }],

      // Cache individual songs for 10 minutes
      keepUnusedDataFor: 600,
    }),

    createSong: builder.mutation<Song, CreateSongRequest>({
      query: (newSong) => ({
        url: '/songs',
        method: 'POST',
        body: newSong,
      }),

      // Optimistically update cache
      invalidatesTags: ['Song'],

      // Optimistic update for better UX
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data: newSong } = await queryFulfilled

          // Update songs list cache
          dispatch(
            apiSlice.util.updateQueryData('getSongs', undefined, (draft) => {
              draft.unshift(newSong)
            })
          )
        } catch {
          // Revert on error (RTK Query handles this automatically)
        }
      },
    }),

    updateSong: builder.mutation<Song, UpdateSongRequest>({
      query: ({ id, ...patch }) => ({
        url: `/songs/${id}`,
        method: 'PATCH',
        body: patch,
      }),

      // Update specific song cache
      invalidatesTags: (result, error, arg) => [
        { type: 'Song', id: arg.id },
        'Song', // Also invalidate list
      ],

      // Optimistic update
      onQueryStarted: async ({ id, ...patch }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getSong', id, (draft) => {
            Object.assign(draft, patch)
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),

    deleteSong: builder.mutation<void, string>({
      query: (id) => ({
        url: `/songs/${id}`,
        method: 'DELETE',
      }),

      invalidatesTags: (result, error, id) => [
        { type: 'Song', id },
        'Song', // Invalidate list
      ],
    }),

    // Stress Analysis Endpoints
    analyzeStress: builder.mutation<StressAnalysisResponse, StressAnalysisRequest>({
      query: (data) => ({
        url: '/stress-analysis/batch',
        method: 'POST',
        body: data,
      }),
    }),

    // Health check endpoint for monitoring
    healthCheck: builder.query<{ status: string; timestamp: string }, void>({
      query: () => '/health',

      // Don't cache health checks
      keepUnusedDataFor: 0,
    }),
  }),
})

// Export hooks for components
export const {
  useGetSongsQuery,
  useGetSongQuery,
  useCreateSongMutation,
  useUpdateSongMutation,
  useDeleteSongMutation,
  useAnalyzeStressMutation,
  useHealthCheckQuery,

  // Lazy query versions for manual triggering
  useLazyGetSongsQuery,
  useLazyGetSongQuery,
} = apiSlice

// Export slice for store configuration
export default apiSlice
