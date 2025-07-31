import React from 'react'
import { COMMON_SECTIONS } from '../utils/sectionUtils'

interface SectionToolbarProps {
  onInsertSection: (sectionTag: string) => void
  onShowSectionNav: () => void
  onToggleSidebar?: () => void
  hasExistingSections: boolean
  showSidebar?: boolean
  currentSection?: string
}

export const SectionToolbar: React.FC<SectionToolbarProps> = ({
  onInsertSection,
  onShowSectionNav,
  onToggleSidebar,
  hasExistingSections,
  showSidebar = false,
  currentSection
}) => {
  const getSectionIcon = (sectionName: string) => {
    const name = sectionName.toLowerCase()
    if (name.includes('verse')) return '📝'
    if (name.includes('chorus')) return '🎵'
    if (name.includes('bridge')) return '🌉'
    if (name.includes('intro')) return '🎧'
    if (name.includes('outro')) return '🎼'
    if (name.includes('pre-chorus')) return '✨'
    if (name.includes('hook')) return '🎣'
    return '🎶'
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm border-b border-neutral-200/30">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-gradient-creative from-primary-400 to-creative-500"></span>
        <span className="text-sm font-semibold text-neutral-700">Quick Insert:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {COMMON_SECTIONS.slice(0, 6).map((section) => (
          <button
            key={section.name}
            onClick={() => onInsertSection(section.tag)}
            className="group relative overflow-hidden px-3 py-2 text-xs font-medium text-neutral-700 bg-white/80 hover:bg-white border border-neutral-200/50 hover:border-primary-300 rounded-lg hover:shadow-soft transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
            title={`Insert ${section.name} section`}
          >
            <span className="relative z-10 flex items-center space-x-1">
              <span>{getSectionIcon(section.name)}</span>
              <span>{section.name}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-creative from-primary-50/50 to-creative-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      {hasExistingSections && (
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`group relative overflow-hidden px-4 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 backdrop-blur-sm rounded-xl border ${
                showSidebar 
                  ? 'text-primary-800 bg-gradient-creative from-primary-200/80 to-creative-200/80 border-primary-300 shadow-medium'
                  : 'text-primary-700 bg-gradient-creative from-primary-100/80 to-creative-100/80 hover:from-primary-200/80 hover:to-creative-200/80 border-primary-200/50 hover:border-primary-300 hover:shadow-medium'
              }`}
              title={showSidebar ? 'Hide section sidebar' : currentSection ? `Currently in ${currentSection} - Show section sidebar` : 'Show section sidebar'}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className={`transition-transform duration-200 ${
                  showSidebar ? 'rotate-0' : 'group-hover:rotate-12'
                }`}>
                  {showSidebar ? '🗂️' : '📂'}
                </span>
                <span className="flex items-center gap-2">
                  {showSidebar ? (
                    'Hide Sidebar'
                  ) : currentSection ? (
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