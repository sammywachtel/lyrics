import type { ReactNode } from 'react'
import type { PanelState } from '../../hooks/usePanelState'

interface EditorPanelProps {
  panelState: PanelState
  children?: ReactNode
  className?: string
}

export function EditorPanel({ panelState, children, className = '' }: EditorPanelProps) {
  const isVisible = panelState.isMobile 
    ? panelState.activeTab === 'editor'
    : true // Always visible on tablet/desktop
  
  if (!isVisible) return null
  
  const panelClasses = [
    // Base styles
    'bg-white/80 backdrop-blur-md flex flex-col',
    // Responsive width and positioning
    panelState.isMobile 
      ? 'absolute inset-0 z-10'
      : 'flex-1 min-w-0', // flex-1 makes it take remaining space, min-w-0 allows shrinking
    className
  ].join(' ')
  
  return (
    <div className={panelClasses}>
      {/* Editor Header - Optional */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200/50">
        <h2 className="text-lg font-semibold text-neutral-900">Lyrics Editor</h2>
        
        {/* Editor Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-success-500"></span>
            <span>Ready</span>
          </div>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {children || (
          <div className="h-full p-6">
            {/* Placeholder editor content */}
            <div className="h-full bg-white rounded-lg border border-neutral-200 shadow-soft p-6">
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-creative-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Professional WYSIWYG Editor
                    </h3>
                    <p className="text-neutral-600 max-w-md">
                      Your song editor will appear here with real-time prosody analysis, 
                      section tagging, and AI-assisted writing tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}