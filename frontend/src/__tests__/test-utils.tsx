/**
 * Test utilities for components that need Redux store
 */
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../store/api/apiSlice'
import songsReducer from '../store/slices/songsSlice'
import prosodyReducer from '../store/slices/prosodySlice'
import uiReducer from '../store/slices/uiSlice'

// Create a test store
const createTestStore = (initialState?: Record<string, unknown>) => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
      songs: songsReducer,
      prosody: prosodyReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(apiSlice.middleware),
    devTools: false, // Disable in tests
    preloadedState: initialState,
  })
}

interface WrapperProps {
  children: React.ReactNode
}

// Create a wrapper component that includes providers
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function Wrapper({ children }: WrapperProps) {
    return (
      <Provider store={store}>
        {children}
      </Provider>
    )
  }
}

// Custom render function that includes Redux Provider
export const renderWithRedux = (
  ui: ReactElement,
  options?: {
    initialState?: Record<string, unknown>
    store?: ReturnType<typeof createTestStore>
    renderOptions?: Omit<RenderOptions, 'wrapper'>
  }
) => {
  const store = options?.store || createTestStore(options?.initialState)
  const Wrapper = createWrapper(store)

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...options?.renderOptions })
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom one
export { renderWithRedux as render }
