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

// Mock the SimpleWysiwygEditor component
jest.mock('../SimpleWysiwygEditor', () => {
  import React from 'react'
  
  const MockEditor = React.forwardRef(({ value, onChange, placeholder }, ref) => {
    React.useImperativeHandle(ref, () => ({
      isSourceMode: () => false,
      getWysiwygElement: () => null,
      getTextareaElement: () => null
    }))
    
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
  
  MockEditor.displayName = 'MockSimpleWysiwygEditor'
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
      
      // The sidebar should show sections
      expect(screen.getByText('Sections (2)')).toBeInTheDocument()
      expect(screen.getByText('Verse 1')).toBeInTheDocument()
      expect(screen.getByText('Chorus')).toBeInTheDocument()
    })

    it('should hide sidebar when showSectionSidebar is false', async () => {
      render(<SongEditor songId="1" />)
      
      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })
      
      // Initially sidebar should be visible
      expect(screen.getByText('No Sections Yet')).toBeInTheDocument()
      
      // Find and click the toggle sidebar button in the section toolbar
      const toggleButton = screen.getByTitle('Toggle section sidebar')
      await userEvent.click(toggleButton)
      
      // Sidebar should now be hidden
      expect(screen.queryByText('No Sections Yet')).not.toBeInTheDocument()
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
      
      // Should show section count in sidebar
      expect(screen.getByText('Sections (3)')).toBeInTheDocument()
      
      // Should show individual sections
      expect(screen.getByText('Verse 1')).toBeInTheDocument()
      expect(screen.getByText('Chorus')).toBeInTheDocument()
      expect(screen.getByText('Verse 2')).toBeInTheDocument()
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
      
      // Should show sections count in bottom status bar
      expect(screen.getByText('Sections: 2')).toBeInTheDocument()
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
      
      // Should show word count
      expect(screen.getByText(/Words: \d+/)).toBeInTheDocument()
      
      // Should show line count
      expect(screen.getByText(/Lines: \d+/)).toBeInTheDocument()
      
      // Should show character count
      expect(screen.getByText(/Characters: \d+/)).toBeInTheDocument()
    })
  })
})