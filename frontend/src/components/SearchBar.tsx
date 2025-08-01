import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { Song } from '../lib/api'
import type { SearchFilters } from '../utils/searchUtils'
import { extractUniqueTags } from '../utils/searchUtils'

interface SearchBarProps {
  songs: Song[]
  onSearch: (filters: SearchFilters) => void
  placeholder?: string
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  songs,
  onSearch,
  placeholder = 'Search songs by title, artist, lyrics, or tags...',
  className = ''
}) => {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  })
  const [availableTags] = useState(() => extractUniqueTags(songs))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const filtersPanelRef = useRef<HTMLDivElement>(null)

  // Handle search input changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    const newFilters = { ...filters, query: newQuery }
    setFilters(newFilters)
    onSearch(newFilters)
  }, [filters, onSearch])

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | boolean | string[]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onSearch(newFilters)
  }, [filters, onSearch])

  // Handle tag selection
  const handleTagToggle = useCallback((tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    handleFilterChange('tags', newTags)
  }, [filters.tags, handleFilterChange])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      query: '',
      status: 'all',
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    }
    setQuery('')
    setFilters(clearedFilters)
    onSearch(clearedFilters)
  }, [onSearch])

  // Close filters panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersPanelRef.current && !filtersPanelRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowFilters(false)
      searchInputRef.current?.blur()
    }
  }, [])

  const hasActiveFilters = filters.status !== 'all' || 
                          (filters.tags && filters.tags.length > 0) ||
                          filters.sortBy !== 'relevance'

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-neutral-400 text-lg">🔍</span>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-20 py-4 bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-xl text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-soft focus:shadow-medium"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-4">
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
              title="Clear search"
            >
              <span className="text-lg">✕</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showFilters || hasActiveFilters
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Search filters"
          >
            <span className="flex items-center space-x-1">
              <span>⚙️</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white"></span>}
            </span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div 
          ref={filtersPanelRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-neutral-200/50 rounded-xl shadow-strong p-6 z-50 animate-slide-up"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Search Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearFilters}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value as Song['status'] | 'all')}
                className="w-full px-3 py-2 bg-white border border-neutral-200/50 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="all">All Songs</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200/50 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="relevance">Relevance</option>
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="updated_at">Last Modified</option>
                  <option value="created_at">Date Created</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-white border border-neutral-200/50 rounded-lg text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Tags ({filters.tags?.length || 0} selected)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.tags?.includes(tag)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {query && (
        <div className="mt-2 text-xs text-neutral-500">
          <span>💡 Tip: Use quotes for exact phrases like "love song" or search multiple terms</span>
        </div>
      )}
    </div>
  )
}

export default SearchBar