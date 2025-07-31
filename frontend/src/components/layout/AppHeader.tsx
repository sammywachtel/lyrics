import { useState } from 'react'
import { 
  Bars3Icon, 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PencilIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import type { PanelState } from '../../hooks/usePanelState'
import type { Song } from '../../lib/api'

interface AppHeaderProps {
  panelState: PanelState
  currentSong?: Song | null
  onSearch?: (query: string) => void
  onViewChange?: (view: string) => void
  saveStatus?: 'saved' | 'saving' | 'error' | 'offline'
}

const SAVE_STATUS_CONFIG = {
  saved: {
    icon: CheckCircleIcon,
    text: 'All changes saved',
    className: 'text-success-600'
  },
  saving: {
    icon: CloudIcon,
    text: 'Saving...',
    className: 'text-primary-600 animate-pulse'
  },
  error: {
    icon: ExclamationTriangleIcon,
    text: 'Error saving',
    className: 'text-red-600'
  },
  offline: {
    icon: ExclamationTriangleIcon,
    text: 'Offline - changes saved locally',
    className: 'text-warm-600'
  }
}

export function AppHeader({ 
  panelState, 
  currentSong, 
  onSearch, 
  onViewChange: _onViewChange,
  saveStatus = 'saved'
}: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSongMeta, setShowSongMeta] = useState(false)
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }
  
  const saveConfig = SAVE_STATUS_CONFIG[saveStatus]
  const SaveIcon = saveConfig.icon
  
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/50 shadow-soft">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section - Logo & Navigation */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {panelState.isMobile && (
            <button
              onClick={() => setShowSongMeta(!showSongMeta)}
              className="p-2 rounded-md hover:bg-neutral-100 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="w-5 h-5 text-neutral-700" />
            </button>
          )}
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-creative-500 flex items-center justify-center">
              <PencilIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-neutral-900">Songcraft</h1>
              <p className="text-xs text-neutral-500 -mt-1">AI-Assisted Writing</p>
            </div>
          </div>
          
          {/* Song Metadata */}
          {currentSong && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-200">
              <button
                onClick={() => setShowSongMeta(!showSongMeta)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors group"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-neutral-900 max-w-48 truncate">
                    {currentSong.title || 'Untitled Song'}
                  </div>
                  <div className="text-xs text-neutral-500 max-w-48 truncate">
                    {currentSong.artist || 'No artist'} • {new Date(currentSong.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-400 transition-transform ${showSongMeta ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
        
        {/* Center Section - Search */}
        <div className="hidden sm:flex items-center flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search songs, lyrics, or sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/60 backdrop-blur-sm"
              />
            </div>
          </form>
        </div>
        
        {/* Right Section - View Controls & Status */}
        <div className="flex items-center gap-4">
          {/* Save Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <SaveIcon className={`w-4 h-4 ${saveConfig.className}`} />
            <span className={saveConfig.className}>{saveConfig.text}</span>
          </div>
          
          {/* View Toggle Buttons - Tablet/Desktop */}
          {!panelState.isMobile && (
            <div className="flex items-center bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => panelState.switchToTab('settings')}
                className={`p-2 rounded-md transition-colors ${
                  panelState.activeTab === 'settings' || panelState.panels.left
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Settings Panel"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => panelState.switchToTab('editor')}
                className={`p-2 rounded-md transition-colors ${
                  panelState.activeTab === 'editor'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Editor"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => panelState.switchToTab('tools')}
                className={`p-2 rounded-md transition-colors ${
                  panelState.activeTab === 'tools' || panelState.panels.right
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Tools Panel"
              >
                <WrenchScrewdriverIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Panel Toggle Buttons - Tablet Only */}
          {panelState.isTablet && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => panelState.togglePanel('left')}
                className={`p-2 rounded-md transition-colors ${
                  panelState.panels.left
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                title="Toggle Settings Panel"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => panelState.togglePanel('right')}
                className={`p-2 rounded-md transition-colors ${
                  panelState.panels.right
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                title="Toggle Tools Panel"
              >
                <WrenchScrewdriverIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      {panelState.isMobile && (
        <div className="px-4 pb-3 border-b border-neutral-200/50 sm:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/60 backdrop-blur-sm"
              />
            </div>
          </form>
        </div>
      )}
      
      {/* Mobile Tab Navigation */}
      {panelState.isMobile && (
        <div className="flex items-center bg-white border-b border-neutral-200/50">
          <button
            onClick={() => panelState.switchToTab('settings')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${
              panelState.activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-600'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => panelState.switchToTab('editor')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${
              panelState.activeTab === 'editor'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-600'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => panelState.switchToTab('tools')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${
              panelState.activeTab === 'tools'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-600'
            }`}
          >
            Tools
          </button>
        </div>
      )}
      
      {/* Song Metadata Dropdown */}
      {showSongMeta && currentSong && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-neutral-200 shadow-lg z-50 md:left-auto md:right-auto md:w-96 md:ml-64 md:rounded-b-lg md:border md:shadow-medium">
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Title</label>
                <div className="text-sm text-neutral-900">{currentSong.title || 'Untitled Song'}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Artist</label>
                <div className="text-sm text-neutral-900">{currentSong.artist || 'No artist set'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Created</label>
                  <div className="text-sm text-neutral-900">{new Date(currentSong.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Modified</label>
                  <div className="text-sm text-neutral-900">{new Date(currentSong.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}