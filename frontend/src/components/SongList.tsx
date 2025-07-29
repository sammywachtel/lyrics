import { useState, useEffect } from 'react'
import type { Song } from '../lib/api'
import { apiClient } from '../lib/api'
import { SongCard } from './SongCard'
import { SongForm } from './SongForm'

interface SongListProps {
  onEditSong: (songId: string) => void
}

export function SongList({ onEditSong }: SongListProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)


  const loadSongs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.listSongs()
      setSongs(response.songs)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSongs()
  }, [])

  const handleSongCreated = () => {
    setShowCreateForm(false)
    loadSongs()
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Songs</h1>
              <p className="mt-2 text-lg text-gray-600">Create and manage your songwriting projects</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <span className="text-lg">+</span>
              <span>New Song</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-l-4 border-red-400 p-6 shadow-sm">
            <div className="flex">
              <div className="text-red-400 mr-3">⚠️</div>
              <div className="text-sm text-red-800 font-medium">{error}</div>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="mb-8">
            <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Song</h2>
                  <p className="text-gray-600 mt-1">Start your next musical masterpiece</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <SongForm key="create" onSuccess={handleSongCreated} onCancel={() => setShowCreateForm(false)} />
            </div>
          </div>
        )}


        {/* Songs Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Songs</h2>
            <p className="text-gray-600 mt-1">{songs.length} {songs.length === 1 ? 'song' : 'songs'} in your library</p>
          </div>
          
          {songs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎵</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">No songs yet</div>
              <div className="text-gray-500 mb-6">Create your first song to get started!</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Create Your First Song
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={() => onEditSong(song.id)}
                  onDelete={() => handleDeleteSong(song.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}