import { renderHook, act } from '@testing-library/react'
import { usePanelState } from '../../../src/hooks/usePanelState'

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200
})

// Mock window.addEventListener/removeEventListener
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  configurable: true,
  value: mockAddEventListener
})
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  configurable: true,
  value: mockRemoveEventListener
})

describe('usePanelState', () => {
  beforeEach(() => {
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
    // Reset to desktop width
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
  })

  it('should initialize with correct default state for desktop', () => {
    const { result } = renderHook(() => usePanelState())

    expect(result.current.panels.left).toBe(true)
    expect(result.current.panels.right).toBe(true)
    expect(result.current.activeTab).toBe('editor')
    expect(result.current.viewportSize).toBe('desktop')
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
  })

  it('should detect mobile viewport correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })

    const { result } = renderHook(() => usePanelState())

    expect(result.current.viewportSize).toBe('mobile')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.panels.left).toBe(false)
    expect(result.current.panels.right).toBe(false)
  })

  it('should detect tablet viewport correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true })

    const { result } = renderHook(() => usePanelState())

    expect(result.current.viewportSize).toBe('tablet')
    expect(result.current.isTablet).toBe(true)
  })

  it('should toggle panels correctly', () => {
    const { result } = renderHook(() => usePanelState())

    act(() => {
      result.current.togglePanel('left')
    })

    expect(result.current.panels.left).toBe(false)
    expect(result.current.panels.right).toBe(true)

    act(() => {
      result.current.togglePanel('left')
    })

    expect(result.current.panels.left).toBe(true)
  })

  it('should open and close panels correctly', () => {
    const { result } = renderHook(() => usePanelState())

    act(() => {
      result.current.closePanel('left')
    })

    expect(result.current.panels.left).toBe(false)

    act(() => {
      result.current.openPanel('left')
    })

    expect(result.current.panels.left).toBe(true)
  })

  it('should close all panels', () => {
    const { result } = renderHook(() => usePanelState())

    act(() => {
      result.current.closeAllPanels()
    })

    expect(result.current.panels.left).toBe(false)
    expect(result.current.panels.right).toBe(false)
  })

  it('should set active tab', () => {
    const { result } = renderHook(() => usePanelState())

    act(() => {
      result.current.setActiveTab('settings')
    })

    expect(result.current.activeTab).toBe('settings')
  })

  it('should handle tab switching on different viewport sizes', () => {
    // Start with desktop
    const { result } = renderHook(() => usePanelState())

    // Switch to mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })

    // Simulate the resize event
    act(() => {
      const resizeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      if (resizeHandler) {
        resizeHandler()
      }
    })

    // Switch to tools tab on mobile
    act(() => {
      result.current.switchToTab('tools')
    })

    expect(result.current.activeTab).toBe('tools')
    expect(result.current.panels.left).toBe(false)
    expect(result.current.panels.right).toBe(false)
  })

  it('should add and remove resize event listener', () => {
    const { unmount } = renderHook(() => usePanelState())

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
