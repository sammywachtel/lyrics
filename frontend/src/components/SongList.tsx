import { useState, useEffect, useCallback } from 'react'
import type { Song } from '../lib/api'
import { apiClient } from '../lib/api'
import { SongCard } from './SongCard'
import { SongForm } from './SongForm'
import SearchBar from './SearchBar'
import SearchResults from './SearchResults'
import type { SearchFilters, SearchResult } from '../utils/searchUtils'
import { filterSongs } from '../utils/searchUtils'

interface SongListProps {
  onEditSong: (songId: string) => void
}

export function SongList({ onEditSong }: SongListProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearch, setCurrentSearch] = useState<SearchFilters>({ query: '', status: 'all', tags: [], sortBy: 'updated_at', sortOrder: 'desc' })
  const [isSearching, setIsSearching] = useState(false)


  const loadSongs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.listSongs()
      setSongs(response.songs)
      setError(null)
      
      // Update search results with new songs
      const results = filterSongs(response.songs, currentSearch)
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }, [currentSearch])

  useEffect(() => {
    loadSongs()
  }, [loadSongs])

  const handleSongCreated = () => {
    setShowCreateForm(false)
    loadSongs()
  }

  // Handle search
  const handleSearch = (filters: SearchFilters) => {
    setIsSearching(true)
    setCurrentSearch(filters)
    
    // Filter songs based on search criteria
    const results = filterSongs(songs, filters)
    setSearchResults(results)
    
    setTimeout(() => setIsSearching(false), 300) // Small delay for smooth UX
  }


  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) {
      return
    }

    try {
      await apiClient.deleteSong(songId)
      loadSongs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete song')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-creative from-primary-500 to-creative-500 opacity-20 blur-lg"></div>
          </div>
          <p className="mt-4 text-neutral-600 font-medium animate-pulse-soft">Loading your songs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-r from-primary-100/80 via-creative-100/60 to-warm-100/80 backdrop-blur-sm border-b border-primary-200/40">
        <div className="absolute inset-0 bg-mesh-creative opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700 text-white text-sm font-semibold shadow-md border border-indigo-400 mb-2">
                ✨ Your Creative Space
              </div>
              <p className="text-base text-neutral-800 max-w-2xl font-medium">
                Artist-powered. AI-assisted.
              </p>
                              <div className="mt-1 flex items-center space-x-4 text-xs text-neutral-700 font-medium bg-white/50 py-1 px-2 rounded-lg inline-flex">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-success-500 ring-1 ring-success-600"></div>
                  <span>Auto-save enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 ring-1 ring-primary-600"></div>
                  <span>AI assistance ready</span>
                  <span className="text-xs bg-indigo-500 text-white p-0.5 rounded-full inline-flex items-center justify-center w-4 h-4">♪</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowCreateForm(true)}
                className="group relative bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2 px-5 rounded-xl shadow-md hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 border border-indigo-400"
              >
                <div className="relative">
                  <span className="text-xl bg-indigo-500 text-white p-1 rounded-full inline-flex items-center justify-center w-6 h-6">♪</span>
                </div>
                <span className="text-base">Create New Song</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-creative from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 p-6 shadow-medium animate-slide-up">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <div className="text-red-800 font-medium">{error}</div>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="mb-12 animate-slide-up">
            <div className="relative bg-white/80 backdrop-blur-xl shadow-strong rounded-3xl border border-primary-200/40 p-8 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-creative from-primary-300/25 to-creative-300/25 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
              
              <div className="relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                      Create New Song
                    </h2>
                    <p className="text-neutral-600 mt-2 text-lg">Start your next musical masterpiece</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="group flex items-center justify-center w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <span className="group-hover:rotate-90 transition-transform duration-200">✕</span>
                  </button>
                </div>
                <SongForm key="create" onSuccess={handleSongCreated} onCancel={() => setShowCreateForm(false)} />
              </div>
            </div>
          </div>
        )}


        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            songs={songs}
            onSearch={handleSearch}
            placeholder="Search songs by title, artist, lyrics, or tags..."
          />
        </div>

        {/* Songs Library */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl border border-primary-200/40 shadow-strong p-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-vibrant from-creative-400/20 to-primary-400/20 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>
          
          <div className="relative">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                    {currentSearch.query ? 'Search Results' : 'Your Songs'}
                  </h2>
                  <p className="text-neutral-600 mt-2 text-lg">
                    {currentSearch.query ? (
                      `${searchResults.length} ${searchResults.length === 1 ? 'song' : 'songs'} found`
                    ) : (
                      `${songs.length} ${songs.length === 1 ? 'song' : 'songs'} in your creative library`
                    )}
                  </p>
                </div>
                {songs.length > 0 && !currentSearch.query && (
                  <div className="hidden sm:flex items-center space-x-4 text-sm text-neutral-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-creative from-success-400 to-success-500"></div>
                      <span>Completed: {songs.filter(s => s.status === 'completed').length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-creative from-warm-400 to-warm-500"></div>
                      <span>In Progress: {songs.filter(s => s.status === 'in_progress').length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Display search results or regular song list */}
            {currentSearch.query || currentSearch.status !== 'all' || (currentSearch.tags && currentSearch.tags.length > 0) ? (
              <SearchResults
                results={searchResults}
                query={currentSearch.query}
                onEditSong={onEditSong}
                onDeleteSong={handleDeleteSong}
                loading={isSearching}
              />
            ) : songs.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative mb-8">
                  <div className="text-8xl mb-4 opacity-70">🎵</div>
                  <div className="absolute inset-0 bg-gradient-creative from-primary-500/25 to-creative-500/25 rounded-full blur-2xl"></div>
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-neutral-800 mb-3">Your creative journey starts here</h3>
                  <p className="text-neutral-600 mb-8 text-lg leading-relaxed">
                    Every legendary song began as an idea. Let's turn your inspiration into music.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="group relative bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-strong hover:shadow-glow-creative transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center space-x-3">
                      <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                      <span>Create Your First Song</span>
                    </span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-creative from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {songs.map((song, index) => (
                  <div key={song.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <SongCard
                      song={song}
                      onEdit={() => onEditSong(song.id)}
                      onDelete={() => handleDeleteSong(song.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}