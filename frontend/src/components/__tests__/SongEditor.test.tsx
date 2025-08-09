import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SongEditor from '../SongEditor'
import { apiClient, createDefaultSettings, type Song } from '../../lib/api'

// Import jest-dom matchers
import '@testing-library/jest-dom'

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    getSong: jest.fn(),
    updateSong: jest.fn()
  },
  createDefaultSettings: jest.fn()
}))

// Mock the LexicalLyricsEditor component
jest.mock('../LexicalLyricsEditor', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  
  const MockEditor = React.forwardRef(({ value, onChange, placeholder }, ref) => {
    React.useImperativeHandle(ref, () => ({
      isSourceMode: () => false,
      getWysiwygElement: () => null,
      getTextareaElement: () => null,
      getCurrentCursorPosition: () => 0,
      setCursorPosition: () => {},
      focus: () => {},
      getSelectedText: () => '',
      wrapSelectedText: () => {},
      insertTextAtCursor: () => {}
    }))
    
    // Trigger onChange immediately when value changes to simulate real editor behavior
    React.useEffect(() => {
      if (value && onChange) {
        // Small delay to simulate async behavior
        setTimeout(() => onChange(value), 10)
      }
    }, [value, onChange])
    
    return (
      <textarea
        data-testid="lyrics-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={24}
      />
    )
  })
  
  MockEditor.displayName = 'MockLexicalLyricsEditor'
  return MockEditor
})

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockCreateDefaultSettings = createDefaultSettings as jest.MockedFunction<typeof createDefaultSettings>

const mockSong: Song = {
  id: '1',
  user_id: 'user1',
  title: 'Test Song',
  artist: 'Test Artist',
  lyrics: '',
  status: 'draft',
  tags: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  settings: {
    narrative_pov: 'first_person',
    six_best_friends: {},
    structural_boxes: [],
    section_structure: [],
    rhyme_preferences: {
      primary_types: [],
      allow_slant_rhymes: true,
      emphasis_on_perfect: false
    },
    prosody_settings: {
      rhythmic_stability: 5,
      phrasing_style: 'balanced',
      syllable_emphasis: true,
      meter_consistency: 5
    },
    keyword_settings: {
      primary_keywords: [],
      metaphor_themes: [],
      avoid_words: [],
      synonym_groups: {}
    },
    style_guide: {
      sub_genres: [],
      artist_references: [],
      avoid_cliches: false,
      innovation_level: 5
    },
    energy_level: 5,
    ai_creativity_level: 5,
    preserve_user_phrases: true,
    auto_suggestions: true
  },
  metadata: {}
}

