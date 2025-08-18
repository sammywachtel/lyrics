import React from 'react'
import type { SearchResult } from '../utils/searchUtils'
import { highlightMatches } from '../utils/searchUtils'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onEditSong: (songId: string) => void
  onDeleteSong: (songId: string) => void
  loading?: boolean
  className?: string
}

interface HighlightedTextProps {
  text: string
  matches: string[]
  className?: string
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches, className = '' }) => {
  if (!matches.length) {
    return <span className={className}>{text}</span>
  }

  const highlightedHtml = highlightMatches(text, matches)

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  )
}

const SearchResultCard: React.FC<{
  result: SearchResult
  onEditSong: (songId: string) => void
  onDeleteSong: (songId: string) => void
}> = ({ result, onEditSong, onDeleteSong }) => {
  const { song, matches, score } = result

  return (
    <div className="relative">
      {/* Relevance Score (for debugging) */}
      {score > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
            {Math.round(score)}
          </span>
        </div>
      )}

      {/* Enhanced Song Card with Highlighting */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-medium border border-white/50 p-6 hover:shadow-strong transition-all duration-300 transform hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900 mb-2 truncate">
              <HighlightedText
                text={song.title || 'Untitled Song'}
                matches={matches.title || []}
              />
            </h3>

            {song.artist && (
              <p className="text-neutral-600 mb-2">
                by <HighlightedText
                  text={song.artist}
                  matches={matches.artist || []}
                  className="font-medium"
                />
              </p>
            )}

            <div className="flex items-center space-x-4 text-sm text-neutral-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                song.status === 'completed' ? 'bg-success-100 text-success-700' :
                song.status === 'in_progress' ? 'bg-warm-100 text-warm-700' :
                song.status === 'archived' ? 'bg-neutral-100 text-neutral-600' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {song.status.replace('_', ' ')}
              </span>

              <span>
                {new Date(song.updated_at || song.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search Matches Preview */}
        {(matches.lyrics || matches.tags) && (
          <div className="mb-4 p-3 bg-neutral-50/50 rounded-lg border border-neutral-200/30">
            {matches.lyrics && matches.lyrics.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                  Found in lyrics:
                </span>
                <p className="text-sm text-neutral-700 mt-1">
                  {matches.lyrics.map((match, index) => (
                    <span key={index} className="inline-block mr-2 mb-1">
                      <span className="bg-yellow-200 text-yellow-800 px-1 rounded">
                        "{match}"
                      </span>
                    </span>
                  ))}
                </p>
              </div>
            )}

            {matches.tags && matches.tags.length > 0 && (
              <div>
                <span className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                  Matching tags:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {matches.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                      <HighlightedText text={tag} matches={[tag]} />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {song.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-neutral-100/80 text-neutral-700 text-xs rounded-lg border border-neutral-200/50">
                  <HighlightedText
                    text={tag}
                    matches={matches.tags?.includes(tag) ? [tag] : []}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-neutral-500">
            {song.lyrics ? `${song.lyrics.split('\n').length} lines` : 'No lyrics yet'}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => onEditSong(song.id)}
              className="group relative bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-medium hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>📝</span>
                <span>Edit Song</span>
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-creative from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => onDeleteSong(song.id)}
              className="text-neutral-400 hover:text-red-500 transition-colors duration-200 p-2"
              title="Delete song"
            >
              <span className="text-lg">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onEditSong,
  onDeleteSong,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-creative from-indigo-500 to-purple-500 opacity-20 blur-lg"></div>
          </div>
          <p className="mt-4 text-neutral-600 font-medium animate-pulse-soft">Searching your songs...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4 opacity-50">🔍</div>
        <h3 className="text-xl font-bold text-neutral-800 mb-2">
          {query ? 'No songs found' : 'No songs to display'}
        </h3>
        <p className="text-neutral-600 max-w-md mx-auto">
          {query
            ? `No songs match your search for "${query}". Try different keywords or check your filters.`
            : 'Start writing your first song to see it here!'
          }
        </p>
        {query && (
          <div className="mt-4 text-sm text-neutral-500">
            <p>💡 Search tips:</p>
            <ul className="mt-2 space-y-1">
              <li>• Try searching by title, artist, or lyrics content</li>
              <li>• Use quotes for exact phrases: "love song"</li>
              <li>• Check if any filters are limiting results</li>
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Results Summary */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">{results.length}</span>
          {' '}
          {results.length === 1 ? 'song' : 'songs'}
          {query && (
            <>
              {' '} matching{' '}
              <span className="font-medium bg-neutral-100 px-2 py-1 rounded">"{query}"</span>
            </>
          )}
        </div>

        {query && results.length > 0 && (
          <div className="text-xs text-neutral-500">
            Sorted by {results[0].score > 0 ? 'relevance' : 'date'}
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result, index) => (
          <div key={result.song.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <SearchResultCard
              result={result}
              onEditSong={onEditSong}
              onDeleteSong={onDeleteSong}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchResults
