import React, { useState } from 'react'
import type { SongSection } from '../../utils/sectionUtils'

interface SectionSidebarProps {
  sections: SongSection[]
  onJumpToSection: (sectionName: string) => void
  onAddSection?: () => void
  onDeleteSection?: (sectionName: string) => void
  onRenameSection?: (oldName: string, newName: string) => void
  onReorderSections?: (sections: SongSection[]) => void
  onHideSidebar?: () => void
  currentSection?: string
  className?: string
}

const getSectionIcon = (sectionName: string): string => {
  const lowerName = sectionName.toLowerCase()
  if (lowerName.includes('verse')) return '📝'
  if (lowerName.includes('chorus') || lowerName.includes('hook')) return '🎵'
  if (lowerName.includes('bridge')) return '🌉'
  if (lowerName.includes('pre') || lowerName.includes('prechorus')) return '🔄'
  if (lowerName.includes('intro')) return '🎬'
  if (lowerName.includes('outro') || lowerName.includes('end')) return '🎭'
  if (lowerName.includes('breakdown') || lowerName.includes('break')) return '⚡'
  return '🎼'
}

const getSectionColor = (sectionName: string): string => {
  const lowerName = sectionName.toLowerCase()
  if (lowerName.includes('verse')) return 'from-blue-100 to-blue-200 text-blue-800 border-blue-400 shadow-blue-100'
  if (lowerName.includes('chorus') || lowerName.includes('hook')) return 'from-green-100 to-green-200 text-green-800 border-green-400 shadow-green-100'
  if (lowerName.includes('bridge')) return 'from-amber-100 to-amber-200 text-amber-800 border-amber-400 shadow-amber-100'
  if (lowerName.includes('pre') || lowerName.includes('prechorus')) return 'from-purple-100 to-purple-200 text-purple-800 border-purple-400 shadow-purple-100'
  if (lowerName.includes('intro')) return 'from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-400 shadow-cyan-100'
  if (lowerName.includes('outro') || lowerName.includes('end')) return 'from-rose-100 to-rose-200 text-rose-800 border-rose-400 shadow-rose-100'
  if (lowerName.includes('breakdown') || lowerName.includes('break')) return 'from-orange-100 to-orange-200 text-orange-800 border-orange-400 shadow-orange-100'
  return 'from-neutral-100 to-neutral-200 text-neutral-800 border-neutral-400 shadow-neutral-100'
}

