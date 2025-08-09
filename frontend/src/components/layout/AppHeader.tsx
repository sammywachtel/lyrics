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
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { PanelState } from '../../hooks/usePanelState'
import type { Song } from '../../lib/api'

interface AppHeaderProps {
  panelState: PanelState
  currentSong?: Song | null
  onSearch?: (query: string) => void
  onViewChange?: (view: string) => void
  saveStatus?: 'saved' | 'saving' | 'error' | 'offline' | undefined
  // Editor mode props
  isEditorMode?: boolean
  onBack?: () => void
  onSongUpdate?: (updates: Partial<Song>) => void
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isSaving?: boolean
  autoSaveStatus?: 'saved' | 'saving' | 'pending' | 'error'
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
  // onViewChange is unused in this component but required by interface
  saveStatus = undefined,
  isEditorMode = false,
  onBack,
  onSongUpdate,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
  autoSaveStatus = 'saved'
}: AppHeaderProps) {

  // Debug logging for header state (only when changes occur)
  if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
    console.log('🎯 AppHeader render:', {
      isEditorMode,
      hasUnsavedChanges,
      isSaving,
      autoSaveStatus,
      saveStatus
    })
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [showSongMeta, setShowSongMeta] = useState(false)
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editStatus, setEditStatus] = useState<Song['status']>('draft')
  const [editTags, setEditTags] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleEditMetadata = () => {
    if (currentSong) {
      setEditTitle(currentSong.title)
      setEditArtist(currentSong.artist || '')
      setEditStatus(currentSong.status)
      setEditTags(currentSong.tags.join(', '))
      setIsEditingMeta(true)
      setShowSongMeta(true)
    }
  }

  const handleSaveMetadata = () => {
    if (onSongUpdate) {
      onSongUpdate({
        title: editTitle,
        artist: editArtist || undefined,
        status: editStatus,
        tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      })
    }
    setIsEditingMeta(false)
    setShowSongMeta(false)
  }

  const handleCancelEdit = () => {
    setIsEditingMeta(false)
    setShowSongMeta(false)
  }

  const saveConfig = saveStatus ? SAVE_STATUS_CONFIG[saveStatus] : null
  const SaveIcon = saveConfig?.icon

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/50 shadow-soft">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section - Back Button, Logo & Navigation */}
        <div className="flex items-center gap-4">
          {/* Back Button (Editor Mode Only) */}
          {isEditorMode && onBack && (
            <button
              onClick={onBack}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 text-neutral-600 hover:text-neutral-800 border border-white/30 hover:border-white/50 shadow-soft hover:shadow-medium backdrop-blur-sm"
              title="Back to Song List"
            >
              <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="font-medium hidden sm:inline">Back</span>
            </button>
          )}

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
              <h1 className="text-lg font-semibold text-neutral-900">Versifai</h1>
              <p className="text-xs text-neutral-500 -mt-1">AI-Assisted Writing</p>
            </div>
          </div>

          {/* Song Metadata (Enhanced for Editor Mode) */}
          {currentSong && isEditorMode && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-200">
              <button
                onClick={() => setShowSongMeta(!showSongMeta)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/60 transition-all duration-200 group backdrop-blur-sm border border-white/30 hover:border-white/50 shadow-soft"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-neutral-900 max-w-48 truncate">
                    {currentSong.title || 'Untitled Song'}
                  </div>
                  <div className="text-xs text-neutral-500 max-w-48 truncate flex items-center gap-2">
                    <span>{currentSong.artist || 'No artist'}</span>
                    <span>•</span>
                    <span className="capitalize">{currentSong.status.replace('_', ' ')}</span>
                    {hasUnsavedChanges && (
                      <>
                        <span>•</span>
                        <span className="text-warm-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-warm-500 animate-pulse"></span>
                          Unsaved
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-400 transition-transform ${showSongMeta ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Song Metadata (Simple for Non-Editor Mode) */}
          {currentSong && !isEditorMode && (
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
          {/* Google Docs Style Save Button (Editor Mode Only) */}
          {isEditorMode && onSave && (
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[120px] ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-white hover:bg-neutral-50 text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 shadow-soft hover:shadow-medium'
                  : isSaving || (autoSaveStatus === 'saving' && hasUnsavedChanges)
                  ? 'bg-white text-neutral-600 border border-neutral-200 shadow-soft cursor-wait'
                  : 'bg-white text-neutral-500 border border-neutral-200 shadow-soft cursor-default'
              }`}
              title={
                isSaving
                  ? 'Saving changes...'
                  : autoSaveStatus === 'saving' && hasUnsavedChanges
                  ? 'Auto-saving...'
                  : hasUnsavedChanges && autoSaveStatus === 'pending'
                  ? 'Click to save now or wait for auto-save'
                  : hasUnsavedChanges
                  ? 'Click to save changes now'
                  : 'All changes saved'
              }
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : autoSaveStatus === 'saving' && hasUnsavedChanges ? (
                  <>
                    <div className="w-3 h-3 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span>Auto-saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  autoSaveStatus === 'pending' ? (
                    <>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span>Save now</span>
                    </>
                  ) : (
                    <>
                      <span className="text-primary-500">💾</span>
                      <span>Save now</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="text-success-500">✓</span>
                    <span>Saved</span>
                  </>
                )}
              </span>
            </button>
          )}

          {/* Save Status (Non-Editor Mode) */}
          {!isEditorMode && saveConfig && SaveIcon && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <SaveIcon className={`w-4 h-4 ${saveConfig.className}`} />
              <span className={saveConfig.className}>{saveConfig.text}</span>
            </div>
          )}

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

      {/* Enhanced Song Metadata Dropdown */}
      {showSongMeta && currentSong && (
        <div className="absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-neutral-200 shadow-lg z-50 md:left-auto md:right-auto md:w-96 md:ml-64 md:rounded-b-xl md:border md:shadow-medium">
          <div className="p-6">
            {isEditingMeta ? (
              /* Editing Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <span>✏️</span>
                    <span>Edit Song Details</span>
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
                    placeholder="Enter song title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Artist</label>
                  <input
                    type="text"
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
                    placeholder="Enter artist name..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Song['status'])}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tags</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
                      placeholder="tag1, tag2..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveMetadata}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <span>🎵</span>
                    <span>Song Details</span>
                  </h3>
                  {isEditorMode && onSongUpdate && (
                    <button
                      onClick={handleEditMetadata}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <PencilIcon className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Title</label>
                  <div className="text-sm text-neutral-900 font-medium">{currentSong.title || 'Untitled Song'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Artist</label>
                  <div className="text-sm text-neutral-900">{currentSong.artist || 'No artist set'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</label>
                  <div className="text-sm text-neutral-900 capitalize">{currentSong.status.replace('_', ' ')}</div>
                </div>
                {currentSong.tags && currentSong.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentSong.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
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
            )}
          </div>
        </div>
      )}
    </header>
  )
}
