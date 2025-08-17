import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Song, SongSettings } from '../lib/api'
import { createDefaultSettings } from '../lib/api'
import { authService } from '../lib/authService'

// API Base URL - same logic as in api.ts
const API_BASE_URL = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  ? 'http://localhost:8001'
  : (typeof window !== 'undefined' && (window as { __VITE_API_URL__?: string }).__VITE_API_URL__) || 'http://localhost:8001'
import SectionNavigation from './SectionNavigation'
import SectionSidebar from './editor/SectionSidebar'
import RichTextLyricsEditor, { type RichTextLyricsEditorRef } from './RichTextLyricsEditor'
import { parseSections, getSectionAtLine, renumberSections, generateSectionTag, wrapTextWithSection, insertSectionAtPosition, type SectionType } from '../utils/sectionUtils'
import { getWordCount } from '../utils/textFormatting'
import { type AutoSaveStatus } from './editor/AutoSaveIndicator'

interface CleanSongEditorProps {
  songId: string
  onSongChange?: (song: Song) => void
  onSongLoaded?: (song: Song) => void
  onSettingsChange?: (settings: SongSettings) => void
  onClose?: () => void
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'error') => void
  onAutoSaveStatusChange?: (status: 'saved' | 'saving' | 'pending' | 'error') => void
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void
}

export interface CleanSongEditorRef {
  triggerSave: () => Promise<void>
}

/**
 * Clean Song Editor following Lexical best practices:
 *
 * 1. ✅ Lexical as single source of truth for editor content
 * 2. ✅ OnChangePlugin pattern with useRef for state capture
 * 3. ✅ Direct API calls without Redux caching interference
 * 4. ✅ No controlled component pattern - no setEditorState during typing
 * 5. ✅ Serialize to JSON only for persistence, not for UI state sync
 */
