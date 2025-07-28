import { useState } from 'react'
import type { Song, SongCreate, SongUpdate } from '../lib/api'
import { apiClient } from '../lib/api'

interface SongFormProps {
  song?: Song | null
  onSuccess: () => void
  onCancel: () => void
}

export function SongForm({ song, onSuccess, onCancel }: SongFormProps) {
  const [title, setTitle] = useState(song?.title || '')
  const [artist, setArtist] = useState(song?.artist || '')
  const [lyrics, setLyrics] = useState(song?.lyrics || '')
  const [status, setStatus] = useState(song?.status || 'draft')
  const [tags, setTags] = useState(song?.tags.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      if (song) {
        // Update existing song
        const updateData: SongUpdate = {
          title,
          artist: artist || undefined,
          lyrics,
          status: status as any,
          tags: tagArray,
          metadata: {}
        }
        await apiClient.updateSong(song.id, updateData)
      } else {
        // Create new song
        const createData: SongCreate = {
          title,
          artist: artist || undefined,
          lyrics,
          status: status as any,
          tags: tagArray,
          metadata: {}
        }
        await apiClient.createSong(createData)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save song')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          id="title"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
          Artist
        </label>
        <input
          type="text"
          id="artist"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          placeholder="rock, original, collaboration"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700">
          Lyrics
        </label>
        <textarea
          id="lyrics"
          rows={10}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : song ? 'Update Song' : 'Create Song'}
        </button>
      </div>
    </form>
  )
}