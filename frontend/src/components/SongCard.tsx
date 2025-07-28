import type { Song } from '../lib/api'

interface SongCardProps {
  song: Song
  onEdit: () => void
  onDelete: () => void
}

export function SongCard({ song, onEdit, onDelete }: SongCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const truncateLyrics = (lyrics: string, maxLength: number = 100) => {
    if (lyrics.length <= maxLength) return lyrics
    return lyrics.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{song.title}</h3>
          {song.artist && (
            <p className="text-sm text-gray-600 mb-2">by {song.artist}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(song.status)}`}>
          {song.status}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {truncateLyrics(song.lyrics)}
        </div>
      </div>

      {song.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {song.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Created {formatDate(song.created_at)}</span>
        <span>Updated {formatDate(song.updated_at)}</span>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={onEdit}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  )
}