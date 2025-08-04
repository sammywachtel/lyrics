import React from 'react'
import { getAvailableSectionTypes, getSectionType, type SectionType, type SongSection } from '../utils/sectionUtils'

interface SectionToolbarProps {
  onInsertSection: (sectionType: SectionType) => void
  onShowSectionNav: () => void
  onToggleSidebar?: () => void
  hasExistingSections: boolean
  showSidebar?: boolean
  currentSection?: string
  hasSelectedText?: boolean
  sections: SongSection[]
}

export const SectionToolbar: React.FC<SectionToolbarProps> = ({
  onInsertSection,
  onShowSectionNav,
  onToggleSidebar,
  hasExistingSections,
  showSidebar = false,
  currentSection,
  hasSelectedText = false,
  sections
}) => {
  const availableSections = getAvailableSectionTypes(sections)
  const getSectionIcon = (sectionType: SectionType) => {
    switch (sectionType) {
      case 'Verse': return '📝'
      case 'Chorus': return '🎵'
      case 'Pre-Chorus': return '✨'
      case 'Bridge': return '🌉'
      case 'Intro': return '🎧'
      case 'Outro': return '🎼'
      case 'Hook': return '🎣'
      default: return '🎶'
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm border-b border-neutral-200/30">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-gradient-creative from-primary-400 to-creative-500"></span>
        <span className="text-sm font-semibold text-neutral-700">Quick Insert:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableSections.slice(0, 6).map((section) => {
          // Smart auto-numbering display: show number only when multiples exist
          const existingOfType = sections.filter(s => {
            const type = getSectionType(s.name)
            return type === section.type
          }).length
          
          // Determine display name - show numbers intelligently
          let displayName: string = section.type
          if (existingOfType > 0) {
            // For types that can have multiples, show the next number
            if (!['Intro', 'Outro'].includes(section.type)) {
              displayName = `${section.type} ${existingOfType + 1}`
            } else if (existingOfType > 0) {
              // For Intro/Outro, only show number if there's already one
              displayName = `${section.type} ${existingOfType + 1}`
            }
          }
          
          return (
            <button
              key={section.type}
              onClick={() => onInsertSection(section.type)}
              className="group relative overflow-hidden px-3 py-2 text-xs font-medium text-neutral-700 bg-white/80 hover:bg-white border border-neutral-200/50 hover:border-primary-300 rounded-lg hover:shadow-soft transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
              title={hasSelectedText ? `Wrap selected text with ${displayName} section (places tag above selection)` : `Insert ${displayName} section at cursor`}
            >
              <span className="relative z-10 flex items-center space-x-1">
                <span>{getSectionIcon(section.type)}</span>
                <span>{section.description}</span>
                {existingOfType > 0 && !['Intro', 'Outro'].includes(section.type) && (
                  <span className="text-xs opacity-60 font-normal">
                    {existingOfType + 1}
                  </span>
                )}
                {hasSelectedText && (
                  <span className="text-xs opacity-75 ml-1" title="Will place section tag above selected text">↻</span>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-creative from-primary-50/50 to-creative-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          )
        })}
      </div>
      
      <div className="flex-1" />
      
      {hasExistingSections && (
        <div className="flex items-center gap-2">
          {onToggleSidebar && !showSidebar && (
            <button
              onClick={onToggleSidebar}
              className="group relative overflow-hidden px-4 py-2 text-sm font-medium text-primary-700 bg-gradient-creative from-primary-100/80 to-creative-100/80 hover:from-primary-200/80 hover:to-creative-200/80 border-primary-200/50 hover:border-primary-300 hover:shadow-medium transition-all duration-200 transform hover:scale-105 backdrop-blur-sm rounded-xl border"
              title={currentSection ? `Currently in: ${currentSection} - Click to show sidebar` : 'Show section sidebar'}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="group-hover:rotate-12 transition-transform duration-200">📂</span>
                <span className="flex items-center gap-2">
                  {currentSection ? (
                    <>
                      <span className="font-medium text-primary-800">{currentSection}</span>
                      <span className="text-primary-600">•</span>
                      <span>Show Sidebar</span>
                    </>
                  ) : (
                    'Show Sidebar'
                  )}
                </span>
              </span>
              <div className="absolute inset-0 bg-gradient-creative from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          )}
          <button
            onClick={onShowSectionNav}
            className="group relative overflow-hidden px-4 py-2 text-sm font-medium text-primary-700 bg-gradient-creative from-primary-100/80 to-creative-100/80 hover:from-primary-200/80 hover:to-creative-200/80 border border-primary-200/50 hover:border-primary-300 rounded-xl hover:shadow-medium transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
            title="Navigate between sections (modal)"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <span className="group-hover:rotate-12 transition-transform duration-200">📋</span>
              <span>Quick Nav</span>
            </span>
            <div className="absolute inset-0 bg-gradient-creative from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      )}
    </div>
  )
}

export default SectionToolbar