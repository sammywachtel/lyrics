/**
 * Redux Store Configuration
 *
 * Centralizes application state management with Redux Toolkit and RTK Query
 * for scalable, maintainable state handling across the songwriting application.
 */

import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from './api/apiSlice'
import songsReducer from './slices/songsSlice'
import prosodyReducer from './slices/prosodySlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    // API slice for all server communication with caching
    api: apiSlice.reducer,

    // Feature slices
    songs: songsReducer,
    prosody: prosodyReducer,
    ui: uiReducer,
  },

  // RTK Query middleware enables caching, invalidation, polling, and more
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configure for better performance
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),

  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
})

// Enable listener behavior for RTK Query
setupListeners(store.dispatch)

// Export types for TypeScript usage
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export store for provider setup
export default store
