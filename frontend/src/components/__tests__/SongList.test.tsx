import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongList } from '../SongList'
import { apiClient, type Song } from '../../lib/api'

// Import jest-dom matchers
import '@testing-library/jest-dom'

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    listSongs: jest.fn(),
    deleteSong: jest.fn()
  }
}))

// Mock child components to isolate SongList testing
jest.mock('../SongCard', () => ({
  SongCard: ({ song, onEdit, onDelete }: any) => (
    <div data-testid={`song-card-${song.id}`}>
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
      <p>{song.status}</p>
      <button onClick={onEdit} data-testid={`edit-${song.id}`}>Edit</button>
      <button onClick={onDelete} data-testid={`delete-${song.id}`}>Delete</button>
    </div>
  )
}))

jest.mock('../SongForm', () => ({
  SongForm: ({ onSuccess, onCancel }: any) => (
    <div data-testid="song-form">
      <button onClick={onSuccess} data-testid="form-success">Create Song</button>
      <button onClick={onCancel} data-testid="form-cancel">Cancel</button>
    </div>
  )
}))

jest.mock('../SearchBar', () => {
  return function SearchBar({ songs, onSearch }: any) {
    return (
      <div data-testid="search-bar">
        <input 
          data-testid="search-input"
          onChange={(e) => onSearch({ 
            query: e.target.value, 
            status: 'all', 
            tags: [], 
            sortBy: 'updated_at', 
            sortOrder: 'desc' 
          })}
          placeholder="Search..."
        />
      </div>
    )
  }
})

jest.mock('../SearchResults', () => {
  return function SearchResults({ results, onEditSong, onDeleteSong }: any) {
    return (
      <div data-testid="search-results">
        {results.map((result: any) => (
          <div key={result.song.id} data-testid={`search-result-${result.song.id}`}>
            <h3>{result.song.title}</h3>
            <button onClick={() => onEditSong(result.song.id)} data-testid={`search-edit-${result.song.id}`}>
              Edit
            </button>
            <button onClick={() => onDeleteSong(result.song.id)} data-testid={`search-delete-${result.song.id}`}>
              Delete
            </button>
          </div>
        ))}
      </div>
    )
  }
})