export const SectionSidebar: React.FC<SectionSidebarProps> = ({
  sections,
  onJumpToSection,
  onAddSection,
  onDeleteSection,
  onRenameSection,
  // onReorderSections, // Future feature - section reordering
  onHideSidebar,
  currentSection,
  className = ''
}) => {
  const [renamingSection, setRenamingSection] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  if (sections.length === 0) {
    return (
      <div className={`bg-white/60 backdrop-blur-sm border-l border-white/30 p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎼</div>
          <p className="text-sm text-neutral-600 mb-2 font-medium">No Sections Yet</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Add section tags like <br />
            <code className="bg-neutral-100 px-1 rounded text-xs">[Verse 1]</code> or <br />
            <code className="bg-neutral-100 px-1 rounded text-xs">[Chorus]</code> <br />
            to organize your lyrics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/60 backdrop-blur-sm border-l border-white/30 ${className}`}>
      {/* Header with Add Button and Hide Button */}
      <div className="p-4 border-b border-white/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <span>🗂️</span>
            <span>Sections ({sections.length})</span>
          </h3>
          {onHideSidebar && (
            <button
              onClick={onHideSidebar}
              className="group p-1.5 rounded text-xs text-neutral-500 hover:text-neutral-700 hover:bg-white/60 transition-all duration-200"
              title="Hide sidebar"
            >
              ×
            </button>
          )}
        </div>
        {onAddSection && (
          <button
            onClick={onAddSection}
            className="group w-full p-2 rounded-lg text-xs font-medium text-primary-700 bg-gradient-creative from-primary-100/80 to-creative-100/80 hover:from-primary-200/80 hover:to-creative-200/80 border border-primary-200/50 hover:border-primary-300 hover:shadow-soft transition-all duration-200 transform hover:scale-105"
            title="Add new section at bottom"
          >
            <span className="flex items-center justify-center gap-1">
              <span className="group-hover:rotate-90 transition-transform duration-200">+</span>
              <span>Add Section</span>
            </span>
          </button>
        )}
      </div>
      
      {/* Section List */}
      <div className="overflow-y-auto flex-1">
        <div className="p-2 space-y-1">
          {sections.map((section, index) => {
            const isActive = currentSection === section.name
            const lineCount = section.content.split('\n').filter(line => line.trim()).length
            const icon = getSectionIcon(section.name)
            const colorClasses = getSectionColor(section.name)
            
            return (
              <div
                key={`${section.name}-${index}`}
                className={`group relative w-full p-3 rounded-lg text-sm transition-all duration-200 border backdrop-blur-sm ${
                  isActive
                    ? `bg-gradient-to-r ${colorClasses} shadow-lg scale-105 border-l-4 ring-2 ring-white/50`
                    : `hover:bg-white/80 text-neutral-700 border-neutral-200/50 hover:border-neutral-300 hover:shadow-soft bg-white/40 hover:scale-102`
                }`}
              >
                {/* Main section content - button or inline edit */}
                {renamingSection === section.name ? (
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (newSectionName.trim() && newSectionName !== section.name) {
                              onRenameSection?.(section.name, newSectionName.trim())
                            }
                            setRenamingSection(null)
                            setNewSectionName('')
                          } else if (e.key === 'Escape') {
                            setRenamingSection(null)
                            setNewSectionName('')
                          }
                        }}
                        onBlur={() => {
                          if (newSectionName.trim() && newSectionName !== section.name) {
                            onRenameSection?.(section.name, newSectionName.trim())
                          }
                          setRenamingSection(null)
                          setNewSectionName('')
                        }}
                        className="flex-1 px-2 py-1 text-sm font-medium bg-white border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className={`text-xs ${isActive ? 'opacity-80' : 'text-neutral-500'} flex items-center gap-2`}>
                      <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Line {section.startLine + 1}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // Jump to section
                      onJumpToSection(section.name)
                    }}
                    className="w-full text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <span className={`font-medium truncate ${isActive ? '' : 'text-neutral-800'}`}>
                        {section.name}
                      </span>
                    </div>
                    <div className={`text-xs ${isActive ? 'opacity-80' : 'text-neutral-500'} flex items-center gap-2`}>
                      <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Line {section.startLine + 1}</span>
                    </div>
                  </button>
                )}
                
                {/* Action buttons - show on hover or when renaming */}
                <div className={`absolute top-2 right-2 transition-opacity duration-200 flex gap-1 ${
                  renamingSection === section.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {onRenameSection && (
                    <>                    
                      {renamingSection === section.name ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (newSectionName.trim() && newSectionName !== section.name) {
                                onRenameSection(section.name, newSectionName.trim())
                              }
                              setRenamingSection(null)
                              setNewSectionName('')
                            }}
                            className="p-1 rounded text-xs bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 transition-all"
                            title="Save rename"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenamingSection(null)
                              setNewSectionName('')
                            }}
                            className="p-1 rounded text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-300 transition-all"
                            title="Cancel rename"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenamingSection(section.name)
                            setNewSectionName(section.name)
                          }}
                          className="p-1 rounded text-xs bg-white/80 hover:bg-white text-neutral-600 hover:text-primary-600 border border-neutral-200/50 hover:border-primary-300 transition-all"
                          title="Rename section"
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                  {onDeleteSection && renamingSection !== section.name && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Delete section "${section.name}"?\n\nThis will remove the section header but keep the lyrics content.`)) {
                          onDeleteSection(section.name)
                        }
                      }}
                      className="p-1 rounded text-xs bg-white/80 hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-200/50 hover:border-red-300 transition-all"
                      title="Delete section"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Color Legend and Instructions */}
      <div className="p-4 border-t border-white/30">
        <div className="text-xs text-neutral-500 space-y-2">
          <div className="font-medium text-neutral-600 mb-2">Color Guide:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Verse</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Chorus</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>Pre-Chorus</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              <span>Bridge</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
              <span>Intro</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
              <span>Outro</span>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-2 mt-3">
            <div className="font-medium text-neutral-600 mb-1">Quick Actions:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                <span>Click to jump • Hover to edit</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                <span>Current section highlighted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SectionSidebar