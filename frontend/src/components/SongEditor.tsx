import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Song, SongSettings } from '../lib/api'
import { createDefaultSettings, apiClient } from '../lib/api'
import SectionToolbar from './SectionToolbar'
import SectionNavigation from './SectionNavigation'
import SimpleWysiwygEditor from './SimpleWysiwygEditor'
import { parseSections, getSectionAtLine } from '../utils/sectionUtils'
import { getWordCount, formatTextToPlain } from '../utils/textFormatting'

interface SongEditorProps {
  songId: string
  onSongChange?: (song: Song) => void
  onSongLoaded?: (song: Song) => void
  onSettingsChange?: (settings: SongSettings) => void
  onClose?: () => void
}

export const SongEditor: React.FC<SongEditorProps> = ({
  songId,
  onSongChange,
  onSongLoaded,
  onSettingsChange,
  onClose
}) => {
  const [song, setSong] = useState<Song | null>(null)
  const [settings, setSettings] = useState<SongSettings>(createDefaultSettings())
  const [lyrics, setLyrics] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [status, setStatus] = useState<Song['status']>('draft')
  const [tags, setTags] = useState<string[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSectionNav, setShowSectionNav] = useState(false)
  const [sections, setSections] = useState<ReturnType<typeof parseSections>>([])
  const [currentSection, setCurrentSection] = useState<string>('')
  
  const wysiwygEditorRef = useRef<HTMLDivElement>(null)

  // Load song data
  useEffect(() => {
    const loadSong = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getSong(songId)
        const songData = response.song!
        
        setSong(songData)
        setTitle(songData.title)
        setArtist(songData.artist || '')
        setLyrics(songData.lyrics)
        setStatus(songData.status)
        setTags(songData.tags)
        setSettings(songData.settings || createDefaultSettings())
        setError(null)
        
        // Notify parent of song load
        if (onSongLoaded) {
          onSongLoaded(songData)
        }
      } catch (err) {
        console.error('Failed to load song:', err)
        setError(err instanceof Error ? err.message : 'Failed to load song')
      } finally {
        setIsLoading(false)
      }
    }

    loadSong()
  }, [songId])

  // Track changes
  useEffect(() => {
    if (!song) return

    const hasChanges = (
      title !== song.title ||
      artist !== (song.artist || '') ||
      lyrics !== song.lyrics ||
      status !== song.status ||
      JSON.stringify(tags) !== JSON.stringify(song.tags) ||
      JSON.stringify(settings) !== JSON.stringify(song.settings)
    )

    setHasUnsavedChanges(hasChanges)
  }, [song, title, artist, lyrics, status, tags, settings])

  // Save song
  const handleSave = useCallback(async () => {
    if (!song) return

    setIsSaving(true)
    setError(null)

    try {
      const updateData = {
        title,
        artist: artist || undefined,
        lyrics,
        status,
        tags,
        settings
      }

      const response = await apiClient.updateSong(songId, updateData)
      const updatedSong = response.song!
      
      setSong(updatedSong)
      setHasUnsavedChanges(false)
      
      if (onSongChange) {
        onSongChange(updatedSong)
      }
      if (onSettingsChange) {
        onSettingsChange(updatedSong.settings)
      }
    } catch (err) {
      console.error('Failed to save song:', err)
      setError(err instanceof Error ? err.message : 'Failed to save song')
    } finally {
      setIsSaving(false)
    }
  }, [song, songId, title, artist, lyrics, status, tags, settings, onSongChange, onSettingsChange])

  // Auto-save functionality (optional)
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave])

  // This component now works with AppLayout - settings are handled externally
  // The SongEditor focuses on lyrics editing, song metadata, and saving
  // Settings are passed down from App -> AppLayout -> SettingsPanel


  // Parse sections whenever lyrics change
  useEffect(() => {
    const parsedSections = parseSections(lyrics)
    setSections(parsedSections)
  }, [lyrics])

  // Update current section based on cursor position
  const updateCurrentSection = useCallback(() => {
    // For WYSIWYG editor, we'll determine section based on plain text representation
    const plainLyrics = formatTextToPlain(lyrics)
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    // Simplified section detection - this could be enhanced
    const textBeforeCursor = plainLyrics.substring(0, plainLyrics.length * 0.5) // Rough estimate
    const currentLine = textBeforeCursor.split('\n').length - 1
    
    const sectionAtCursor = getSectionAtLine(sections, currentLine)
    setCurrentSection(sectionAtCursor?.name || '')
  }, [lyrics, sections])

  // Handle lyrics change with section parsing
  const handleLyricsChange = useCallback((newLyrics: string) => {
    setLyrics(newLyrics)
    // Update current section after a brief delay to account for cursor movement
    setTimeout(updateCurrentSection, 0)
  }, [updateCurrentSection])

  // Insert section tag at cursor position
  const handleInsertSection = useCallback((sectionTag: string) => {
    // For WYSIWYG editor, we'll insert at the end for now
    // This could be enhanced to insert at cursor position
    const newLyrics = lyrics + (lyrics ? '\n\n' : '') + sectionTag + '\n'
    setLyrics(newLyrics)
    updateCurrentSection()
  }, [lyrics, updateCurrentSection])

  // Jump to a specific section
  const handleJumpToSection = useCallback((_sectionName: string) => {
    // For WYSIWYG editor, we'll focus the editor
    // This could be enhanced to actually jump to the section
    if (wysiwygEditorRef.current) {
      wysiwygEditorRef.current.focus()
      updateCurrentSection()
    }
  }, [updateCurrentSection])


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-creative-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-creative from-primary-500 to-creative-500 opacity-20 blur-xl"></div>
          </div>
          <p className="text-lg font-medium text-neutral-700 animate-pulse-soft">Loading your song...</p>
          <p className="text-sm text-neutral-500 mt-2">Preparing your creative workspace</p>
        </div>
      </div>
    )
  }

  if (error && !song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-creative-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">Unable to load song</h2>
          <p className="text-red-600 mb-6 bg-red-50 rounded-xl p-4 border border-red-200">{error}</p>
          <button
            onClick={onClose}
            className="bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white font-semibold py-3 px-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 transform hover:scale-105"
          >
            ← Back to Song List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-soft px-4 md:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-6 min-w-0 flex-1">
              <button
                onClick={onClose}
                className="group flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 bg-white/60 hover:bg-white/80 px-3 py-2 rounded-xl border border-neutral-200/50 hover:border-neutral-300 transition-all duration-200 shadow-soft hover:shadow-medium backdrop-blur-sm"
                title="Back to Song List"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="font-medium">Back</span>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent truncate">
                  {title || 'Untitled Song'}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  {artist && (
                    <span className="text-sm text-neutral-600 flex items-center space-x-1">
                      <span className="w-3 h-3 rounded-full bg-gradient-creative from-primary-400 to-creative-500"></span>
                      <span>by {artist}</span>
                    </span>
                  )}
                  <span className="text-sm text-neutral-500 flex items-center space-x-1">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-sm text-warm-600 bg-warm-100 px-2 py-1 rounded-lg flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-warm-500 animate-pulse"></span>
                      <span>Unsaved changes</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              {error && (
                <div className="text-sm text-red-700 bg-red-100/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-200 hidden sm:block max-w-xs truncate shadow-soft">
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`relative overflow-hidden px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  hasUnsavedChanges && !isSaving
                    ? 'bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white shadow-medium hover:shadow-glow-primary'
                    : 'bg-neutral-100 text-neutral-500 cursor-not-allowed shadow-soft'
                }`}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Saved</span>
                    </>
                  )}
                </span>
                {hasUnsavedChanges && !isSaving && (
                  <div className="absolute inset-0 bg-gradient-creative from-white/10 to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Song Metadata */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-medium border border-white/50 p-8 mb-8">
              <h2 className="text-xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-6 flex items-center space-x-2">
                <span>🎨</span>
                <span>Song Details</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-neutral-900 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white shadow-soft focus:shadow-medium"
                    placeholder="Enter song title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-neutral-900 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white shadow-soft focus:shadow-medium"
                    placeholder="Enter artist name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Song['status'])}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white text-neutral-900 shadow-soft focus:shadow-medium"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags.join(', ')}
                    onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-neutral-900 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white shadow-soft focus:shadow-medium"
                    placeholder="Enter tags separated by commas..."
                  />
                </div>
              </div>
            </div>

            {/* Lyrics Editor */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-medium border border-white/50 overflow-hidden relative mb-8">
              <div className="flex justify-between items-center p-8 pb-6">
                <h2 className="text-xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent flex items-center space-x-2">
                  <span>✍️</span>
                  <span>Lyrics</span>
                </h2>
                {currentSection && (
                  <div className="px-4 py-2 bg-gradient-creative from-primary-100 to-creative-100 text-primary-800 text-sm font-semibold rounded-xl border border-primary-200/50 shadow-soft backdrop-blur-sm flex items-center space-x-2">
                    <span>📍</span>
                    <span>{currentSection}</span>
                  </div>
                )}
              </div>
              
              <SectionToolbar
                onInsertSection={handleInsertSection}
                onShowSectionNav={() => setShowSectionNav(!showSectionNav)}
                hasExistingSections={sections.length > 0}
              />
              
              
              
              <div className="relative">
                <SimpleWysiwygEditor
                  value={lyrics}
                  onChange={handleLyricsChange}
                  onSelectionChange={updateCurrentSection}
                  placeholder="Enter your lyrics here..."
                  rows={24}
                />
                
                {showSectionNav && (
                  <SectionNavigation
                    sections={sections}
                    onJumpToSection={handleJumpToSection}
                    onClose={() => setShowSectionNav(false)}
                    currentSection={currentSection}
                  />
                )}
              </div>
              
              <div className="px-6 py-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm border-t border-neutral-200/30 flex flex-col sm:flex-row justify-between gap-4 text-sm text-neutral-600">
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                    <span>Lines: {lyrics.split('\n').length}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-creative-400"></span>
                    <span>Words: {getWordCount(lyrics)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-warm-400"></span>
                    <span>Characters: {lyrics.length}</span>
                  </span>
                  {sections.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-success-400"></span>
                      <span>Sections: {sections.length}</span>
                    </span>
                  )}
                </div>
                {sections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sections.slice(0, 3).map((section, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-100/80 text-neutral-700 rounded-lg text-xs border border-neutral-200/50">
                        {section.name}
                      </span>
                    ))}
                    {sections.length > 3 && (
                      <span className="px-2 py-1 bg-neutral-100/80 text-neutral-600 rounded-lg text-xs border border-neutral-200/50">
                        +{sections.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Settings Preview */}
            {settings && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-medium border border-white/50 p-8">
                <h2 className="text-xl font-bold bg-gradient-creative from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-6 flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>Creative Settings</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary-50/80 to-primary-100/50 backdrop-blur-sm rounded-xl p-4 border border-primary-200/30">
                    <div className="font-semibold text-primary-800 mb-2 flex items-center space-x-2">
                      <span>👁️</span>
                      <span>Point of View</span>
                    </div>
                    <div className="text-primary-700 capitalize">{settings.narrative_pov.replace('_', ' ')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-creative-50/80 to-creative-100/50 backdrop-blur-sm rounded-xl p-4 border border-creative-200/30">
                    <div className="font-semibold text-creative-800 mb-2 flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Energy Level</span>
                    </div>
                    <div className="text-creative-700">{settings.energy_level}/10</div>
                  </div>
                  <div className="bg-gradient-to-br from-warm-50/80 to-warm-100/50 backdrop-blur-sm rounded-xl p-4 border border-warm-200/30">
                    <div className="font-semibold text-warm-800 mb-2 flex items-center space-x-2">
                      <span>🎵</span>
                      <span>Primary Genre</span>
                    </div>
                    <div className="text-warm-700">{settings.style_guide.primary_genre || 'Not specified'}</div>
                  </div>
                  {settings.central_theme && (
                    <div className="bg-gradient-to-br from-success-50/80 to-success-100/50 backdrop-blur-sm rounded-xl p-4 border border-success-200/30 lg:col-span-3">
                      <div className="font-semibold text-success-800 mb-2 flex items-center space-x-2">
                        <span>🎯</span>
                        <span>Central Theme</span>
                      </div>
                      <div className="text-success-700">{settings.central_theme}</div>
                    </div>
                  )}
                </div>
                <div className="mt-8 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-neutral-200/50">
                  <p className="text-sm text-neutral-600 text-center">
                    💡 Use the Settings panel on the left to customize your song's creative parameters.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongEditor