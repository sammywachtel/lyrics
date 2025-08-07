// import { SectionTagNode } from '../nodes/SectionTagNode'

/**
 * Demo component showing how visual section headers should appear
 * This demonstrates the design system for section headers in Rich mode
 */
export default function SectionHeaderDemo() {
  const sectionTypes = [
    { name: 'VERSE 1', type: 'verse' },
    { name: 'CHORUS', type: 'chorus' },
    { name: 'VERSE 2', type: 'verse' },
    { name: 'PRE-CHORUS', type: 'pre-chorus' },
    { name: 'CHORUS', type: 'chorus' },
    { name: 'BRIDGE', type: 'bridge' },
    { name: 'CHORUS', type: 'chorus' },
    { name: 'OUTRO', type: 'outro' },
  ]

  return (
    <div className="section-header-demo p-8 bg-white rounded-lg border border-neutral-200">
      <h2 className="text-xl font-bold mb-6 text-neutral-800">Section Headers Visual Design</h2>
      <p className="text-sm text-neutral-600 mb-8">
        These visual headers automatically appear above section-formatted content in Rich mode,
        making it immediately clear which section you're editing.
      </p>
      
      <div className="space-y-4">
        {sectionTypes.map((section, index) => (
          <div key={index} className="demo-section">
            {/* Visual Section Header */}
            <div className="section-tag-node" data-section={section.name}>
              {/* Section Border */}
              <div className="section-border" aria-label={`Section: ${section.name}`}></div>
              
              {/* Section Label */}
              <div className="flex items-center justify-between group mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="section-tag-label">
                    <span className="text-base">
                      {section.type.includes('verse') ? '📝' :
                       section.type.includes('chorus') ? '🎵' :
                       section.type.includes('pre-chorus') ? '✨' :
                       section.type.includes('bridge') ? '🌉' :
                       section.type.includes('outro') ? '🎼' :
                       '🎶'}
                    </span>
                    <span>{section.name}</span>
                  </div>
                  <div className="section-decorative-line"></div>
                </div>
              </div>
            </div>
            
            {/* Example Section Content */}
            <div className={`lexical-text-${section.type} px-3 py-2 font-mono text-sm`}>
              {section.type === 'verse' && 'Walking down this empty street at night'}
              {section.type === 'chorus' && 'This is where we shine, this is our time'}
              {section.type === 'pre-chorus' && 'Building up the moment, here we go'}
              {section.type === 'bridge' && 'In the quiet moments, truth unfolds'}
              {section.type === 'outro' && 'Fading into silence, memories remain'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-neutral-50 rounded border text-sm text-neutral-600">
        <h3 className="font-semibold text-neutral-800 mb-2">How It Works:</h3>
        <ul className="space-y-1 text-xs">
          <li>• Headers automatically appear when you apply section formatting</li>
          <li>• Each section type gets its own color scheme and icon</li>
          <li>• Verses and choruses are automatically numbered</li>
          <li>• Headers are only visible in Rich mode, hidden in source mode</li>
          <li>• Click headers to edit section names</li>
        </ul>
      </div>
    </div>
  )
}
