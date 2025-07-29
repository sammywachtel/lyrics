import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Song, SongSettings } from '../lib/api'
import { createDefaultSettings, apiClient } from '../lib/api'
import SongSettingsPanel from './SongSettingsPanel'
import SectionToolbar from './SectionToolbar'
import SectionNavigation from './SectionNavigation'
import { parseSections, insertSectionAtPosition, getPositionOfSection, getSectionAtLine } from '../utils/sectionUtils'

interface SongEditorProps {
  songId: string
  onSongChange?: (song: Song) => void
  onClose?: () => void
}

export const SongEditor: React.FC<SongEditorProps> = ({
  songId,
  onSongChange,
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
  const [showSettingsPanel, setShowSettingsPanel] = useState(true)
  const [showSectionNav, setShowSectionNav] = useState(false)
  const [sections, setSections] = useState<ReturnType<typeof parseSections>>([])
  const [currentSection, setCurrentSection] = useState<string>('')
  
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null)

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
    } catch (err) {
      console.error('Failed to save song:', err)
      setError(err instanceof Error ? err.message : 'Failed to save song')
    } finally {
      setIsSaving(false)
    }
  }, [song, songId, title, artist, lyrics, status, tags, settings, onSongChange])

  // Auto-save functionality (optional)
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave])

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: SongSettings) => {
    setSettings(newSettings)
  }, [])

  // Parse sections whenever lyrics change
  useEffect(() => {
    const parsedSections = parseSections(lyrics)
    setSections(parsedSections)
  }, [lyrics])

  // Update current section based on cursor position
  const updateCurrentSection = useCallback(() => {
    if (!lyricsTextareaRef.current) return
    
    const textarea = lyricsTextareaRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = lyrics.substring(0, cursorPosition)
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
    if (!lyricsTextareaRef.current) return
    
    const textarea = lyricsTextareaRef.current
    const cursorPosition = textarea.selectionStart
    
    const { newLyrics, newPosition } = insertSectionAtPosition(lyrics, cursorPosition, sectionTag)
    setLyrics(newLyrics)
    
    // Set cursor position after the inserted section
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newPosition, newPosition)
      updateCurrentSection()
    }, 0)
  }, [lyrics, updateCurrentSection])

  // Jump to a specific section
  const handleJumpToSection = useCallback((sectionName: string) => {
    if (!lyricsTextareaRef.current) return
    
    const position = getPositionOfSection(lyrics, sectionName)
    if (position !== null) {
      const textarea = lyricsTextareaRef.current
      textarea.focus()
      textarea.setSelectionRange(position, position)
      textarea.scrollTop = Math.max(0, (position / lyrics.length) * textarea.scrollHeight - textarea.clientHeight / 2)
      updateCurrentSection()
    }
  }, [lyrics, updateCurrentSection])


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading song...</span>
      </div>
    )
  }

  if (error && !song) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Song List
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Settings Panel */}
      {showSettingsPanel && (
        <SongSettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          isVisible={showSettingsPanel}
          onToggleVisibility={() => setShowSettingsPanel(!showSettingsPanel)}
        />
      )}

      {/* Main Editor */}
      <div className={`flex-1 flex flex-col ${showSettingsPanel ? 'ml-80' : 'ml-0'} transition-all duration-300`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0 px-2 py-1 rounded"
                title="Back to Song List"
              >
                ← Back
              </button>
              {!showSettingsPanel && (
                <button
                  onClick={() => setShowSettingsPanel(true)}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0 px-2 py-1 rounded"
                  title="Show Settings"
                >
                  ⚙️ Settings
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                  {title || 'Untitled Song'}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {artist && `by ${artist} • `}
                  Status: {status}
                  {hasUnsavedChanges && ' • Unsaved changes'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg hidden sm:block max-w-xs truncate">
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasUnsavedChanges && !isSaving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Changes' : '✓ Saved'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Song Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Song Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    placeholder="Enter tags separated by commas..."
                  />
                </div>
              </div>
            </div>

            {/* Lyrics Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
              <div className="flex justify-between items-center p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lyrics</h2>
                {currentSection && (
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    📍 {currentSection}
                  </div>
                )}
              </div>
              
              <SectionToolbar
                onInsertSection={handleInsertSection}
                onShowSectionNav={() => setShowSectionNav(!showSectionNav)}
                hasExistingSections={sections.length > 0}
              />
              
              <div className="relative">
                <textarea
                  ref={lyricsTextareaRef}
                  value={lyrics}
                  onChange={(e) => handleLyricsChange(e.target.value)}
                  onKeyUp={updateCurrentSection}
                  onMouseUp={updateCurrentSection}
                  className="w-full border-0 px-4 py-4 text-sm focus:outline-none font-mono resize-none transition-colors text-gray-900 bg-white"
                  rows={24}
                  placeholder="Enter your lyrics here...

[Verse 1]
Start writing your song...

[Chorus]
This is where the chorus goes...

[Verse 2]
Continue with verse 2..."
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
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                <div className="flex space-x-4">
                  <span>Lines: {lyrics.split('\n').length}</span>
                  <span>Characters: {lyrics.length}</span>
                  {sections.length > 0 && (
                    <span>Sections: {sections.length}</span>
                  )}
                </div>
                {sections.length > 0 && (
                  <span>
                    {sections.map((section, index) => (
                      <span key={index} className="mr-2">
                        {section.name}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* Settings Preview */}
            {settings && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-700 mb-1">Point of View</div>
                    <div className="text-gray-600 capitalize">{settings.narrative_pov.replace('_', ' ')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-700 mb-1">Energy Level</div>
                    <div className="text-gray-600">{settings.energy_level}/10</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-700 mb-1">Primary Genre</div>
                    <div className="text-gray-600">{settings.style_guide.primary_genre || 'Not specified'}</div>
                  </div>
                  {settings.central_theme && (
                    <div className="bg-gray-50 rounded-lg p-4 lg:col-span-3">
                      <div className="font-medium text-gray-700 mb-1">Central Theme</div>
                      <div className="text-gray-600">{settings.central_theme}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowSettingsPanel(true)}
                  className="mt-6 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View all settings →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongEditor