import type { ReactNode } from 'react'
import { usePanelState } from '../../hooks/usePanelState'
import { AppHeader } from './AppHeader'
import { SettingsPanel } from './SettingsPanel'
import { EditorPanel } from './EditorPanel'
import { ToolsPanel } from './ToolsPanel'
import type { Song, SongSettings } from '../../lib/api'

interface AppLayoutProps {
  children?: ReactNode
  currentSong?: Song | null
  saveStatus?: 'saved' | 'saving' | 'error' | 'offline' | undefined
  onSearch?: (query: string) => void
  onViewChange?: (view: string) => void

  // Settings integration
  settings?: SongSettings
  onSettingsChange?: (settings: SongSettings) => void

  // Editor mode props
  isEditorMode?: boolean
  onBack?: () => void
  onSongUpdate?: (updates: Partial<Song>) => void
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isSaving?: boolean
  autoSaveStatus?: 'saved' | 'saving' | 'pending' | 'error'

  // Panel content slots
  settingsContent?: ReactNode
  editorContent?: ReactNode
  toolsContent?: ReactNode
}

export function AppLayout({
  children,
  currentSong,
  saveStatus = undefined,
  onSearch,
  onViewChange,
  settings,
  onSettingsChange,
  isEditorMode = false,
  onBack,
  onSongUpdate,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
  autoSaveStatus = 'saved',
  settingsContent,
  editorContent,
  toolsContent
}: AppLayoutProps) {
  const panelState = usePanelState()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-primary-50 via-creative-50 to-warm-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-creative from-primary-300 to-creative-300 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-gradient-creative from-creative-300 to-warm-300 opacity-25 blur-3xl"></div>
      </div>

      {/* Header */}
      <AppHeader
        panelState={panelState}
        currentSong={currentSong}
        saveStatus={saveStatus}
        onSearch={onSearch}
        onViewChange={onViewChange}
        isEditorMode={isEditorMode}
        onBack={onBack}
        onSongUpdate={onSongUpdate}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        isSaving={isSaving}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Settings Panel (Left) */}
        <SettingsPanel
          panelState={panelState}
          settings={settings}
          onSettingsChange={onSettingsChange}
        >
          {settingsContent}
        </SettingsPanel>

        {/* Editor Panel (Center) */}
        <EditorPanel panelState={panelState}>
          {editorContent || children}
        </EditorPanel>

        {/* Tools Panel (Right) */}
        <ToolsPanel panelState={panelState}>
          {toolsContent}
        </ToolsPanel>
      </div>

      {/* Status Footer - Hidden on mobile */}
      <footer className="hidden sm:block h-8 bg-white/60 backdrop-blur-md border-t border-neutral-200/50">
        <div className="h-full px-4 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span>Ready</span>
            {currentSong && (
              <>
                <span>•</span>
                <span>{currentSong.title || 'Untitled Song'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>
              {panelState.viewportSize === 'desktop' && 'Desktop'}
              {panelState.viewportSize === 'tablet' && 'Tablet'}
              {panelState.viewportSize === 'mobile' && 'Mobile'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
