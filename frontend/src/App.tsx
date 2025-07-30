import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/AuthForm'
import { Header } from './components/Header'
import { SongList } from './components/SongList'
import SongEditor from './components/SongEditor'
import type { Song } from './lib/api'

function AppContent() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list')
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)

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
  }

  const handleCloseSong = () => {
    setSelectedSongId(null)
    setCurrentView('list')
  }

  const handleSongChange = (song: Song) => {
    // Song was updated, could refresh the list or handle state updates
    console.log('Song updated:', song)
  }

  if (currentView === 'editor' && selectedSongId) {
    return (
      <SongEditor
        songId={selectedSongId}
        onSongChange={handleSongChange}
        onClose={handleCloseSong}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-creative-50 to-warm-50">
      <Header />
      <main className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-creative from-primary-300 to-creative-300 opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-gradient-creative from-creative-300 to-warm-300 opacity-25 blur-3xl"></div>
        </div>
        <SongList onEditSong={handleEditSong} />
      </main>
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
