import { render, screen, fireEvent } from '@testing-library/react'
import { AppLayout } from '../AppLayout'
import '@testing-library/jest-dom'

// Mock the panel state hook
jest.mock('../../../hooks/usePanelState', () => ({
  usePanelState: () => ({
    panels: { left: true, right: true },
    activeTab: 'editor',
    viewportSize: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    togglePanel: jest.fn(),
    openPanel: jest.fn(),
    closePanel: jest.fn(),
    closeAllPanels: jest.fn(),
    setActiveTab: jest.fn(),
    switchToTab: jest.fn()
  })
}))

describe('AppLayout', () => {
  it('should render the three-panel layout', () => {
    render(
      <AppLayout>
        <div data-testid="editor-content">Editor Content</div>
      </AppLayout>
    )
    
    // Check for header
    expect(screen.getByText('Songcraft')).toBeInTheDocument()
    
    // Check for panels
    expect(screen.getByText('Song Settings')).toBeInTheDocument()
    expect(screen.getByText('Lyrics Editor')).toBeInTheDocument()
    expect(screen.getByText('Writing Tools')).toBeInTheDocument()
    
    // Check for editor content
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })
  
  it('should display song information when currentSong is provided', () => {
    const mockSong = {
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      lyrics: 'Test lyrics',
      user_id: '1',
      status: 'draft' as const,
      tags: [],
      settings: {
        narrative_pov: 'first_person' as const,
        six_best_friends: {},
        structural_boxes: [],
        section_structure: [],
        rhyme_preferences: {
          primary_types: [],
          allow_slant_rhymes: true,
          emphasis_on_perfect: false,
        },
        prosody_settings: {
          rhythmic_stability: 5,
          phrasing_style: 'balanced' as const,
          syllable_emphasis: true,
          meter_consistency: 5,
        },
        keyword_settings: {
          primary_keywords: [],
          metaphor_themes: [],
          avoid_words: [],
          synonym_groups: {},
        },
        style_guide: {
          sub_genres: [],
          artist_references: [],
          avoid_cliches: true,
          innovation_level: 5,
        },
        energy_level: 5,
        ai_creativity_level: 5,
        preserve_user_phrases: true,
        auto_suggestions: true,
      },
      metadata: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
    
    render(<AppLayout currentSong={mockSong} />)
    
    // Song title should appear in header (check for it in multiple places)
    expect(screen.getAllByText('Test Song')).toHaveLength(2) // Header and footer
  })
  
  it('should render custom panel content when provided', () => {
    render(
      <AppLayout
        settingsContent={<div data-testid="custom-settings">Custom Settings</div>}
        editorContent={<div data-testid="custom-editor">Custom Editor</div>}
        toolsContent={<div data-testid="custom-tools">Custom Tools</div>}
      />
    )
    
    expect(screen.getByTestId('custom-settings')).toBeInTheDocument()
    expect(screen.getByTestId('custom-editor')).toBeInTheDocument()
    expect(screen.getByTestId('custom-tools')).toBeInTheDocument()
  })
  
  it('should handle search functionality', () => {
    const mockOnSearch = jest.fn()
    
    render(<AppLayout onSearch={mockOnSearch} />)
    
    const searchInput = screen.getByPlaceholderText(/search songs/i)
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    fireEvent.submit(searchInput.closest('form')!)
    
    expect(mockOnSearch).toHaveBeenCalledWith('test search')
  })
  
  it('should display save status indicator', () => {
    render(<AppLayout saveStatus="saving" />)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })
})