export const CleanSongEditor = forwardRef<CleanSongEditorRef, CleanSongEditorProps>(
  ({
    songId,
    onSongChange,
    onSongLoaded,
    onSettingsChange,
    onClose,
    onSaveStatusChange,
    onAutoSaveStatusChange,
    onHasUnsavedChangesChange
  }, ref) => {

    // UI-only state (no editor content state)
    const [song, setSong] = useState<Song | null>(null)
    const [settings, setSettings] = useState<SongSettings>(createDefaultSettings())
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [status, setStatus] = useState<Song['status']>('draft')
    const [tags, setTags] = useState<string[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Section navigation state
    const [showSectionNav, setShowSectionNav] = useState(false)
    const [showSectionSidebar, setShowSectionSidebar] = useState(true)
    const [sections, setSections] = useState<ReturnType<typeof parseSections>>([])
    const [currentSection, setCurrentSection] = useState<string>('')
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('saved')
    // const [isProcessingStress, setIsProcessingStress] = useState(false) // TODO: Implement processing state UI

    // Lexical content captured via OnChangePlugin (Lexical best practice)
    const lexicalContentRef = useRef<string>('')  // Stores the latest editor content
    const plainTextRef = useRef<string>('')      // Plain text for word counts and sections
    const wysiwygEditorRef = useRef<RichTextLyricsEditorRef>(null)
    const isMountedRef = useRef(true)
    const handleSaveRef = useRef<(() => Promise<void>) | null>(null)
    const lastAutoSaveRef = useRef<string>('')
    const isInitialized = useRef(false)

    // Debug logging only when needed
    if (typeof window !== 'undefined' && window.location.search.includes('debug=editor')) {
      console.log('🔍 CleanSongEditor render:', {
        hasUnsavedChanges,
        autoSaveStatus,
        isInitialized: isInitialized.current,
        songId
      })
    }

    // Helper function to check if lyrics need stress processing and trigger auto-save
    const checkAndProcessStresses = useCallback(async (lyrics: string) => {
      console.log('🟡 STRESS-CHECK-ENTRY: Function called with lyrics length:', lyrics.length)

      if (!lyrics || !wysiwygEditorRef.current) {
        console.log('🟡 STRESS-CHECK-EXIT: Early return - no lyrics or editor ref')
        return
      }

      try {
        // Check if the lyrics contain Lexical JSON with existing stress nodes
        let needsStressProcessing = false

        if (lyrics.startsWith('{')) {
          // Lexical JSON format - check if it has StressedTextNode instances
          try {
            const lexicalData = JSON.parse(lyrics)
            const hasStressNodes = JSON.stringify(lexicalData).includes('"type":"stressed-text"')
            needsStressProcessing = !hasStressNodes

            console.log('🔍 STRESS CHECK:', {
              lyricsLength: lyrics.length,
              startsWithJSON: lyrics.startsWith('{'),
              hasStressNodes,
              needsStressProcessing,
              firstChars: lyrics.slice(0, 100),
              stressNodeCount: (JSON.stringify(lexicalData).match(/"type":"stressedText"/g) || []).length
            })
          } catch (error) {
            // Invalid JSON, treat as plain text
            needsStressProcessing = true
            console.log('🔍 STRESS CHECK: Invalid JSON, treating as plain text', { error: (error as Error).message })
          }
        } else {
          // Plain text format - always needs stress processing
          needsStressProcessing = true
          console.log('🔍 STRESS CHECK: Plain text format, needs processing')
        }

        if (needsStressProcessing) {
          console.log('⚠️ STRESS PROCESSING: Starting auto-detection because stress nodes are missing')
          // Set processing state (TODO: implement UI state)
          // setIsProcessingStress(true)

          // Wait for the AutoStressDetectionPlugin to process
          setTimeout(async () => {
            try {
              // Trigger auto-save after stress processing
              if (handleSaveRef.current) {
                // Perform post-stress auto-save
                await handleSaveRef.current()
              }
            } catch (error) {
              console.error('❌ STRESS-PROCESS: Auto-save failed:', error)
            } finally {
              // setIsProcessingStress(false)
            }
          }, 800) // Reduced from 3000ms to 800ms for better responsiveness
        } else {
          console.log('✅ STRESS PROCESSING: Skipped - song already has stress patterns')
        }
      } catch (error) {
        console.error('❌ STRESS-CHECK: Error during stress check:', error)
      }
    }, [])

    // Set mounted state
    useEffect(() => {
      isMountedRef.current = true
      return () => {
        isMountedRef.current = false
      }
    }, [])

    // Load song data using direct fetch (no Redux/RTK Query caching) with proper auth headers
    useEffect(() => {
      const loadSong = async () => {
        setIsLoading(true)
        setError(null)

        try {
          // Get auth headers from backend auth service
          const { data: { session } } = await authService.getSession()
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
            headers
          })

          if (!response.ok) {
            if (response.status === 403) {
              // User doesn't have permission to access this song - redirect to song list
              console.warn('🚫 403 Forbidden: User cannot access song', songId)
              if (onClose) {
                setTimeout(() => onClose(), 100) // Redirect back to song list
                return
              }
            }
            throw new Error(`Failed to load song: ${response.statusText}`)
          }

          const songData = await response.json()
          const actualSong = songData.song || songData

          // Debug: Song loaded
          // console.log('📂 Song loaded via direct fetch:', {
          //   id: actualSong.id,
          //   title: actualSong.title,
          //   lyricsLength: actualSong.lyrics?.length || 0,
          //   hasSettings: !!actualSong.settings
          // })

          // Set all metadata state at once
          setSong(actualSong)
          setTitle(actualSong.title || '')
          setArtist(actualSong.artist || '')
          setStatus(actualSong.status || 'draft')
          setTags(actualSong.tags || [])
          setSettings(actualSong.settings || createDefaultSettings())
          setError(null)

          // Initialize Lexical content reference
          lexicalContentRef.current = actualSong.lyrics || ''
          plainTextRef.current = actualSong.lyrics || ''

          // Notify parent of song load immediately
          if (onSongLoaded) {
            setTimeout(() => {
              onSongLoaded(actualSong)
            }, 0)
          }

          // Keep loading state active during full initialization
          setTimeout(() => {
            isInitialized.current = true
            lastAutoSaveRef.current = actualSong.lyrics || ''

            // Post-load processing will be triggered by editor ready event
            // console.log('🔄 LOADING: Song loaded, waiting for editor to be ready...')

            // End loading state after a brief delay (editor ready will handle stress processing)
            setTimeout(() => {
              // console.log('✅ LOADING: Full initialization complete, ending loading state')
              setIsLoading(false)
            }, 1000) // Shorter delay since we're not waiting for stress processing
          }, 1000) // Minimum loading time so user can see the loading state

        } catch (err) {
          console.error('Failed to load song:', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to load song'

          // Handle authentication errors by redirecting to song list
          if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Session expired')) {
            console.warn('🚫 Authentication error: User cannot access song', songId)
            if (onClose) {
              setTimeout(() => onClose(), 100) // Redirect back to song list
              return
            }
          }

          setError(errorMessage)
          setIsLoading(false) // Only end loading on error
        }
      }

      loadSong()
    }, [songId, onClose, onSongLoaded])

    // Set up editor ready listener for stress processing
    useEffect(() => {
      if (!wysiwygEditorRef.current || !song) return

      // console.log('🎯 EDITOR-SETUP: Setting up editor ready listener')

      const unregister = wysiwygEditorRef.current.onEditorReady(async () => {
        // console.log('✅ EDITOR-READY: Editor is ready, starting stress processing check')
        await checkAndProcessStresses(song.lyrics || '')
      })

      return () => {
        // console.log('🧹 EDITOR-CLEANUP: Cleaning up editor ready listener')
        unregister()
      }
    }, [song, checkAndProcessStresses])

    // Track metadata changes (non-content fields)
    useEffect(() => {
      if (!song || !isInitialized.current) return

      const hasMetadataChanges = (
        title !== song.title ||
        artist !== (song.artist || '') ||
        status !== song.status ||
        JSON.stringify(tags) !== JSON.stringify(song.tags) ||
        JSON.stringify(settings) !== JSON.stringify(song.settings)
      )

      if (hasMetadataChanges) {
        console.log('📝 Metadata change detected')
        setHasUnsavedChanges(true)
        setAutoSaveStatus('pending')

        if (onHasUnsavedChangesChange) {
          onHasUnsavedChangesChange(true)
        }
        if (onAutoSaveStatusChange) {
          onAutoSaveStatusChange('pending')
        }
      }
    }, [song, title, artist, status, tags, settings, onHasUnsavedChangesChange, onAutoSaveStatusChange])

    // Save song using direct API call
    const handleSave = useCallback(async () => {
      if (!isMountedRef.current || !song) return

      // Check if there are actual changes
      const hasActualChanges = (
        title !== song.title ||
        artist !== (song.artist || '') ||
        lexicalContentRef.current !== song.lyrics ||
        status !== song.status ||
        JSON.stringify(tags) !== JSON.stringify(song.tags) ||
        JSON.stringify(settings) !== JSON.stringify(song.settings)
      )

      if (!hasActualChanges) {
        if (isMountedRef.current) {
          setTimeout(() => setHasUnsavedChanges(false), 0)
        }
        return
      }

      // Only set isSaving if it's not already true (manual save may have set it)
      if (!isSaving) {
        setIsSaving(true)
      }
      setError(null)
      onSaveStatusChange?.('saving')

      try {
        const updateData = {
          title,
          artist: artist || undefined,
          lyrics: lexicalContentRef.current, // Use captured Lexical content
          status,
          tags,
          settings
        }

        console.log('🚀 Direct API save:', {
          lyricsLength: lexicalContentRef.current.length,
          isLexicalJSON: lexicalContentRef.current.startsWith('{'),
          title,
          artist
        })

        // Get auth headers from backend auth service
        const { data: { session } } = await authService.getSession()
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          throw new Error(`Save failed: ${response.statusText}`)
        }

        const updatedSong = await response.json()

        if (!isMountedRef.current) return

        console.log('📨 Save successful:', {
          responseTitle: updatedSong.title,
          responseArtist: updatedSong.artist,
          lyricsLength: updatedSong.lyrics?.length || 0
        })

        // Update song state with response (but don't update editor content)
        const responseData = updatedSong.song || updatedSong
        setSong(responseData)

        // Update local state to match what was saved
        setTitle(responseData.title || title)
        setArtist(responseData.artist || artist || '')
        setStatus(responseData.status || status)
        setTags(responseData.tags || tags)
        setSettings(responseData.settings || settings)

        setHasUnsavedChanges(false)
        setAutoSaveStatus('saved')

        if (onHasUnsavedChangesChange) {
          onHasUnsavedChangesChange(false)
        }
        if (onAutoSaveStatusChange) {
          onAutoSaveStatusChange('saved')
        }

        setTimeout(() => {
          onSaveStatusChange?.('saved')
          if (onSongChange) {
            onSongChange(responseData)
          }
          if (onSettingsChange) {
            onSettingsChange(responseData.settings)
          }
        }, 0)

      } catch (err) {
        console.error('Save failed:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to save song')
          setAutoSaveStatus('error')
          setTimeout(() => {
            onSaveStatusChange?.('error')
          }, 0)
          if (onAutoSaveStatusChange) {
            onAutoSaveStatusChange('error')
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false)
        }
      }
    }, [song, songId, title, artist, status, tags, settings, onSongChange, onSettingsChange, onSaveStatusChange, onHasUnsavedChangesChange, onAutoSaveStatusChange, isSaving])

    // Update save ref
    useEffect(() => {
      handleSaveRef.current = handleSave
    }, [handleSave])

    // Expose triggerSave
    useImperativeHandle(ref, () => ({
      triggerSave: async () => {
        console.log('🔧 CleanSongEditor: triggerSave called')
        if (handleSaveRef.current) {
          return await handleSaveRef.current()
        }
        return Promise.resolve()
      }
    }), [])

    // Auto-save with Lexical content
    const handleAutoSave = useCallback(async (lexicalContent?: string) => {
      if (!isMountedRef.current || !song || isSaving || !isInitialized.current) {
        return
      }

      const contentToSave = lexicalContent || lexicalContentRef.current

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

        // Update the ref with current content
        if (lexicalContent) {
          lexicalContentRef.current = lexicalContent
        }

        await handleSave()

        if (isMountedRef.current) {
          setAutoSaveStatus('saved')
          setHasUnsavedChanges(false)
          if (onHasUnsavedChangesChange) {
            onHasUnsavedChangesChange(false)
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
        if (isMountedRef.current) {
          setAutoSaveStatus('error')
        }
      }
    }, [song, isSaving, title, artist, status, tags, settings, handleSave, onHasUnsavedChangesChange])

    // Auto-save timer for unsaved changes
    useEffect(() => {
      if (!hasUnsavedChanges || !isInitialized.current || isSaving) {
        return
      }

      const autoSaveTimer = setTimeout(() => {
        if (hasUnsavedChanges && !isSaving && isMountedRef.current) {
          console.log('🕒 Auto-save triggered after 10 seconds')
          handleAutoSave()
        }
      }, 10000) // 10 seconds

      return () => {
        clearTimeout(autoSaveTimer)
      }
    }, [hasUnsavedChanges, handleAutoSave, isSaving])

    // Auto-save status sync - simpler logic to avoid conflicts
    useEffect(() => {
      if (!hasUnsavedChanges && autoSaveStatus !== 'saving' && autoSaveStatus !== 'saved') {
        setAutoSaveStatus('saved')
      }
    }, [hasUnsavedChanges, autoSaveStatus])

    useEffect(() => {
      if (onAutoSaveStatusChange) {
        onAutoSaveStatusChange(autoSaveStatus)
      }
    }, [autoSaveStatus, onAutoSaveStatusChange])

    // Handle plain text changes for UI updates (sections, word count)
    const handlePlainTextChange = useCallback((plainText: string) => {
      // Debug logging only when enabled
      if (typeof window !== 'undefined' && window.location.search.includes('debug=callbacks')) {
        console.log('🔍 CALLBACK: handlePlainTextChange called with:', {
          length: plainText?.length || 0,
          isInitialized: isInitialized.current,
          preview: (plainText || '').substring(0, 30) + '...',
          songLyricsLength: song?.lyrics?.length || 0,
          contentMatches: plainText === song?.lyrics
        })
      }

      if (!isInitialized.current) return

      // Store plain text for word counts and section parsing
      plainTextRef.current = plainText || ''

      // Parse sections from plain text
      const parsedSections = parseSections(plainText || '')
      setSections(parsedSections)

      if (currentSection && !parsedSections.find(s => s.name === currentSection)) {
        setCurrentSection('')
      }

      // Check for changes and update state immediately
      if (song && plainText !== song.lyrics) {
        console.log('🔍 PLAIN TEXT CHANGE DETECTED - updating state:', {
          plainTextLength: plainText.length,
          savedLyricsLength: song.lyrics?.length || 0,
          different: plainText !== song.lyrics
        })

        setHasUnsavedChanges(true)
        setAutoSaveStatus('pending')

        if (onHasUnsavedChangesChange) {
          onHasUnsavedChangesChange(true)
        }
        if (onAutoSaveStatusChange) {
          onAutoSaveStatusChange('pending')
        }
      } else {
        console.log('🔍 PLAIN TEXT - no change detected or no song loaded')
      }
    }, [currentSection, song, onHasUnsavedChangesChange, onAutoSaveStatusChange])

    // Handle Lexical content changes and auto-save
    const handleLexicalContentChange = useCallback(async (lexicalJSON?: string) => {
      // Debug logging only when enabled
      if (typeof window !== 'undefined' && window.location.search.includes('debug=callbacks')) {
        console.log('🔍 CALLBACK: handleLexicalContentChange called with:', {
          length: lexicalJSON?.length || 0,
          isInitialized: isInitialized.current,
          hasSong: !!song,
          isJSON: lexicalJSON?.startsWith('{') || false
        })
      }

      if (!isInitialized.current) {
        return
      }

      // If we get Lexical content, store it
      if (lexicalJSON) {
        // Store lexical content for persistence
        lexicalContentRef.current = lexicalJSON
      }

      // Use current stored content for comparison
      const currentContent = lexicalContentRef.current || plainTextRef.current

      // Immediately check for changes and update state
      if (song && currentContent !== song.lyrics) {
        console.log('🔍 LEXICAL CHANGE DETECTED - updating state')

        setHasUnsavedChanges(true)
        setAutoSaveStatus('pending')

        if (onHasUnsavedChangesChange) {
          onHasUnsavedChangesChange(true)
        }
        if (onAutoSaveStatusChange) {
          onAutoSaveStatusChange('pending')
        }
      } else {
        console.log('🔍 LEXICAL - no change detected')
      }

      return handleAutoSave(currentContent)
    }, [song, handleAutoSave, onHasUnsavedChangesChange, onAutoSaveStatusChange])

    // Section management functions
    const updateCurrentSection = useCallback(() => {
      if (sections.length === 0) {
        if (currentSection !== '') {
          setCurrentSection('')
        }
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        return
      }

      try {
        const editorElement = wysiwygEditorRef.current?.getWysiwygElement()
        if (!editorElement) return

        let currentLineNumber = 0
        const range = selection.getRangeAt(0)

        // Try to find the prosody line element containing the cursor
        let targetNode: Node | null = range.startContainer
        let prosodyLine: HTMLElement | null = null

        while (targetNode && targetNode !== editorElement) {
          if (targetNode instanceof HTMLElement && targetNode.classList.contains('prosody-line')) {
            prosodyLine = targetNode
            break
          }
          if (targetNode instanceof HTMLElement && targetNode.hasAttribute('data-line')) {
            prosodyLine = targetNode
            break
          }
          targetNode = targetNode.parentNode
        }

        if (prosodyLine && prosodyLine.hasAttribute('data-line')) {
          currentLineNumber = parseInt(prosodyLine.getAttribute('data-line') || '0')
        } else {
          // Fallback: calculate line number from text content
          const preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(editorElement)
          preCaretRange.setEnd(range.endContainer, range.endOffset)
          const textBeforeCursor = preCaretRange.toString()
          currentLineNumber = textBeforeCursor.split('\n').length - 1
        }

        const sectionAtCursor = getSectionAtLine(sections, currentLineNumber)
        const newCurrentSection = sectionAtCursor?.name || ''

        if (newCurrentSection !== currentSection) {
          setCurrentSection(newCurrentSection)
        }
      } catch (error) {
        console.debug('Section detection error:', error)
      }
    }, [sections, currentSection])

    // Section manipulation functions
    const handleInsertSection = useCallback((sectionType: SectionType) => {
      const editorRef = wysiwygEditorRef.current
      if (!editorRef) {
        const sectionTag = generateSectionTag(sections, sectionType)
        const newLyrics = plainTextRef.current + (plainTextRef.current ? '\n\n' : '') + sectionTag + '\n'
        const renumbered = renumberSections(newLyrics)
        plainTextRef.current = renumbered
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
          const result = wrapTextWithSection(plainTextRef.current, startPosition, endPosition, sectionTag)
          newLyrics = result.newLyrics
          newCursorPosition = result.newEndPosition
        } else {
          const result = insertSectionAtPosition(plainTextRef.current, cursorPosition || 0, sectionTag)
          newLyrics = result.newLyrics
          newCursorPosition = result.newPosition
        }

        const renumbered = renumberSections(newLyrics)
        plainTextRef.current = renumbered

        setTimeout(() => {
          editorRef.setCursorPosition(newCursorPosition)
          updateCurrentSection()
        }, 0)

      } catch (error) {
        console.error('Error inserting section:', error)
      }
    }, [sections, updateCurrentSection])

    const handleAddSection = useCallback(() => {
      const sectionType: SectionType = sections.length === 0 ? 'Verse' : 'Verse'
      handleInsertSection(sectionType)
    }, [sections, handleInsertSection])

    const handleDeleteSection = useCallback((sectionName: string) => {
      const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const newLyrics = plainTextRef.current.replace(new RegExp(`\\[${escapedName}\\]\\n?`, 'g'), '')
      plainTextRef.current = newLyrics
      updateCurrentSection()
    }, [updateCurrentSection])

    const handleRenameSection = useCallback((oldName: string, newName: string) => {
      if (!newName.trim() || newName === oldName) return

      const existingNames = sections.map(s => s.name.toLowerCase())
      if (existingNames.includes(newName.toLowerCase()) && newName.toLowerCase() !== oldName.toLowerCase()) {
        alert(`A section named '${newName}' already exists. Please choose a different name.`)
        return
      }

      const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const newTag = `[${newName.trim()}]`
      const newLyrics = plainTextRef.current.replace(new RegExp(`\\[${escapedOldName}\\]`, 'g'), newTag)
      plainTextRef.current = newLyrics
      updateCurrentSection()
    }, [sections, updateCurrentSection])

    const handleJumpToSection = useCallback((sectionName: string) => {
      const section = sections.find(s => s.name === sectionName)
      if (!section) {
        console.warn('Section not found:', sectionName)
        return
      }

      const editorRef = wysiwygEditorRef.current
      if (!editorRef) {
        console.warn('Editor not available')
        return
      }

      editorRef.jumpToSection(sectionName)
      setTimeout(updateCurrentSection, 150)
    }, [sections, updateCurrentSection])

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
                <span>Words: {getWordCount(plainTextRef.current)}</span>
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
            <div className="flex-1 relative overflow-hidden">
              <RichTextLyricsEditor
                ref={wysiwygEditorRef}
                value={lexicalContentRef.current}
                onChange={handlePlainTextChange}
                onSelectionChange={updateCurrentSection}
                placeholder="Enter your lyrics here..."
                rows={24}
                enableAutoSave={true}
                autoSaveDelay={10000}
                onAutoSave={handleLexicalContentChange}
                editable={!isLoading}
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
                    <span>Lines: {plainTextRef.current.split('\n').length}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-creative-400"></span>
                    <span>Words: {getWordCount(plainTextRef.current)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warm-400"></span>
                    <span>Characters: {plainTextRef.current.length}</span>
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

        {/* Section Sidebar */}
        {showSectionSidebar && (
          <div className="w-72 flex-shrink-0">
            <SectionSidebar
              sections={sections}
              onJumpToSection={handleJumpToSection}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
              onRenameSection={handleRenameSection}
              onHideSidebar={() => setShowSectionSidebar(false)}
              currentSection={currentSection}
              className="h-full"
            />
          </div>
        )}
      </div>
    )
  }
)

CleanSongEditor.displayName = 'CleanSongEditor'

export default CleanSongEditor
