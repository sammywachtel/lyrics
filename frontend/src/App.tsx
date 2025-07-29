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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
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
