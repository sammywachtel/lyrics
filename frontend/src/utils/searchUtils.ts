/**
 * Utilities for searching and filtering songs
 */

import { formatTextToPlain } from './textFormatting'
import type { Song } from '../types/song'

export interface SearchFilters {
  query: string
  status?: Song['status'] | 'all'
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  sortBy?: 'title' | 'artist' | 'updated_at' | 'created_at' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  song: Song
  score: number
  matches: {
    title?: string[]
    artist?: string[]
    lyrics?: string[]
    tags?: string[]
  }
}

/**
 * Normalize text for searching (lowercase, remove special chars, etc.)
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove formatting markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1')     // Italic
    .replace(/_([^_]+)_/g, '$1')       // Underline
    // Normalize whitespace
    .replace(/\s+/g, ' ')
}

/**
 * Check if text contains search terms
 */
export function textContainsQuery(text: string, query: string): boolean {
  if (!query.trim()) return true

  const normalizedText = normalizeSearchText(text)
  const normalizedQuery = normalizeSearchText(query)

  // Support phrase searching with quotes
  if (normalizedQuery.includes('"')) {
    const phrases = normalizedQuery.match(/"([^"]+)"/g) || []
    return phrases.every(phrase => {
      const cleanPhrase = phrase.replace(/"/g, '')
      return normalizedText.includes(cleanPhrase)
    })
  }

  // Support multiple search terms (AND logic)
  const terms = normalizedQuery.split(' ').filter(term => term.length > 0)
  return terms.every(term => normalizedText.includes(term))
}

/**
 * Find matching text segments for highlighting
 */
export function findMatchingSegments(text: string, query: string): string[] {
  if (!query.trim()) return []

  const normalizedText = normalizeSearchText(text)
  const normalizedQuery = normalizeSearchText(query)
  const matches: string[] = []

  // Find phrase matches
  if (normalizedQuery.includes('"')) {
    const phrases = normalizedQuery.match(/"([^"]+)"/g) || []
    phrases.forEach(phrase => {
      const cleanPhrase = phrase.replace(/"/g, '')
      if (normalizedText.includes(cleanPhrase)) {
        matches.push(cleanPhrase)
      }
    })
  } else {
    // Find individual term matches
    const terms = normalizedQuery.split(' ').filter(term => term.length > 0)
    terms.forEach(term => {
      if (normalizedText.includes(term)) {
        matches.push(term)
      }
    })
  }

  return matches
}

/**
 * Calculate search relevance score for a song
 */
export function calculateRelevanceScore(song: Song, query: string): number {
  if (!query.trim()) return 0

  let score = 0
  const normalizedQuery = normalizeSearchText(query)
  const queryLength = normalizedQuery.length

  // Title matches (highest weight)
  if (song.title && textContainsQuery(song.title, query)) {
    const titleWeight = normalizeSearchText(song.title).length / queryLength
    score += Math.min(titleWeight * 100, 100)
  }

  // Artist matches (high weight)
  if (song.artist && textContainsQuery(song.artist, query)) {
    const artistWeight = normalizeSearchText(song.artist).length / queryLength
    score += Math.min(artistWeight * 80, 80)
  }

  // Tag matches (medium weight)
  if (song.tags && song.tags.length > 0) {
    song.tags.forEach(tag => {
      if (textContainsQuery(tag, query)) {
        score += 50
      }
    })
  }

  // Lyrics matches (lower weight but important for content search)
  if (song.lyrics && textContainsQuery(song.lyrics, query)) {
    const plainLyrics = formatTextToPlain(song.lyrics)
    const lyricsLength = normalizeSearchText(plainLyrics).length
    const lyricsWeight = Math.min(lyricsLength / queryLength, 10)
    score += lyricsWeight * 5
  }

  return score
}

/**
 * Filter songs based on search criteria
 */
