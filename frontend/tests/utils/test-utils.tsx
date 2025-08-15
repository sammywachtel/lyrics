/**
 * Test utilities for components that need Redux store
 */
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../../src/store/api/apiSlice'
import songsReducer from '../../src/store/slices/songsSlice'
import prosodyReducer from '../../src/store/slices/prosodySlice'
import uiReducer from '../../src/store/slices/uiSlice'

// Define the root state type
type RootState = {
  api: ReturnType<typeof apiSlice.reducer>
  songs: ReturnType<typeof songsReducer>
  prosody: ReturnType<typeof prosodyReducer>
  ui: ReturnType<typeof uiReducer>
}

// Create a test store
const createTestStore = (initialState?: Partial<RootState>) => {
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
    initialState?: Partial<RootState>
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
