import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Song, SongSettings } from '../lib/api'
import { createDefaultSettings, apiClient } from '../lib/api'
import SectionToolbar from './SectionToolbar'
import SectionNavigation from './SectionNavigation'
import RichTextSectionSidebar from './sidebar/RichTextSectionSidebar'
import RichTextLyricsEditor, { type RichTextLyricsEditorRef } from './RichTextLyricsEditor'
import { parseSections, getSectionAtLine, renumberSections, generateSectionTag, wrapTextWithSection, insertSectionAtPosition, type SectionType } from '../utils/sectionUtils'
import { getWordCount } from '../utils/textFormatting'
import { type AutoSaveStatus } from './editor/AutoSaveIndicator'

interface RichTextSongEditorProps {
  songId: string
  onSongChange?: (song: Song) => void
  onSongLoaded?: (song: Song) => void
  onSettingsChange?: (settings: SongSettings) => void
  onClose?: () => void
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'error') => void
  onAutoSaveStatusChange?: (status: 'saved' | 'saving' | 'pending' | 'error') => void
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void
}

export interface RichTextSongEditorRef {
  triggerSave: () => Promise<void>
}

export const RichTextSongEditor = forwardRef<RichTextSongEditorRef, RichTextSongEditorProps>((
  {
    songId,
    onSongChange,
    onSongLoaded,
    onSettingsChange,
    onClose,
    onSaveStatusChange,
    onAutoSaveStatusChange,
    onHasUnsavedChangesChange
  },
  ref
) => {
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
  const [showSectionSidebar, setShowSectionSidebar] = useState(true)
  const [sections, setSections] = useState<ReturnType<typeof parseSections>>([])
  const [currentSection, setCurrentSection] = useState<string>('')
  const [hasSelectedText, setHasSelectedText] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('saved')
  
  // Rich-text specific states
  const [prosodyEnabled, setProsodyEnabled] = useState(false)
  const [rhymeSchemeEnabled, setRhymeSchemeEnabled] = useState(false)
  const [syllableMarkingEnabled, setSyllableMarkingEnabled] = useState(false)
  
  const richTextEditorRef = useRef<RichTextLyricsEditorRef>(null)
  const isMountedRef = useRef(true)
  const handleSaveRef = useRef<(() => Promise<void>) | null>(null)
  const lastAutoSaveRef = useRef<string>('')
  const isInitialized = useRef(false)

  // Set mounted state and clean up on unmount
  useEffect(() => {
    isMountedRef.current = true
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
        
        // Mark as initialized after data is loaded and UI has settled
        setTimeout(() => {
          isInitialized.current = true
          lastAutoSaveRef.current = songData.lyrics
        }, 500)
        
        // Notify parent of song load
        if (onSongLoaded) {
          setTimeout(() => {
            onSongLoaded(songData)
          }, 0)
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

    // Skip change detection during initial load
    if (!isInitialized.current) {
      return
    }

    const hasChanges = (
      title !== song.title ||
      artist !== (song.artist || '') ||
      lyrics !== song.lyrics ||
      status !== song.status ||
      JSON.stringify(tags) !== JSON.stringify(song.tags) ||
      JSON.stringify(settings) !== JSON.stringify(song.settings)
    )

    setHasUnsavedChanges(hasChanges)
    
    // Notify parent component of change status
    if (onHasUnsavedChangesChange) {
      onHasUnsavedChangesChange(hasChanges)
    }
  }, [song, title, artist, lyrics, status, tags, settings, onHasUnsavedChangesChange])

  // Save song
  const handleSave = useCallback(async (lyricsToSave?: string) => {
    if (!isMountedRef.current || !song || isSaving) {
      return
    }

    // Double-check if there are actually changes before saving
    const finalLyrics = lyricsToSave !== undefined ? lyricsToSave : lyrics
    const hasActualChanges = (
      title !== song.title ||
      artist !== (song.artist || '') ||
      finalLyrics !== song.lyrics ||
      status !== song.status ||
      JSON.stringify(tags) !== JSON.stringify(song.tags) ||
      JSON.stringify(settings) !== JSON.stringify(song.settings)
    )

    if (!hasActualChanges) {
      if (isMountedRef.current) {
        setTimeout(() => {
          setHasUnsavedChanges(false)
        }, 0)
      }
      return
    }

    if (!isMountedRef.current) return
    
    setIsSaving(true)
    setError(null)
    onSaveStatusChange?.('saving')

    try {
      const finalLyrics = lyricsToSave !== undefined ? lyricsToSave : lyrics
      
      const updateData = {
        title,
        artist: artist || undefined,
        lyrics: finalLyrics,
        status,
        tags,
        settings
      }

      const response = await apiClient.updateSong(songId, updateData)
      
      if (!isMountedRef.current) return
      
      const updatedSong = response.song!
      
      setSong(updatedSong)
      setTimeout(() => {
        setHasUnsavedChanges(false)
        if (onHasUnsavedChangesChange) {
          onHasUnsavedChangesChange(false)
        }
      }, 0)
      
      setTimeout(() => {
        onSaveStatusChange?.('saved')
        if (onSongChange) {
          onSongChange(updatedSong)
        }
        if (onSettingsChange) {
          onSettingsChange(updatedSong.settings)
        }
      }, 0)
    } catch (err) {
      console.error('Failed to save song:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save song')
        setTimeout(() => {
          onSaveStatusChange?.('error')
        }, 0)
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [song, songId, title, artist, lyrics, status, tags, settings, onSongChange, onSettingsChange, onSaveStatusChange, onHasUnsavedChangesChange, isSaving])

  // Update the ref whenever handleSave changes
  useEffect(() => {
    handleSaveRef.current = handleSave
  }, [handleSave])

  // Expose triggerSave method via ref
  useImperativeHandle(ref, () => ({
    triggerSave: async () => {
      if (handleSaveRef.current) {
        return await handleSaveRef.current()
      }
      return Promise.resolve()
    }
  }), [])

  // Enhanced auto-save with status tracking
  const handleAutoSave = useCallback(async (currentContent?: string) => {
    if (!isMountedRef.current || !song || isSaving || !isInitialized.current) {
      return
    }
    
    const contentToSave = currentContent || lyrics
    
    const hasActualChanges = (
      title !== song.title ||
      artist !== (song.artist || '') ||
      contentToSave !== song.lyrics ||
      status !== song.status ||
      JSON.stringify(tags) !== JSON.stringify(song.tags) ||
      JSON.stringify(settings) !== JSON.stringify(song.settings)
    )

    if (!hasActualChanges || contentToSave === lastAutoSaveRef.current) {
      setAutoSaveStatus('saved')
      return
    }

    try {
      setAutoSaveStatus('saving')
      lastAutoSaveRef.current = contentToSave
      
      if (currentContent && currentContent !== lyrics) {
        setLyrics(currentContent)
      }
      
      await handleSave(contentToSave)
      
      if (isMountedRef.current) {
        setAutoSaveStatus('saved')
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      if (isMountedRef.current) {
        setAutoSaveStatus('error')
      }
    }
  }, [song, isSaving, title, artist, lyrics, status, tags, settings, handleSave])
  
  // Update auto-save status when changes occur
  useEffect(() => {
    if (hasUnsavedChanges && autoSaveStatus === 'saved') {
      setAutoSaveStatus('pending')
    }
  }, [hasUnsavedChanges, autoSaveStatus])

  // Sync auto-save status with parent component
  useEffect(() => {
    if (onAutoSaveStatusChange) {
      onAutoSaveStatusChange(autoSaveStatus)
    }
  }, [autoSaveStatus, onAutoSaveStatusChange])

  // Parse sections whenever lyrics change
  useEffect(() => {
    const parsedSections = parseSections(lyrics)
    setSections(parsedSections)
    
    // Reset current section if it no longer exists
    if (currentSection && !parsedSections.find(s => s.name === currentSection)) {
      setCurrentSection('')
    }
  }, [lyrics, currentSection])

  // Update current section and selection state based on cursor position
  const updateCurrentSection = useCallback(() => {
    // Check if text is selected
    const editorRef = richTextEditorRef.current
    if (editorRef) {
      const selectedText = editorRef.getSelectedText()
      setHasSelectedText(selectedText.length > 0)
    }
    
    if (sections.length === 0) {
      if (currentSection !== '') {
        setCurrentSection('')
      }
      return
    }

    // For rich-text editor, we'll need to implement section detection differently
    // This is a simplified version - in reality, you'd track cursor position in the rich editor
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return
    }
    
    try {
      const editorElement = richTextEditorRef.current?.getWysiwygElement()
      if (!editorElement) return

      // Simplified section detection for rich-text editor
      // In a full implementation, you'd traverse the Lexical editor state
      const currentLineNumber = 0
      
      // Find which section contains this line
      const sectionAtCursor = getSectionAtLine(sections, currentLineNumber)
      const newCurrentSection = sectionAtCursor?.name || ''
      
      if (newCurrentSection !== currentSection) {
        setCurrentSection(newCurrentSection)
      }
    } catch (error) {
      console.debug('Section detection error:', error)
    }
  }, [sections, currentSection])

  // Handle lyrics change
  const handleLyricsChange = useCallback((newLyrics: string) => {
    if (newLyrics === lyrics) {
      return
    }
    
    setLyrics(newLyrics)
    
    const timer = setTimeout(updateCurrentSection, 100)
    return () => clearTimeout(timer)
  }, [lyrics, updateCurrentSection])

  // Insert section tag
  const handleInsertSection = useCallback((sectionType: SectionType) => {
    const editorRef = richTextEditorRef.current
    if (!editorRef) {
      const sectionTag = generateSectionTag(sections, sectionType)
      const newLyrics = lyrics + (lyrics ? '\n\n' : '') + sectionTag + '\n'
      const renumbered = renumberSections(newLyrics)
      setLyrics(renumbered)
      updateCurrentSection()
      return
    }

    try {
      const cursorPosition = editorRef.getCurrentCursorPosition()
      const selectedText = editorRef.getSelectedText()
      const sectionTag = generateSectionTag(sections, sectionType)
      
      let newLyrics: string
      let newCursorPosition: number = cursorPosition || 0
      
      if (selectedText && selectedText.trim()) {
        const startPosition = cursorPosition || 0
        const endPosition = startPosition + selectedText.length
        
        const result = wrapTextWithSection(lyrics, startPosition, endPosition, sectionTag)
        newLyrics = result.newLyrics
        newCursorPosition = result.newEndPosition
      } else {
        const result = insertSectionAtPosition(lyrics, cursorPosition || 0, sectionTag)
        newLyrics = result.newLyrics
        newCursorPosition = result.newPosition
      }
      
      const renumbered = renumberSections(newLyrics)
      setLyrics(renumbered)
      
      setTimeout(() => {
        editorRef.setCursorPosition(newCursorPosition)
        updateCurrentSection()
      }, 0)
      
    } catch (error) {
      console.error('Error inserting section:', error)
      const sectionTag = generateSectionTag(sections, sectionType)
      const newLyrics = lyrics + (lyrics ? '\n\n' : '') + sectionTag + '\n'
      const renumbered = renumberSections(newLyrics)
      setLyrics(renumbered)
      updateCurrentSection()
    }
  }, [lyrics, sections, updateCurrentSection])

  // Add new section
  const handleAddSection = useCallback(() => {
    const sectionType: SectionType = sections.length === 0 ? 'Verse' : 'Verse'
    handleInsertSection(sectionType)
  }, [sections, handleInsertSection])

  // Delete a section
  const handleDeleteSection = useCallback((sectionName: string) => {
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newLyrics = lyrics.replace(new RegExp(`\\[${escapedName}\\]\\n?`, 'g'), '')
    setLyrics(newLyrics)
    updateCurrentSection()
  }, [lyrics, updateCurrentSection])

  // Rename a section
  const handleRenameSection = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return
    
    const existingNames = sections.map(s => s.name.toLowerCase())
    if (existingNames.includes(newName.toLowerCase()) && newName.toLowerCase() !== oldName.toLowerCase()) {
      alert(`A section named '${newName}' already exists. Please choose a different name.`)
      return
    }
    
    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newTag = `[${newName.trim()}]`
    
    const newLyrics = lyrics.replace(new RegExp(`\\[${escapedOldName}\\]`, 'g'), newTag)
    setLyrics(newLyrics)
    updateCurrentSection()
  }, [lyrics, sections, updateCurrentSection])

  // Jump to a specific section
  const handleJumpToSection = useCallback((sectionName: string) => {
    const section = sections.find(s => s.name === sectionName)
    if (!section) {
      console.warn('Section not found:', sectionName)
      return
    }
    
    const editorElement = richTextEditorRef.current?.getWysiwygElement()
    if (!editorElement) {
      console.warn('Editor element not found')
      return
    }
    
    try {
      editorElement.focus()
      
      // For rich-text editor, we'd need to implement proper section jumping
      // This is a simplified version
      setTimeout(updateCurrentSection, 150)
    } catch (error) {
      console.error('Error jumping to section:', error)
      if (editorElement instanceof HTMLElement) {
        editorElement.focus()
      }
    }
  }, [sections, updateCurrentSection])

  // Rich-text specific handlers
  const handleToggleProsody = useCallback(() => {
    setProsodyEnabled(!prosodyEnabled)
    const editorRef = richTextEditorRef.current
    if (editorRef) {
      editorRef.toggleProsodyAnalysis()
    }
  }, [prosodyEnabled])

  const handleToggleRhymeScheme = useCallback(() => {
    setRhymeSchemeEnabled(!rhymeSchemeEnabled)
    const editorRef = richTextEditorRef.current
    if (editorRef) {
      editorRef.toggleRhymeScheme()
    }
  }, [rhymeSchemeEnabled])

  const handleToggleSyllableMarking = useCallback(() => {
    setSyllableMarkingEnabled(!syllableMarkingEnabled)
    const editorRef = richTextEditorRef.current
    if (editorRef) {
      editorRef.toggleSyllableMarking()
    }
  }, [syllableMarkingEnabled])

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
    <div className="h-full flex relative overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Editor Top Bar */}
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

        {/* Editor Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section Toolbar */}
          <div className="bg-white/50 backdrop-blur-sm border-b border-white/20">
            <SectionToolbar
              onInsertSection={handleInsertSection}
              onShowSectionNav={() => setShowSectionNav(!showSectionNav)}
              onToggleSidebar={() => setShowSectionSidebar(!showSectionSidebar)}
              hasExistingSections={sections.length > 0}
              showSidebar={showSectionSidebar}
              currentSection={currentSection}
              hasSelectedText={hasSelectedText}
              sections={sections}
            />
          </div>
          
          {/* Rich-Text Lyrics Editor */}
          <div className="flex-1 relative overflow-hidden">
            <RichTextLyricsEditor
              ref={richTextEditorRef}
              value={lyrics}
              onChange={handleLyricsChange}
              onSelectionChange={updateCurrentSection}
              placeholder="Enter your lyrics here..."
              rows={24}
              enableAutoSave={true}
              autoSaveDelay={10000}
              onAutoSave={handleAutoSave}
              enableProsodyAnalysis={prosodyEnabled}
              enableSyllableMarking={syllableMarkingEnabled}
              enableRhymeScheme={rhymeSchemeEnabled}
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
        </div>
      </div>
      
      {/* Rich-Text Section Sidebar */}
      {showSectionSidebar && (
        <div className="w-72 flex-shrink-0">
          <RichTextSectionSidebar
            sections={sections}
            onJumpToSection={handleJumpToSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onRenameSection={handleRenameSection}
            onHideSidebar={() => setShowSectionSidebar(false)}
            currentSection={currentSection}
            className="h-full"
            prosodyEnabled={prosodyEnabled}
            rhymeSchemeEnabled={rhymeSchemeEnabled}
            syllableMarkingEnabled={syllableMarkingEnabled}
            onToggleProsody={handleToggleProsody}
            onToggleRhymeScheme={handleToggleRhymeScheme}
            onToggleSyllableMarking={handleToggleSyllableMarking}
          />
        </div>
      )}
    </div>
  )
})

RichTextSongEditor.displayName = 'RichTextSongEditor'

export default RichTextSongEditor