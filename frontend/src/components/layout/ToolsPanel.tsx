import { useState } from 'react'
import type { ReactNode } from 'react'
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { PanelState } from '../../hooks/usePanelState'

interface ToolsPanelProps {
  panelState: PanelState
  children?: ReactNode
  className?: string
}

const TOOL_SECTIONS = [
  {
    id: 'rhyme-workshop',
    title: 'Rhyme Workshop',
    description: 'Find perfect rhymes and word families',
    icon: '🎵'
  },
  {
    id: 'thesaurus',
    title: 'Thesaurus & Concepts',
    description: 'Explore related words and concepts',
    icon: '📚'
  },
  {
    id: 'ai-assistant',
    title: 'AI Writing Assistant',
    description: 'Get suggestions and feedback',
    icon: '🤖'
  },
  {
    id: 'prosody-analysis',
    title: 'Prosody Analysis',
    description: 'Rhythm and flow analysis',
    icon: '📊'
  },
  {
    id: 'section-navigator',
    title: 'Section Navigator',
    description: 'Navigate and organize song sections',
    icon: '🗺️'
  }
]

export function ToolsPanel({ panelState, children, className = '' }: ToolsPanelProps) {
  const [activeToolSection, setActiveToolSection] = useState<string>('rhyme-workshop')
  
  const isVisible = panelState.isMobile 
    ? panelState.activeTab === 'tools'
    : panelState.panels.right
  
  if (!isVisible) return null
  
  const panelClasses = [
    // Base styles
    'bg-white/90 backdrop-blur-md border-l border-neutral-200/50 shadow-soft',
    // Desktop styles
    'lg:relative lg:flex lg:flex-col',
    // Mobile/Tablet styles
    panelState.isMobile 
      ? 'absolute inset-0 z-40 flex flex-col'
      : panelState.isTablet
      ? 'absolute right-0 top-0 bottom-0 z-30 w-96 flex flex-col shadow-strong'
      : 'w-96 flex-shrink-0',
    className
  ].join(' ')
  
  return (
    <>
      {/* Overlay for tablet/mobile */}
      {(panelState.isMobile || panelState.isTablet) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
          onClick={() => panelState.closePanel('right')}
        />
      )}
      
      <div className={panelClasses}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200/50">
          <h2 className="text-lg font-semibold text-neutral-900">Writing Tools</h2>
          
          {/* Close button for mobile/tablet */}
          {!panelState.isDesktop && (
            <button
              onClick={() => panelState.closePanel('right')}
              className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
              aria-label="Close tools panel"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-500" />
            </button>
          )}
        </div>
        
        {/* Tool Section Navigation */}
        <div className="border-b border-neutral-200/50">
          <div className="p-2">
            <nav className="space-y-1">
              {TOOL_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveToolSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                    activeToolSection === section.id
                      ? 'bg-primary-50 text-primary-900 border border-primary-200'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{section.title}</div>
                    <div className="text-xs text-neutral-500 truncate">{section.description}</div>
                  </div>
                  <ChevronRightIcon className={`w-4 h-4 transition-transform ${
                    activeToolSection === section.id ? 'rotate-90' : ''
                  }`} />
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tool Content */}
        <div className="flex-1 overflow-y-auto">
          {children || (
            <div className="p-4">
              {activeToolSection === 'rhyme-workshop' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Find Rhymes</h3>
                    <input
                      type="text"
                      placeholder="Enter a word..."
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-600">
                      Perfect rhymes, slant rhymes, and word families will appear here.
                    </p>
                  </div>
                </div>
              )}
              
              {activeToolSection === 'thesaurus' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Explore Concepts</h3>
                    <input
                      type="text"
                      placeholder="Enter a concept..."
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-600">
                      Related words, synonyms, and concept maps will be displayed here.
                    </p>
                  </div>
                </div>
              )}
              
              {activeToolSection === 'ai-assistant' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-creative-50 rounded-lg border border-primary-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-sm font-medium text-primary-900">AI Assistant</h3>
                    </div>
                    <p className="text-sm text-primary-700">
                      Your AI writing assistant will provide real-time suggestions, 
                      cliché detection, and creative feedback.
                    </p>
                  </div>
                </div>
              )}
              
              {activeToolSection === 'prosody-analysis' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Rhythm Analysis</h3>
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-600">
                        Real-time analysis of meter, stress patterns, and lyrical flow.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeToolSection === 'section-navigator' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Song Structure</h3>
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-600">
                        Navigate between verses, choruses, and other song sections.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Panel Footer */}
        <div className="p-4 border-t border-neutral-200/50 bg-neutral-50/50">
          <p className="text-xs text-neutral-500 text-center">
            Tools are context-aware and update with your writing
          </p>
        </div>
      </div>
    </>
  )
}