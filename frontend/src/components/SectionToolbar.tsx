import React from 'react'
import { COMMON_SECTIONS } from '../utils/sectionUtils'

interface SectionToolbarProps {
  onInsertSection: (sectionTag: string) => void
  onShowSectionNav: () => void
  hasExistingSections: boolean
}

export const SectionToolbar: React.FC<SectionToolbarProps> = ({
  onInsertSection,
  onShowSectionNav,
  hasExistingSections
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
      <span className="text-xs font-medium text-gray-600 mr-2">Quick Insert:</span>
      
      {COMMON_SECTIONS.slice(0, 6).map((section) => (
        <button
          key={section.name}
          onClick={() => onInsertSection(section.tag)}
          className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 transition-colors"
          title={`Insert ${section.name} section`}
        >
          {section.name}
        </button>
      ))}
      
      <div className="flex-1" />
      
      {hasExistingSections && (
        <button
          onClick={onShowSectionNav}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          title="Navigate between sections"
        >
          📋 Sections
        </button>
      )}
    </div>
  )
}

export default SectionToolbar