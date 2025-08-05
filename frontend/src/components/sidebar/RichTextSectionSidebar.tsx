import React, { useState, useCallback } from 'react'
import { type SongSection } from '../../utils/sectionUtils'

interface RichTextSectionSidebarProps {
  sections: SongSection[]
  onJumpToSection: (sectionName: string) => void
  onAddSection: () => void
  onDeleteSection: (sectionName: string) => void
  onRenameSection: (oldName: string, newName: string) => void
  onHideSidebar: () => void
  currentSection?: string
  className?: string
  prosodyEnabled?: boolean
  rhymeSchemeEnabled?: boolean
  syllableMarkingEnabled?: boolean
  onToggleProsody?: () => void
  onToggleRhymeScheme?: () => void
  onToggleSyllableMarking?: () => void
}

interface SectionStatsProps {
  section: SongSection
  isActive: boolean
}

const SectionStats: React.FC<SectionStatsProps> = ({ section, isActive }) => {
  const lines = section.content.split('\n').filter(line => line.trim()).length
  const words = section.content.split(/\s+/).filter(word => word.trim()).length
  const chars = section.content.length

  return (
    <div className={`mt-2 grid grid-cols-3 gap-2 text-xs transition-all duration-200 ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
        <span className="text-neutral-600">{lines}L</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-creative-400"></span>
        <span className="text-neutral-600">{words}W</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-warm-400"></span>
        <span className="text-neutral-600">{chars}C</span>
      </div>
    </div>
  )
}

const RichTextSectionSidebar: React.FC<RichTextSectionSidebarProps> = ({
  sections,
  onJumpToSection,
  onAddSection,
  onDeleteSection,
  onRenameSection,
  onHideSidebar,
  currentSection,
  className = '',
  prosodyEnabled = false,
  rhymeSchemeEnabled = false,
  syllableMarkingEnabled = false,
  onToggleProsody,
  onToggleRhymeScheme,
  onToggleSyllableMarking
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)

  // Get section icon based on type
  const getSectionIcon = (sectionName: string) => {
    const name = sectionName.toLowerCase()
    if (name.includes('verse')) return '📝'
    if (name.includes('chorus') && !name.includes('pre')) return '🎵'
    if (name.includes('pre-chorus') || name.includes('prechorus')) return '✨'
    if (name.includes('bridge')) return '🌉'
    if (name.includes('intro')) return '🎧'
    if (name.includes('outro')) return '🎼'
    if (name.includes('hook')) return '🎣'
    return '🎶'
  }

  const handleStartEdit = (sectionName: string) => {
    setEditingSection(sectionName)
    setEditValue(sectionName)
  }

  const handleSaveEdit = () => {
    if (editingSection && editValue.trim() && editValue.trim() !== editingSection) {
      onRenameSection(editingSection, editValue.trim())
    }
    setEditingSection(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className={`rich-text-section-sidebar bg-white/90 backdrop-blur-md border-l border-white/30 shadow-strong flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gradient-to-r from-primary-50/80 to-creative-50/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-creative from-primary-400 to-creative-500"></span>
            <h2 className="text-lg font-bold text-neutral-800">Sections</h2>
          </div>
          <button
            onClick={onHideSidebar}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-white/50 rounded-lg transition-all duration-200"
            title="Hide sidebar"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
          {currentSection && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
              {currentSection}
            </span>
          )}
        </div>
      </div>

      {/* Advanced Features Toggle */}
      <div className="flex-shrink-0 p-3 border-b border-white/20 bg-gradient-to-r from-neutral-50/80 to-white/60">
        <button
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="w-full flex items-center justify-between p-2 text-sm font-medium text-neutral-700 hover:bg-white/60 rounded-lg transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Analysis Tools</span>
          </span>
          <span className={`transition-transform duration-200 ${showAdvancedFeatures ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>
        
        {showAdvancedFeatures && (
          <div className="mt-3 space-y-2">
            <button
              onClick={onToggleSyllableMarking}
              className={`w-full flex items-center justify-between p-2 text-sm rounded-lg transition-all duration-200 ${
                syllableMarkingEnabled
                  ? 'bg-warm-100 text-warm-800 border border-warm-200'
                  : 'bg-white/60 text-neutral-700 hover:bg-white border border-neutral-200/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>○●○</span>
                <span>Syllables</span>
              </span>
              <span className={`text-xs ${syllableMarkingEnabled ? 'text-warm-600' : 'text-neutral-500'}`}>
                {syllableMarkingEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
            
            <button
              onClick={onToggleProsody}
              className={`w-full flex items-center justify-between p-2 text-sm rounded-lg transition-all duration-200 ${
                prosodyEnabled
                  ? 'bg-primary-100 text-primary-800 border border-primary-200'
                  : 'bg-white/60 text-neutral-700 hover:bg-white border border-neutral-200/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🎵</span>
                <span>Prosody</span>
              </span>
              <span className={`text-xs ${prosodyEnabled ? 'text-primary-600' : 'text-neutral-500'}`}>
                {prosodyEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
            
            <button
              onClick={onToggleRhymeScheme}
              className={`w-full flex items-center justify-between p-2 text-sm rounded-lg transition-all duration-200 ${
                rhymeSchemeEnabled
                  ? 'bg-creative-100 text-creative-800 border border-creative-200'
                  : 'bg-white/60 text-neutral-700 hover:bg-white border border-neutral-200/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🎤</span>
                <span>Rhymes</span>
              </span>
              <span className={`text-xs ${rhymeSchemeEnabled ? 'text-creative-600' : 'text-neutral-500'}`}>
                {rhymeSchemeEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {sections.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No sections yet</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Add section tags like [Verse 1] or [Chorus] to organize your lyrics
            </p>
            <button
              onClick={onAddSection}
              className="px-4 py-2 bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white font-medium rounded-lg shadow-medium hover:shadow-strong transition-all duration-200 transform hover:scale-105"
            >
              Add First Section
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sections.map((section, index) => {
              const isActive = currentSection === section.name
              const isEditing = editingSection === section.name
              
              return (
                <div
                  key={section.name}
                  className={`section-item group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-100 to-creative-100 border-primary-300 shadow-soft'
                      : 'bg-white/60 border-neutral-200/50 hover:bg-white hover:border-primary-200 hover:shadow-soft'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg flex-shrink-0">{getSectionIcon(section.name)}</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              className="flex-1 text-sm font-semibold bg-transparent border-none outline-none text-neutral-800"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => onJumpToSection(section.name)}
                              className="flex-1 text-left text-sm font-semibold text-neutral-800 hover:text-primary-700 transition-colors truncate"
                              title={`Jump to ${section.name}`}
                            >
                              {section.name}
                            </button>
                          )}
                        </div>
                        
                        <SectionStats section={section} isActive={isActive} />
                      </div>
                      
                      {/* Section Actions */}
                      <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={() => handleStartEdit(section.name)}
                          className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-all duration-200"
                          title="Rename section"
                        >
                          <span className="text-xs">✏️</span>
                        </button>
                        <button
                          onClick={() => onDeleteSection(section.name)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                          title="Delete section"
                        >
                          <span className="text-xs">🗑️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active section indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-creative from-primary-50/50 to-creative-50/50 opacity-50 pointer-events-none"></div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-4 border-t border-white/20 bg-gradient-to-r from-neutral-50/80 to-white/60">
        <button
          onClick={onAddSection}
          className="w-full group relative overflow-hidden px-4 py-3 bg-gradient-creative from-primary-500 to-creative-600 hover:from-primary-600 hover:to-creative-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-200 transform hover:scale-105"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="group-hover:rotate-90 transition-transform duration-200">+</span>
            <span>Add Section</span>
          </span>
          <div className="absolute inset-0 bg-gradient-creative from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>
    </div>
  )
}

export default RichTextSectionSidebar