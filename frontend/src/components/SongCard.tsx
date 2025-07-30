import type { Song } from '../lib/api'

interface SongCardProps {
  song: Song
  onEdit: () => void
  onDelete: () => void
}

export function SongCard({ song, onEdit, onDelete }: SongCardProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-success-100 to-success-200',
          text: 'text-success-800',
          icon: '✓',
          ring: 'ring-success-200/50'
        }
      case 'in_progress':
        return {
          bg: 'bg-gradient-to-r from-warm-100 to-warm-200',
          text: 'text-warm-800',
          icon: '⏳',
          ring: 'ring-warm-200/50'
        }
      case 'archived':
        return {
          bg: 'bg-gradient-to-r from-neutral-100 to-neutral-200',
          text: 'text-neutral-700',
          icon: '📎',
          ring: 'ring-neutral-200/50'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-primary-100 to-primary-200',
          text: 'text-primary-800',
          icon: '✏️',
          ring: 'ring-primary-200/50'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const truncateLyrics = (lyrics: string, maxLength: number = 100) => {
    if (lyrics.length <= maxLength) return lyrics
    return lyrics.substring(0, maxLength) + '...'
  }

  const statusStyles = getStatusStyles(song.status)
  
  return (
    <div className="group relative bg-white/70 backdrop-blur-sm shadow-medium hover:shadow-strong rounded-2xl border border-white/50 p-6 transition-all duration-300 hover:scale-[1.02] transform overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-creative from-primary-200/10 to-creative-200/10 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-800 transition-colors duration-300">
              {song.title}
            </h3>
            {song.artist && (
              <p className="text-sm text-neutral-600 mb-2 flex items-center">
                <span className="mr-2 w-4 h-4 rounded-full bg-gradient-creative from-primary-400 to-creative-500 flex items-center justify-center text-white text-xs">♪</span>
                by {song.artist}
              </p>
            )}
          </div>
          <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${statusStyles.bg} ${statusStyles.text} ring-1 ${statusStyles.ring} backdrop-blur-sm`}>
            <span>{statusStyles.icon}</span>
            <span>{song.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Lyrics Preview */}
        <div className="mb-4 bg-gradient-to-br from-neutral-50/80 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-neutral-200/30">
          <div className="text-sm text-neutral-700 whitespace-pre-wrap font-mono leading-relaxed">
            {song.lyrics ? truncateLyrics(song.lyrics) : (
              <span className="text-neutral-500 italic">No lyrics yet... Click Edit to start writing!</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {song.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {song.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-primary-100/80 to-creative-100/80 text-primary-800 border border-primary-200/50 backdrop-blur-sm"
                >
                  #{tag}
                </span>
              ))}
              {song.tags.length > 3 && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100/80 text-neutral-600 border border-neutral-200/50">
                  +{song.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex justify-between items-center text-xs text-neutral-500 mb-6 bg-gradient-to-r from-neutral-50/50 to-white/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-neutral-200/20">
          <span className="flex items-center space-x-1">
            <span>📅</span>
            <span>Created {formatDate(song.created_at)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>✏️</span>
            <span>Updated {formatDate(song.updated_at)}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="group/btn flex-1 relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium">Edit Song</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
          </button>
          <button
            onClick={onDelete}
            className="group/del relative overflow-hidden bg-neutral-100 hover:bg-red-500 text-neutral-600 hover:text-white p-3 rounded-xl border border-neutral-200 hover:border-red-500 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:scale-[1.02]"
            title="Delete song"
          >
            <span className="group-hover/del:scale-110 transition-transform duration-200">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  )
}