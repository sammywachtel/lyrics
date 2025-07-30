import {
  normalizeSearchText,
  textContainsQuery,
  findMatchingSegments,
  calculateRelevanceScore,
  filterSongs,
  extractUniqueTags,
  highlightMatches
} from '../searchUtils'
import type { Song } from '../../lib/api'

// Mock songs for testing
const mockSongs: Song[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Love Song',
    artist: 'John Doe',
    lyrics: '**Verse 1**\nI love you so much\n*Every day*\n\n**Chorus**\nYou are my _everything_',
    status: 'completed',
    tags: ['love', 'ballad'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    settings: {} as any,
    metadata: {}
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Rock Anthem',
    artist: 'Jane Smith',
    lyrics: '**Verse 1**\nWe will rock you\nWith our sound\n\n**Chorus**\nRock and roll forever',
    status: 'in_progress',
    tags: ['rock', 'anthem'],
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    settings: {} as any,
    metadata: {}
  },
  {
    id: '3',
    user_id: 'user1',
    title: 'Acoustic Dreams',
    artist: 'John Doe',
    lyrics: 'Simple acoustic melody\nDreaming of better days',
    status: 'draft',
    tags: ['acoustic', 'folk'],
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    settings: {} as any,
    metadata: {}
  }
]

describe('searchUtils', () => {
  describe('normalizeSearchText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeSearchText('Hello World')).toBe('hello world')
    })

    it('should remove formatting markers', () => {
      expect(normalizeSearchText('**bold** *italic* _underline_')).toBe('bold italic underline')
    })

    it('should normalize whitespace', () => {
      expect(normalizeSearchText('  hello    world  ')).toBe('hello world')
    })

    it('should handle empty text', () => {
      expect(normalizeSearchText('')).toBe('')
    })
  })

  describe('textContainsQuery', () => {
    it('should return true for matching text', () => {
      expect(textContainsQuery('Hello World', 'hello')).toBe(true)
      expect(textContainsQuery('Hello World', 'world')).toBe(true)
    })

    it('should return false for non-matching text', () => {
      expect(textContainsQuery('Hello World', 'goodbye')).toBe(false)
    })

    it('should handle multiple search terms (AND logic)', () => {
      expect(textContainsQuery('Hello Beautiful World', 'hello world')).toBe(true)
      expect(textContainsQuery('Hello World', 'hello goodbye')).toBe(false)
    })

    it('should handle phrase searching with quotes', () => {
      expect(textContainsQuery('Hello Beautiful World', '"hello beautiful"')).toBe(true)
      expect(textContainsQuery('Hello World Beautiful', '"hello beautiful"')).toBe(false)
    })

    it('should return true for empty query', () => {
      expect(textContainsQuery('Hello World', '')).toBe(true)
      expect(textContainsQuery('Hello World', '   ')).toBe(true)
    })

    it('should ignore formatting markers', () => {
      expect(textContainsQuery('**Hello** *World*', 'hello world')).toBe(true)
    })
  })

  describe('findMatchingSegments', () => {
    it('should find individual term matches', () => {
      const matches = findMatchingSegments('Hello Beautiful World', 'hello world')
      expect(matches).toContain('hello')
      expect(matches).toContain('world')
    })

    it('should find phrase matches', () => {
      const matches = findMatchingSegments('Hello Beautiful World', '"hello beautiful"')
      expect(matches).toContain('hello beautiful')
    })

    it('should return empty array for no matches', () => {
      const matches = findMatchingSegments('Hello World', 'goodbye')
      expect(matches).toEqual([])
    })

    it('should return empty array for empty query', () => {
      const matches = findMatchingSegments('Hello World', '')
      expect(matches).toEqual([])
    })
  })

  describe('calculateRelevanceScore', () => {
    it('should give highest score for title matches', () => {
      const score = calculateRelevanceScore(mockSongs[0], 'love song')
      expect(score).toBeGreaterThan(50)
    })

    it('should give high score for artist matches', () => {
      const score = calculateRelevanceScore(mockSongs[0], 'john doe')
      expect(score).toBeGreaterThan(30)
    })

    it('should give medium score for tag matches', () => {
      const score = calculateRelevanceScore(mockSongs[0], 'ballad')
      expect(score).toBe(50)
    })

    it('should give some score for lyrics matches', () => {
      const score = calculateRelevanceScore(mockSongs[0], 'everything')
      expect(score).toBeGreaterThan(0)
    })

    it('should return 0 for no matches', () => {
      const score = calculateRelevanceScore(mockSongs[0], 'nonexistent')
      expect(score).toBe(0)
    })

    it('should return 0 for empty query', () => {
      const score = calculateRelevanceScore(mockSongs[0], '')
      expect(score).toBe(0)
    })
  })

  describe('filterSongs', () => {
    it('should return all songs for empty filters', () => {
      const results = filterSongs(mockSongs, { query: '' })
      expect(results).toHaveLength(3)
    })

    it('should filter by status', () => {
      const results = filterSongs(mockSongs, { query: '', status: 'completed' })
      expect(results).toHaveLength(1)
      expect(results[0].song.status).toBe('completed')
    })

    it('should filter by tags', () => {
      const results = filterSongs(mockSongs, { query: '', tags: ['rock'] })
      expect(results).toHaveLength(1)
      expect(results[0].song.tags).toContain('rock')
    })

    it('should search by query', () => {
      const results = filterSongs(mockSongs, { query: 'love' })
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].song.title).toContain('Love')
    })

    it('should combine multiple filters', () => {
      const results = filterSongs(mockSongs, { 
        query: 'john', 
        status: 'completed' 
      })
      expect(results).toHaveLength(1)
      expect(results[0].song.artist).toBe('John Doe')
      expect(results[0].song.status).toBe('completed')
    })

    it('should sort by relevance by default', () => {
      const results = filterSongs(mockSongs, { query: 'john' })
      expect(results.length).toBeGreaterThan(1)
      // Should be sorted by relevance score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score)
      }
    })

    it('should sort by title when specified', () => {
      const results = filterSongs(mockSongs, { 
        query: '', 
        sortBy: 'title', 
        sortOrder: 'asc' 
      })
      expect(results[0].song.title).toBe('Acoustic Dreams')
      expect(results[1].song.title).toBe('Love Song')
      expect(results[2].song.title).toBe('Rock Anthem')
    })

    it('should include match information for search results', () => {
      const results = filterSongs(mockSongs, { query: 'love' })
      expect(results[0].matches.title).toBeDefined()
      expect(results[0].matches.title).toContain('love')
    })
  })

  describe('extractUniqueTags', () => {
    it('should extract all unique tags', () => {
      const tags = extractUniqueTags(mockSongs)
      expect(tags).toContain('love')
      expect(tags).toContain('ballad')
      expect(tags).toContain('rock')
      expect(tags).toContain('anthem')
      expect(tags).toContain('acoustic')
      expect(tags).toContain('folk')
    })

    it('should return sorted tags', () => {
      const tags = extractUniqueTags(mockSongs)
      const sortedTags = [...tags].sort()
      expect(tags).toEqual(sortedTags)
    })

    it('should handle songs without tags', () => {
      const songsWithoutTags = [{ ...mockSongs[0], tags: [] }]
      const tags = extractUniqueTags(songsWithoutTags)
      expect(tags).toEqual([])
    })

    it('should handle empty song list', () => {
      const tags = extractUniqueTags([])
      expect(tags).toEqual([])
    })
  })

  describe('highlightMatches', () => {
    it('should wrap matches in mark tags', () => {
      const result = highlightMatches('Hello World', ['hello'])
      expect(result).toBe('<mark>Hello</mark> World')
    })

    it('should handle multiple matches', () => {
      const result = highlightMatches('Hello Beautiful World', ['hello', 'world'])
      expect(result).toBe('<mark>Hello</mark> Beautiful <mark>World</mark>')
    })

    it('should handle case insensitive matches', () => {
      const result = highlightMatches('Hello World', ['HELLO'])
      expect(result).toBe('<mark>Hello</mark> World')
    })

    it('should return original text for no matches', () => {
      const result = highlightMatches('Hello World', [])
      expect(result).toBe('Hello World')
    })

    it('should escape regex special characters', () => {
      const result = highlightMatches('Hello (World)', ['(world)'])
      expect(result).toBe('Hello <mark>(World)</mark>')
    })

    it('should handle overlapping matches by avoiding duplicates', () => {
      const result = highlightMatches('Hello World', ['hello world', 'hello'])
      // Should highlight the longer match and avoid nested highlights
      expect(result).toContain('<mark>')
      expect(result).not.toContain('<mark><mark>')
    })
  })
})