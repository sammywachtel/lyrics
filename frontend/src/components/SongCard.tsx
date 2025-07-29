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
    <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] transform">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{song.title}</h3>
          {song.artist && (
            <p className="text-sm text-gray-600 mb-2 flex items-center">
              <span className="mr-1">🎤</span>
              by {song.artist}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(song.status)}`}>
          {song.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mb-4 bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
          {song.lyrics ? truncateLyrics(song.lyrics) : "No lyrics yet..."}
        </div>
      </div>

      {song.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {song.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500 mb-6 bg-gray-50 rounded-lg px-3 py-2">
        <span className="flex items-center">
          <span className="mr-1">📅</span>
          Created {formatDate(song.created_at)}
        </span>
        <span className="flex items-center">
          <span className="mr-1">✏️</span>
          Updated {formatDate(song.updated_at)}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          📝 Edit
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center px-3 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}