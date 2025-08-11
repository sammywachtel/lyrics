/**
 * UI Slice - Global UI State Management
 *
 * Manages application-wide UI state including modals, notifications,
 * loading states, and user preferences that don't belong to specific features.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  autoHide?: boolean
  duration?: number // milliseconds
  timestamp: string
}

export interface Modal {
  id: string
  type: string
  props?: Record<string, unknown>
  onClose?: string // action type to dispatch on close
}

export interface UIState {
  // Notification system
  notifications: Notification[]

  // Modal system
  activeModals: Modal[]

  // Global loading states
  globalLoading: {
    isLoading: boolean
    message?: string
  }

  // Sidebar and layout
  sidebarOpen: boolean
  sidebarWidth: number

  // Theme and preferences
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'

  // Accessibility
  reducedMotion: boolean
  highContrast: boolean

  // Search and navigation
  searchQuery: string
  searchOpen: boolean

  // Keyboard shortcuts
  shortcutsEnabled: boolean
  shortcutsVisible: boolean

  // Performance debugging
  devMode: boolean
  showPerformanceMetrics: boolean
}

const initialState: UIState = {
  notifications: [],
  activeModals: [],
  globalLoading: {
    isLoading: false,
  },
  sidebarOpen: true,
  sidebarWidth: 280,
  theme: 'auto',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  searchQuery: '',
  searchOpen: false,
  shortcutsEnabled: true,
  shortcutsVisible: false,
  devMode: process.env.NODE_ENV === 'development',
  showPerformanceMetrics: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Notification Management
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        autoHide: action.payload.autoHide ?? true,
        duration: action.payload.duration ?? 5000,
      }

      state.notifications.unshift(notification)

      // Limit notifications to prevent memory issues
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(0, 10)
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },

    clearNotifications: (state) => {
      state.notifications = []
    },

    // Modal Management
    openModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }

      state.activeModals.push(modal)
    },

    closeModal: (state, action: PayloadAction<string>) => {
      state.activeModals = state.activeModals.filter(m => m.id !== action.payload)
    },

    closeTopModal: (state) => {
      if (state.activeModals.length > 0) {
        state.activeModals.pop()
      }
    },

    closeAllModals: (state) => {
      state.activeModals = []
    },

    // Global Loading
    setGlobalLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.globalLoading = action.payload
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },

    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = Math.max(200, Math.min(500, action.payload))
    },

    // Theme and Preferences
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload
    },

    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload
    },

    // Accessibility
    toggleReducedMotion: (state) => {
      state.reducedMotion = !state.reducedMotion
    },

    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast
    },

    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload
    },

    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen
      if (!state.searchOpen) {
        state.searchQuery = ''
      }
    },

    closeSearch: (state) => {
      state.searchOpen = false
      state.searchQuery = ''
    },

    // Keyboard Shortcuts
    toggleShortcuts: (state) => {
      state.shortcutsEnabled = !state.shortcutsEnabled
    },

    showShortcuts: (state) => {
      state.shortcutsVisible = true
    },

    hideShortcuts: (state) => {
      state.shortcutsVisible = false
    },

    // Development
    toggleDevMode: (state) => {
      state.devMode = !state.devMode
    },

    togglePerformanceMetrics: (state) => {
      state.showPerformanceMetrics = !state.showPerformanceMetrics
    },
  },
})

// Export actions
export const {
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeTopModal,
  closeAllModals,
  setGlobalLoading,
  toggleSidebar,
  setSidebarOpen,
  setSidebarWidth,
  setTheme,
  setFontSize,
  toggleReducedMotion,
  toggleHighContrast,
  setReducedMotion,
  setHighContrast,
  setSearchQuery,
  toggleSearch,
  closeSearch,
  toggleShortcuts,
  showShortcuts,
  hideShortcuts,
  toggleDevMode,
  togglePerformanceMetrics,
} = uiSlice.actions

// Selectors
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications
export const selectActiveModals = (state: { ui: UIState }) => state.ui.activeModals
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen
export const selectSidebarWidth = (state: { ui: UIState }) => state.ui.sidebarWidth
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectFontSize = (state: { ui: UIState }) => state.ui.fontSize
export const selectReducedMotion = (state: { ui: UIState }) => state.ui.reducedMotion
export const selectHighContrast = (state: { ui: UIState }) => state.ui.highContrast
export const selectSearchQuery = (state: { ui: UIState }) => state.ui.searchQuery
export const selectSearchOpen = (state: { ui: UIState }) => state.ui.searchOpen
export const selectShortcutsEnabled = (state: { ui: UIState }) => state.ui.shortcutsEnabled
export const selectShortcutsVisible = (state: { ui: UIState }) => state.ui.shortcutsVisible
export const selectDevMode = (state: { ui: UIState }) => state.ui.devMode
export const selectShowPerformanceMetrics = (state: { ui: UIState }) => state.ui.showPerformanceMetrics

// Complex selectors
export const selectTopModal = (state: { ui: UIState }) =>
  state.ui.activeModals[state.ui.activeModals.length - 1] || null

export const selectHasModals = (state: { ui: UIState }) => state.ui.activeModals.length > 0

export const selectUnreadNotifications = (state: { ui: UIState }) =>
  state.ui.notifications.filter(n => n.type === 'error' || n.type === 'warning')

export default uiSlice.reducer
