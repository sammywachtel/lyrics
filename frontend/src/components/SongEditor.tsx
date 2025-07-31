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
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'error') => void
  onSaveHandler?: (saveFunction: () => Promise<void>) => void
}

export const SongEditor: React.FC<SongEditorProps> = ({
  songId,
  onSongChange,
  onSongLoaded,
  onSettingsChange,
  onClose,
  onSaveStatusChange,
  onSaveHandler
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
  const isMountedRef = useRef(true)
  const handleSaveRef = useRef<(() => Promise<void>) | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
  }, [songId, onSongLoaded])

  // Track changes and notify parent
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
    if (!isMountedRef.current || !song || isSaving) {
      console.log('Save skipped:', { mounted: isMountedRef.current, song: !!song, isSaving })
      return
    }

    // Double-check if there are actually changes before saving
    const hasActualChanges = (
      title !== song.title ||
      artist !== (song.artist || '') ||
      lyrics !== song.lyrics ||
      status !== song.status ||
      JSON.stringify(tags) !== JSON.stringify(song.tags) ||
      JSON.stringify(settings) !== JSON.stringify(song.settings)
    )

    if (!hasActualChanges) {
      console.log('Save skipped: no actual changes detected')
      if (isMountedRef.current) {
        setHasUnsavedChanges(false)
      }
      return
    }

    console.log('Saving song:', songId, 'changes:', { title, artist, lyrics: lyrics.length + ' chars' })
    if (!isMountedRef.current) return
    
    setIsSaving(true)
    setError(null)
    onSaveStatusChange?.('saving')

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
      
      if (!isMountedRef.current) return
      
      const updatedSong = response.song!
      
      setSong(updatedSong)
      setHasUnsavedChanges(false)
      onSaveStatusChange?.('saved')
      
      if (onSongChange) {
        onSongChange(updatedSong)
      }
      if (onSettingsChange) {
        onSettingsChange(updatedSong.settings)
      }
      console.log('Save completed for song:', songId)
    } catch (err) {
      console.error('Failed to save song:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save song')
        onSaveStatusChange?.('error')
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [song, songId, title, artist, lyrics, status, tags, settings, onSongChange, onSettingsChange, onSaveStatusChange, isSaving])

  // Update the ref whenever handleSave changes
  useEffect(() => {
    handleSaveRef.current = handleSave
  }, [handleSave])

  // Auto-save functionality (optional) - using ref to prevent infinite loops
  useEffect(() => {
    if (!hasUnsavedChanges || !song || isLoading || isSaving) return

    console.log('Auto-save: Setting up timer for song:', songId, 'hasUnsavedChanges:', hasUnsavedChanges)
    const autoSaveTimer = setTimeout(() => {
      console.log('Auto-save: Timer triggered for song:', songId)
      if (handleSaveRef.current && isMountedRef.current) {
        handleSaveRef.current()
      }
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => {
      console.log('Auto-save: Clearing timer for song:', songId)
      clearTimeout(autoSaveTimer)
    }
  }, [hasUnsavedChanges, song, isLoading, isSaving, songId])

  // Expose save handler to parent component for header integration
  React.useEffect(() => {
    if (onSaveHandler) {
      onSaveHandler(handleSave)
    }
    // Clean up previous handler when component unmounts or handleSave changes
    return () => {
      if (onSaveHandler) {
        onSaveHandler(null)
      }
    }
  }, [onSaveHandler, handleSave])
  
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
        {/* Editor Top Bar - Minimal */}
        <div className="bg-white/60 backdrop-blur-md border-b border-white/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentSection && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-creative-100 text-primary-800 text-sm font-medium rounded-lg border border-primary-200/50 shadow-soft backdrop-blur-sm flex items-center gap-2">
                <span>📍</span>
                <span>{currentSection}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-400"></span>
              <span>Words: {getWordCount(lyrics)}</span>
            </span>
            {sections.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success-400"></span>
                <span>Sections: {sections.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* Editor Content - Full Height with Proper Scrolling */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Section Toolbar */}
          <div className="bg-white/50 backdrop-blur-sm border-b border-white/20">
            <SectionToolbar
              onInsertSection={handleInsertSection}
              onShowSectionNav={() => setShowSectionNav(!showSectionNav)}
              hasExistingSections={sections.length > 0}
            />
          </div>
          
          {/* Lyrics Editor - Fills Available Height */}
          <div className="flex-1 relative overflow-hidden">
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
          
          {/* Bottom Status Bar */}
          <div className="bg-white/50 backdrop-blur-sm border-t border-white/20 px-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm text-neutral-600">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                  <span>Lines: {lyrics.split('\n').length}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-creative-400"></span>
                  <span>Words: {getWordCount(lyrics)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warm-400"></span>
                  <span>Characters: {lyrics.length}</span>
                </span>
                {sections.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success-400"></span>
                    <span>Sections: {sections.length}</span>
                  </span>
                )}
              </div>
              {sections.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sections.slice(0, 3).map((section, index) => (
                    <span key={index} className="px-2 py-1 bg-neutral-100/80 text-neutral-700 rounded-md text-xs border border-neutral-200/50">
                      {section.name}
                    </span>
                  ))}
                  {sections.length > 3 && (
                    <span className="px-2 py-1 bg-neutral-100/80 text-neutral-600 rounded-md text-xs border border-neutral-200/50">
                      +{sections.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SongEditor