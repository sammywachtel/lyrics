import { useState, useCallback, useEffect } from 'react'

export type PanelVisibility = {
  left: boolean
  right: boolean
}

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export interface PanelState {
  // Panel visibility state
  panels: PanelVisibility
  activeTab: string
  
  // Viewport information
  viewportSize: ViewportSize
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  
  // Actions
  togglePanel: (panel: 'left' | 'right') => void
  openPanel: (panel: 'left' | 'right') => void
  closePanel: (panel: 'left' | 'right') => void
  closeAllPanels: () => void
  setActiveTab: (tab: string) => void
  
  // Mobile-specific
  switchToTab: (tab: 'settings' | 'editor' | 'tools') => void
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200
}

/**
 * Hook for managing panel visibility and state across different viewport sizes
 * Handles responsive behavior for mobile, tablet, and desktop layouts
 */
export function usePanelState(): PanelState {
  const [panels, setPanels] = useState<PanelVisibility>({
    left: true,
    right: true
  })
  
  const [activeTab, setActiveTabState] = useState<string>('editor')
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop')
  
  // Calculate viewport size
  const calculateViewportSize = useCallback((width: number): ViewportSize => {
    if (width < BREAKPOINTS.mobile) return 'mobile'
    if (width < BREAKPOINTS.tablet) return 'tablet'
    return 'desktop'
  }, [])
  
  // Update viewport size on resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const newSize = calculateViewportSize(width)
      setViewportSize(newSize)
      
      // Auto-close panels on mobile
      if (newSize === 'mobile') {
        setPanels({ left: false, right: false })
      }
      // Auto-open panels on desktop
      else if (newSize === 'desktop') {
        setPanels({ left: true, right: true })
      }
    }
    
    // Set initial size
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calculateViewportSize])
  
  const togglePanel = useCallback((panel: 'left' | 'right') => {
    setPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }))
  }, [])
  
  const openPanel = useCallback((panel: 'left' | 'right') => {
    setPanels(prev => ({
      ...prev,
      [panel]: true
    }))
  }, [])
  
  const closePanel = useCallback((panel: 'left' | 'right') => {
    setPanels(prev => ({
      ...prev,
      [panel]: false
    }))
  }, [])
  
  const closeAllPanels = useCallback(() => {
    setPanels({ left: false, right: false })
  }, [])
  
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
  }, [])
  
  const switchToTab = useCallback((tab: 'settings' | 'editor' | 'tools') => {
    setActiveTabState(tab)
    
    // On mobile, close all panels and let the tab system handle display
    if (viewportSize === 'mobile') {
      closeAllPanels()
    }
    // On tablet, show appropriate panel
    else if (viewportSize === 'tablet') {
      if (tab === 'settings') {
        openPanel('left')
        closePanel('right')
      } else if (tab === 'tools') {
        openPanel('right')
        closePanel('left')
      } else {
        closeAllPanels()
      }
    }
  }, [viewportSize, openPanel, closePanel, closeAllPanels])
  
  return {
    panels,
    activeTab,
    viewportSize,
    isMobile: viewportSize === 'mobile',
    isTablet: viewportSize === 'tablet',
    isDesktop: viewportSize === 'desktop',
    togglePanel,
    openPanel,
    closePanel,
    closeAllPanels,
    setActiveTab,
    switchToTab
  }
}