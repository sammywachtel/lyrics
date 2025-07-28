import { useState, useEffect } from 'react'
import type { Song } from '../lib/api'
import { apiClient } from '../lib/api'
import { SongCard } from './SongCard'
import { SongForm } from './SongForm'

export function SongList() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)

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

  const handleSongUpdated = () => {
    setEditingSong(null)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Songs</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
        >
          New Song
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Song</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <SongForm onSuccess={handleSongCreated} onCancel={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}

      {editingSong && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Song</h2>
              <button
                onClick={() => setEditingSong(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <SongForm 
              song={editingSong} 
              onSuccess={handleSongUpdated} 
              onCancel={() => setEditingSong(null)} 
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {songs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 text-lg">No songs yet</div>
            <div className="text-gray-400 text-sm mt-2">Create your first song to get started!</div>
          </div>
        ) : (
          songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onEdit={() => setEditingSong(song)}
              onDelete={() => handleDeleteSong(song.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}