import { useState, useCallback, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/AuthForm'
import { AppLayout } from './components/layout/AppLayout'
import { SongList } from './components/SongList'
import SongEditor from './components/SongEditor'
import type { Song, SongSettings } from './lib/api'

function AppContent() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list')
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline' | undefined>(undefined)
  const [settings, setSettings] = useState<SongSettings | undefined>(undefined)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'pending' | 'error'>('saved')
  const songEditorRef = useRef<{ triggerSave: () => Promise<void> } | null>(null)

  // Define all callbacks before conditional returns to maintain hooks order
  const handleSongChange = useCallback((song: Song) => {
    // Song was updated, could refresh the list or handle state updates
    console.log('Song changed in App:', song.id, song.title)
    setCurrentSong(song)
    setSettings(song.settings)
    setSaveStatus('saved')
    setHasUnsavedChanges(false)
  }, [])

  const handleSongUpdate = useCallback((updates: Partial<Song>) => {
    console.log('🔄 App.handleSongUpdate called with:', updates)
    if (currentSong) {
      const updatedSong = { ...currentSong, ...updates }
      setCurrentSong(updatedSong)
      // Only set saving status if this is an actual change, not initial load
      if (saveStatus !== undefined) {
        setSaveStatus('saving')
      }
      setHasUnsavedChanges(true)
      console.log('📝 App: setHasUnsavedChanges(true)')
      // Note: The actual API call should be handled by the SongEditor component
    }
  }, [currentSong, saveStatus])

  const handleSaveStatusChange = useCallback((status: 'saved' | 'saving' | 'error') => {
    console.log('💾 App.handleSaveStatusChange:', status)
    setSaveStatus(status)
    setIsSaving(status === 'saving')
    setHasUnsavedChanges(status !== 'saved')
    console.log('📝 App: setHasUnsavedChanges(' + (status !== 'saved') + ')')
  }, [])

  const handleSettingsChange = useCallback((newSettings: SongSettings) => {
    setSettings(newSettings)
    setSaveStatus('saving')
    // The SongEditor will handle the actual saving
  }, [])

  const handleSave = useCallback(async () => {
    console.log('🔧 App.handleSave called, songEditorRef:', !!songEditorRef.current)
    if (songEditorRef.current?.triggerSave) {
      try {
        await songEditorRef.current.triggerSave()
        console.log('✅ Save completed')
      } catch (error) {
        console.error('💥 Error calling triggerSave:', error)
      }
    } else {
      console.error('⚠️ songEditorRef.triggerSave is not available')
    }
  }, [])

  const handleAutoSaveStatusChange = useCallback((status: 'saved' | 'saving' | 'pending' | 'error') => {
    console.log('🔄 App.handleAutoSaveStatusChange:', status)
    setAutoSaveStatus(status)
  }, [])

  const handleHasUnsavedChangesChange = useCallback((hasChanges: boolean) => {
    console.log('🔄 App.handleHasUnsavedChangesChange:', hasChanges)
    setHasUnsavedChanges(hasChanges)
  }, [])

  const handleSongLoaded = useCallback((song: Song) => {
    // Initial song load - only set state, don't trigger saves
    console.log('Song loaded in App:', song.id, song.title)
    setCurrentSong(song)
    setSettings(song.settings)
    setSaveStatus(undefined) // Don't show 'saved' until first change
    setHasUnsavedChanges(false)
  }, [])

  const handleSearch = useCallback((query: string) => {
    console.log('Search query:', query)
    // TODO: Implement search functionality
  }, [])

  const handleViewChange = useCallback((view: string) => {
    console.log('View changed:', view)
    // TODO: Handle view changes
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-creative-50 to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-creative from-primary-500 to-creative-500 opacity-20 blur-xl"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-neutral-700 animate-pulse-soft">Loading your creative space...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthForm mode={authMode} onModeChange={setAuthMode} />
    )
  }

  const handleEditSong = (songId: string) => {
    setSelectedSongId(songId)
    setCurrentView('editor')
    // Reset settings when switching songs
    setSettings(undefined)
  }

  const handleCloseSong = () => {
    setSelectedSongId(null)
    setCurrentView('list')
    // Reset editor state
    setHasUnsavedChanges(false)
    setIsSaving(false)
    songEditorRef.current = null
    setSaveStatus(undefined)
    setAutoSaveStatus('saved')
  }

  // If editing a song, show it in the professional layout
  if (currentView === 'editor' && selectedSongId) {
    return (
      <AppLayout
        currentSong={currentSong}
        saveStatus={saveStatus}
        onSearch={handleSearch}
        onViewChange={handleViewChange}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        // Enhanced header props for editor mode
        isEditorMode={true}
        onBack={handleCloseSong}
        onSongUpdate={handleSongUpdate}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        isSaving={isSaving}
        autoSaveStatus={autoSaveStatus}
        editorContent={(
          <SongEditor
            songId={selectedSongId}
            onSongChange={handleSongChange}
            onSongLoaded={handleSongLoaded}
            onSettingsChange={handleSettingsChange}
            onClose={handleCloseSong}
            onSaveStatusChange={handleSaveStatusChange}
            ref={songEditorRef}
            onAutoSaveStatusChange={handleAutoSaveStatusChange}
            onHasUnsavedChangesChange={handleHasUnsavedChangesChange}
          />
        )}
      />
    )
  }

  // Show song list with its own simple layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-creative-50 to-warm-50">
      <SongList onEditSong={handleEditSong} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