export function filterSongs(songs: Song[], filters: SearchFilters): SearchResult[] {
  let filteredSongs = [...songs]

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    filteredSongs = filteredSongs.filter(song => song.status === filters.status)
  }

  // Apply tag filter
  if (filters.tags && filters.tags.length > 0) {
    filteredSongs = filteredSongs.filter(song =>
      song.tags && song.tags.some(tag =>
        filters.tags!.some(filterTag =>
          normalizeSearchText(tag).includes(normalizeSearchText(filterTag))
        )
      )
    )
  }

  // Apply date range filter
  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    filteredSongs = filteredSongs.filter(song => {
      const songDate = new Date(song.updated_at || song.created_at)
      if (start && songDate < start) return false
      if (end && songDate > end) return false
      return true
    })
  }

  // Apply text search and calculate relevance
  const results: SearchResult[] = []

  filteredSongs.forEach(song => {
    if (!filters.query.trim()) {
      // No query, include all filtered songs
      results.push({
        song,
        score: 0,
        matches: {}
      })
    } else {
      // Calculate relevance score
      const score = calculateRelevanceScore(song, filters.query)

      if (score > 0) {
        // Find matches for highlighting
        const matches: SearchResult['matches'] = {}

        if (song.title && textContainsQuery(song.title, filters.query)) {
          matches.title = findMatchingSegments(song.title, filters.query)
        }

        if (song.artist && textContainsQuery(song.artist, filters.query)) {
          matches.artist = findMatchingSegments(song.artist, filters.query)
        }

        if (song.lyrics && textContainsQuery(song.lyrics, filters.query)) {
          matches.lyrics = findMatchingSegments(song.lyrics, filters.query)
        }

        if (song.tags && song.tags.length > 0) {
          const matchingTags = song.tags.filter(tag =>
            textContainsQuery(tag, filters.query)
          )
          if (matchingTags.length > 0) {
            matches.tags = matchingTags.flatMap(tag =>
              findMatchingSegments(tag, filters.query)
            )
          }
        }

        results.push({
          song,
          score,
          matches
        })
      }
    }
  })

  // Sort results
  const sortBy = filters.sortBy || 'relevance'
  const sortOrder = filters.sortOrder || 'desc'

  results.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'title':
        comparison = (a.song.title || '').localeCompare(b.song.title || '')
        break
      case 'artist':
        comparison = (a.song.artist || '').localeCompare(b.song.artist || '')
        break
      case 'created_at':
        comparison = new Date(a.song.created_at).getTime() - new Date(b.song.created_at).getTime()
        break
      case 'updated_at':
        comparison = new Date(a.song.updated_at || a.song.created_at).getTime() -
                    new Date(b.song.updated_at || b.song.created_at).getTime()
        break
      case 'relevance':
      default:
        comparison = a.score - b.score
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return results
}

/**
 * Get unique tags from a list of songs
 */
export function extractUniqueTags(songs: Song[]): string[] {
  const tagSet = new Set<string>()

  songs.forEach(song => {
    if (song.tags) {
      song.tags.forEach(tag => tagSet.add(tag))
    }
  })

  return Array.from(tagSet).sort()
}

/**
 * Highlight matching text in a string
 */
export function highlightMatches(text: string, matches: string[]): string {
  if (!matches.length) return text

  // Sort matches by length (longest first) to handle overlapping matches correctly
  const sortedMatches = [...matches].sort((a, b) => b.length - a.length)

  // Track which parts of the text have already been highlighted
  const highlights: { start: number, end: number, match: string }[] = []

  sortedMatches.forEach(match => {
    const normalizedMatch = normalizeSearchText(match)
    const normalizedText = normalizeSearchText(text)

    let startIndex = 0
    let matchIndex: number

    // Find all occurrences of this match
    while ((matchIndex = normalizedText.indexOf(normalizedMatch, startIndex)) !== -1) {
      const endIndex = matchIndex + normalizedMatch.length

      // Check if this area is already highlighted by a longer match
      const isOverlapping = highlights.some(h =>
        (matchIndex >= h.start && matchIndex < h.end) ||
        (endIndex > h.start && endIndex <= h.end) ||
        (matchIndex <= h.start && endIndex >= h.end)
      )

      if (!isOverlapping) {
        highlights.push({ start: matchIndex, end: endIndex, match })
      }

      startIndex = matchIndex + 1
    }
  })

  // Sort highlights by position
  highlights.sort((a, b) => a.start - b.start)

  // Apply highlights from right to left to preserve indices
  let result = text
  for (let i = highlights.length - 1; i >= 0; i--) {
    const highlight = highlights[i]
    const beforeHighlight = result.substring(0, highlight.start)
    const highlightText = result.substring(highlight.start, highlight.end)
    const afterHighlight = result.substring(highlight.end)

    result = beforeHighlight + `<mark>${highlightText}</mark>` + afterHighlight
  }

  return result
}