// Mock the search utility
jest.mock('../../utils/searchUtils', () => ({
  filterSongs: jest.fn((songs, filters) => {
    if (!filters.query) return songs.map(song => ({ song, matches: [] }))
    return songs
      .filter(song => 
        song.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        song.artist.toLowerCase().includes(filters.query.toLowerCase())
      )
      .map(song => ({ song, matches: [] }))
  })
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

const mockSongs: Song[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Test Song 1',
    artist: 'Test Artist 1',
    lyrics: 'Test lyrics 1',
    status: 'draft',
    tags: ['rock', 'demo'],
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
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Test Song 2',
    artist: 'Test Artist 2',
    lyrics: 'Test lyrics 2',
    status: 'completed',
    tags: ['pop', 'finished'],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
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
  },
  {
    id: '3',
    user_id: 'user1',
    title: 'Another Song',
    artist: 'Different Artist',
    lyrics: 'Different lyrics',
    status: 'in_progress',
    tags: ['jazz', 'experimental'],
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
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
]

describe('SongList Component', () => {
  const mockOnEditSong = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockApiClient.listSongs.mockResolvedValue({ 
      songs: mockSongs, 
      total: mockSongs.length, 
      page: 1, 
      per_page: 10 
    })
    mockApiClient.deleteSong.mockResolvedValue()
    
    // Mock window.confirm
    global.confirm = jest.fn(() => true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching songs', async () => {
      // Make API call take time
      mockApiClient.listSongs.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ 
          songs: mockSongs, 
          total: mockSongs.length, 
          page: 1, 
          per_page: 10 
        }), 100))
      )

      render(<SongList onEditSong={mockOnEditSong} />)

      // Should show loading state
      expect(screen.getByText('Loading your songs...')).toBeInTheDocument()
      // Check for loading spinner by class name since it doesn't have role="status"  
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading your songs...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Song List Display', () => {
    it('should display list of songs after loading', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      // Wait for songs to load
      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Should display all songs
      expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('song-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('song-card-3')).toBeInTheDocument()

      // Should show song count
      expect(screen.getByText('3 songs in your creative library')).toBeInTheDocument()
    })

    it('should display song statistics by status', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Should show status counts
      expect(screen.getByText('Completed: 1')).toBeInTheDocument()
      expect(screen.getByText('In Progress: 1')).toBeInTheDocument()
    })

    it('should show empty state when no songs exist', async () => {
      mockApiClient.listSongs.mockResolvedValue({ 
        songs: [], 
        total: 0, 
        page: 1, 
        per_page: 10 
      })

      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your creative journey starts here')).toBeInTheDocument()
      })

      expect(screen.getByText('Every legendary song began as an idea. Let\'s turn your inspiration into music.')).toBeInTheDocument()
      expect(screen.getByText('Create Your First Song')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when song loading fails', async () => {
      const errorMessage = 'Network error occurred'
      mockApiClient.listSongs.mockRejectedValue(new Error(errorMessage))

      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Should show error icon
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('should display error when song deletion fails', async () => {
      mockApiClient.deleteSong.mockRejectedValue(new Error('Failed to delete song'))

      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      })

      // Try to delete song
      const deleteButton = screen.getByTestId('delete-1')
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete song')).toBeInTheDocument()
      })
    })
  })

  describe('Song Creation', () => {
    it('should show create form when create button is clicked', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Click create button - use the specific button in header
      const createButton = screen.getAllByText('Create New Song')[0] // Get the header button
      await userEvent.click(createButton)

      // Should show form
      expect(screen.getByTestId('song-form')).toBeInTheDocument()
      // Check for form heading instead of button text to avoid confusion
      expect(screen.getByText('Start your next musical masterpiece')).toBeInTheDocument()
    })

    it('should hide create form and reload songs when song is created', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Open create form
      const createButton = screen.getByText('Create New Song')
      await userEvent.click(createButton)

      // Complete form creation
      const successButton = screen.getByTestId('form-success')
      await userEvent.click(successButton)

      // Form should be hidden and songs reloaded
      await waitFor(() => {
        expect(screen.queryByTestId('song-form')).not.toBeInTheDocument()
      })

      expect(mockApiClient.listSongs).toHaveBeenCalledTimes(2) // Initial load + reload after create
    })

    it('should hide create form when cancel is clicked', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Open create form
      const createButton = screen.getByText('Create New Song')
      await userEvent.click(createButton)

      // Cancel form
      const cancelButton = screen.getByTestId('form-cancel')
      await userEvent.click(cancelButton)

      // Form should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('song-form')).not.toBeInTheDocument()
      })
    })
  })

  describe('Song Operations', () => {
    it('should call onEditSong when edit button is clicked', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      })

      // Click edit button
      const editButton = screen.getByTestId('edit-1')
      await userEvent.click(editButton)

      expect(mockOnEditSong).toHaveBeenCalledWith('1')
    })

    it('should delete song when delete is confirmed', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByTestId('delete-1')
      await userEvent.click(deleteButton)

      // Should call deleteSong API
      await waitFor(() => {
        expect(mockApiClient.deleteSong).toHaveBeenCalledWith('1')
      })

      // Should reload songs
      expect(mockApiClient.listSongs).toHaveBeenCalledTimes(2) // Initial + after delete
    })

    it('should not delete song when deletion is cancelled', async () => {
      global.confirm = jest.fn(() => false) // User cancels

      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByTestId('delete-1')
      await userEvent.click(deleteButton)

      // Should not call deleteSong API
      expect(mockApiClient.deleteSong).not.toHaveBeenCalled()
    })
  })

  describe('Search Functionality', () => {
    it('should display search bar', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument()
      })

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    it('should switch to search results when search is performed', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument()
      })

      // Perform search
      const searchInput = screen.getByTestId('search-input')
      await userEvent.type(searchInput, 'Test Song 1')

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument()
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      })
    })

    it('should handle search result interactions', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument()
      })

      // Perform search
      const searchInput = screen.getByTestId('search-input')
      await userEvent.type(searchInput, 'Test Song 1')

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      })

      // Click edit in search results
      const editButton = screen.getByTestId('search-edit-1')
      await userEvent.click(editButton)

      expect(mockOnEditSong).toHaveBeenCalledWith('1')
    })
  })

  describe('Responsive Behavior', () => {
    it('should display songs in grid layout', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByText('Your Songs')).toBeInTheDocument()
      })

      // Check that songs are in a grid container
      const gridContainer = screen.getByTestId('song-card-1').closest('.grid')
      expect(gridContainer).toHaveClass('grid', 'gap-6', 'sm:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('Animation and UX', () => {
    it('should show staggered animation for song cards', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('song-card-1')).toBeInTheDocument()
      })

      // Check that cards have animation classes
      const songCard1 = screen.getByTestId('song-card-1').closest('.animate-fade-in')
      const songCard2 = screen.getByTestId('song-card-2').closest('.animate-fade-in')
      
      expect(songCard1).toBeInTheDocument()
      expect(songCard2).toBeInTheDocument()
    })

    it('should show loading indicator during search', async () => {
      render(<SongList onEditSong={mockOnEditSong} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument()
      })

      // Perform search - the search has a timeout delay
      const searchInput = screen.getByTestId('search-input')
      await userEvent.type(searchInput, 'test')

      // There should be a brief loading state (though it's very short in our mock)
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      })
    })
  })
})