describe('SongEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateDefaultSettings.mockReturnValue(mockSong.settings)
    mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: mockSong })
    mockApiClient.updateSong.mockResolvedValue({ message: 'Success', song: mockSong })
  })

  describe('Section Sidebar Visibility', () => {
    it('should show sidebar when showSectionSidebar is true, even with no sections', async () => {
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // The sidebar should be visible even though there are no sections
      expect(screen.getByText('No Sections Yet')).toBeInTheDocument()
      expect(screen.getByText(/Add section tags like/)).toBeInTheDocument()
      expect(screen.getByText('[Verse 1]')).toBeInTheDocument()
      expect(screen.getByText('[Chorus]')).toBeInTheDocument()
    })

    it('should show sidebar with sections when lyrics contain section tags', async () => {
      const songWithSections = {
        ...mockSong,
        lyrics: '[Verse 1]\nSome lyrics here\n\n[Chorus]\nChorus lyrics here'
      }
      
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithSections })
      
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Wait for sections to be parsed and rendered
      await waitFor(() => {
        expect(screen.getAllByText('Sections: 2')[0]).toBeInTheDocument()
      })
      
      // The sidebar should show sections (using getAllByText since sections appear in multiple places)
      expect(screen.getAllByText('Verse 1')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Chorus')[0]).toBeInTheDocument()
    })

    it('should hide sidebar when showSectionSidebar is false', async () => {
      // Test with a song that has sections so the hide button appears
      const songWithSections = {
        ...mockSong,
        lyrics: '[Verse 1]\nSome lyrics here\n\n[Chorus]\nChorus lyrics here'
      }
      
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithSections })
      
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load and sections to be parsed
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Wait for sections to be parsed so sidebar shows sections (and thus the hide button)
      await waitFor(() => {
        expect(screen.getAllByText('Sections: 2')[0]).toBeInTheDocument()
      })
      
      // Initially sidebar should be visible with sections
      expect(screen.getAllByText('Verse 1')[0]).toBeInTheDocument()
      
      // Now the hide button should be available since there are sections
      const hideButton = screen.getByTitle('Hide sidebar')
      await userEvent.click(hideButton)
      
      // Sidebar should now be hidden
      // Since 'Verse 1' appears in multiple places (status bar, bottom bar), 
      // let's check that the sidebar specifically is gone by looking for the hide button
      await waitFor(() => {
        // If sidebar is hidden, the hide button should no longer be available
        expect(screen.queryByTitle('Hide sidebar')).not.toBeInTheDocument()
      })
    })

    it('should allow adding first section when no sections exist', async () => {
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Find the "Add Section" button in the empty state
      // Note: Since the SectionSidebar is shown for empty state, we should be able to add sections
      expect(screen.getByText('No Sections Yet')).toBeInTheDocument()
      
      // The sidebar should be visible, allowing users to add their first section
      // This test verifies that the catch-22 issue is resolved
      const sidebarElement = screen.getByText('No Sections Yet').closest('div')
      expect(sidebarElement).toBeInTheDocument()
    })
  })

  describe('Section Management', () => {
    it('should parse sections from lyrics', async () => {
      const songWithSections = {
        ...mockSong,
        lyrics: '[Verse 1]\nFirst verse lyrics\n\n[Chorus]\nChorus lyrics\n\n[Verse 2]\nSecond verse lyrics'
      }
      
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithSections })
      
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Wait for sections to be parsed asynchronously
      await waitFor(() => {
        expect(screen.getAllByText('Sections: 3')[0]).toBeInTheDocument()
      })
      
      // Should show individual sections (using getAllByText since sections appear in multiple places)
      expect(screen.getAllByText('Verse 1')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Chorus')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Verse 2')[0]).toBeInTheDocument()
    })

    it('should show section statistics in the bottom status bar', async () => {
      const songWithSections = {
        ...mockSong,
        lyrics: '[Verse 1]\nFirst verse lyrics\n\n[Chorus]\nChorus lyrics'
      }
      
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithSections })
      
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Wait for sections to be parsed
      await waitFor(() => {
        expect(screen.getAllByText('Sections: 2')[0]).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', async () => {
      // Make the API call take some time
      mockApiClient.getSong.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ message: 'Success', song: mockSong }), 100)
      ))
      
      render(<SongEditor songId="1" />)
      
      // Should show loading state
      expect(screen.getByText('Loading your song...')).toBeInTheDocument()
      expect(screen.getByText('Preparing your creative workspace')).toBeInTheDocument()
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
    })

    it('should show error state when song loading fails', async () => {
      mockApiClient.getSong.mockRejectedValue(new Error('Failed to load song'))
      
      const mockOnClose = jest.fn()
      render(<SongEditor songId="1" onClose={mockOnClose} />)
      
      // Wait for error state to appear
      await waitFor(() => {
        expect(screen.getByText('Unable to load song')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Failed to load song')).toBeInTheDocument()
      
      // Should have a back button
      const backButton = screen.getByText('← Back to Song List')
      expect(backButton).toBeInTheDocument()
      
      await userEvent.click(backButton)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Song Metadata', () => {
    it('should display song statistics correctly', async () => {
      const songWithContent = {
        ...mockSong,
        lyrics: '[Verse 1]\nThis is a test song with some lyrics\n\n[Chorus]\nSing along with me'
      }
      
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithContent })
      
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Should show word count - check in multiple locations
      expect(screen.getAllByText(/Words: \d+/)[0]).toBeInTheDocument()
      
      // Should show line count
      expect(screen.getByText(/Lines: \d+/)).toBeInTheDocument()
      
      // Should show character count
      expect(screen.getByText(/Characters: \d+/)).toBeInTheDocument()
    })
  })
})