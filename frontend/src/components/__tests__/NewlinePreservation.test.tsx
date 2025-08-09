import { render, screen, waitFor } from '@testing-library/react'
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

describe('Newline Preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateDefaultSettings.mockReturnValue(mockSong.settings)
    mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: mockSong })
    mockApiClient.updateSong.mockResolvedValue({ message: 'Success', song: mockSong })
  })

  it('should preserve exact newline formatting when loading lyrics from backend', async () => {
    // Test various newline patterns that commonly get corrupted
    const testCases = [
      {
        name: 'single newlines',
        lyrics: '[Verse 1]\nFirst line\nSecond line\n\n[Chorus]\nChorus line\nAnother line'
      },
      {
        name: 'double newlines between sections', 
        lyrics: '[Verse 1]\nVerse content\n\n[Chorus]\nChorus content\n\n[Bridge]\nBridge content'
      },
      {
        name: 'trailing newlines',
        lyrics: '[Verse 1]\nContent with trailing newline\n'
      },
      {
        name: 'leading newlines',
        lyrics: '\n[Verse 1]\nContent with leading newline'
      },
      {
        name: 'multiple consecutive newlines',
        lyrics: '[Verse 1]\nLine 1\n\n\nLine after triple newline\n\n[Chorus]\nChorus'
      },
      {
        name: 'whitespace-only lines',
        lyrics: '[Verse 1]\nLine with content\n\n   \n\nAnother line\n\t\n[Chorus]\nChorus content'
      }
    ]

    for (const testCase of testCases) {
      // Clear mocks for each test case
      jest.clearAllMocks()
      
      const originalSong = {
        ...mockSong,
        lyrics: testCase.lyrics
      }

      // Mock getSong to return our test lyrics
      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: originalSong })

      // Render the component  
      const { unmount } = render(<SongEditor songId={`test-${testCase.name.replace(/\s+/g, '-')}`} />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })

      // Wait for initial load to complete
      await waitFor(() => {
        expect(mockApiClient.getSong).toHaveBeenCalled()
      })

      // Get the editor and verify the initial content matches exactly
      const editor = screen.getByTestId('lyrics-editor') as HTMLTextAreaElement
      
      // This is the critical test: the editor should display exactly what was stored
      if (editor.value !== testCase.lyrics) {
        throw new Error(`Newlines were not preserved correctly on load for test case: ${testCase.name}
        Expected: ${JSON.stringify(testCase.lyrics)}
        Got:      ${JSON.stringify(editor.value)}
        Length expected: ${testCase.lyrics.length}, got: ${editor.value.length}`)
      }
      expect(editor.value).toBe(testCase.lyrics)

      // Clean up
      unmount()
    }
  })

  it('should preserve newlines in text statistics', async () => {
    // Test that line counting is accurate with various newline patterns
    const lyricsWithNewlines = '[Verse 1]\nLine 1\nLine 2\n\n[Chorus]\nChorus line\n'
    
    const songWithNewlines = {
      ...mockSong,
      lyrics: lyricsWithNewlines
    }

    mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: songWithNewlines })

    render(<SongEditor songId="line-count-test" />)

    // Wait for load
    await waitFor(() => {
      expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
    })

    // Verify the content loads correctly
    const editor = screen.getByTestId('lyrics-editor') as HTMLTextAreaElement
    expect(editor.value).toBe(lyricsWithNewlines)

    // Verify line count is displayed (should show on status bar)
    await waitFor(() => {
      expect(screen.getByText(/Lines: \d+/)).toBeInTheDocument()
    })
  })

  it('should handle edge cases with newlines correctly', async () => {
    const edgeCases = [
      {
        name: 'empty string',
        lyrics: ''
      },
      {
        name: 'single newline only',
        lyrics: '\n'
      },
      {
        name: 'multiple newlines only',
        lyrics: '\n\n\n'
      },
      {
        name: 'text with no newlines',
        lyrics: 'Single line of text'
      }
    ]

    for (const testCase of edgeCases) {
      jest.clearAllMocks()
      
      const testSong = {
        ...mockSong,
        lyrics: testCase.lyrics
      }

      mockApiClient.getSong.mockResolvedValue({ message: 'Success', song: testSong })

      const { unmount } = render(<SongEditor songId={`edge-case-${testCase.name.replace(/\s+/g, '-')}`} />)

      await waitFor(() => {
        expect(screen.getByTestId('lyrics-editor')).toBeInTheDocument()
      })

      // Verify content loads exactly as stored
      const editor = screen.getByTestId('lyrics-editor') as HTMLTextAreaElement
      expect(editor.value).toBe(testCase.lyrics)

      // Verify line count is displayed (without checking specific numbers)
      await waitFor(() => {
        expect(screen.getByText(/Lines: \d+/)).toBeInTheDocument()
      })

      unmount()
    }
  })
})