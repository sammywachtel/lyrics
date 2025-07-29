import React from 'react'
import type { SongSection } from '../utils/sectionUtils'

interface SectionNavigationProps {
  sections: SongSection[]
  onJumpToSection: (sectionName: string) => void
  onClose: () => void
  currentSection?: string
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  onJumpToSection,
  onClose,
  currentSection
}) => {
  if (sections.length === 0) {
    return (
      <div className="absolute top-0 right-0 mt-12 mr-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-64">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Sections</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500">
          No sections found. Add section tags like [Verse 1] to your lyrics.
        </p>
      </div>
    )
  }

  return (
    <div className="absolute top-0 right-0 mt-12 mr-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-64 max-h-80 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Sections ({sections.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        {sections.map((section, index) => {
          const isActive = currentSection === section.name
          const lineCount = section.content.split('\n').filter(line => line.trim()).length
          
          return (
            <button
              key={`${section.name}-${index}`}
              onClick={() => {
                onJumpToSection(section.name)
                onClose()
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-500'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-medium">{section.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {lineCount} line{lineCount !== 1 ? 's' : ''} • Line {section.startLine + 1}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Click any section to jump to it in the editor
        </div>
      </div>
    </div>
  )
}

export default SectionNavigation