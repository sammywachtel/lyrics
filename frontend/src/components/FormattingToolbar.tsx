import React from 'react'

interface FormattingToolbarProps {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onStrikethrough: () => void
  // Section formatting
  activeSection?: string | null
  onVerse: () => void
  onChorus: () => void
  onPreChorus: () => void
  onBridge: () => void
  onIntro: () => void
  onOutro: () => void
  onHook: () => void
  onClearSection: () => void
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  activeSection,
  onVerse,
  onChorus,
  onPreChorus,
  onBridge,
  onIntro,
  onOutro,
  onHook,
  onClearSection,
}) => {
  const formatButtons = [
    {
      type: 'bold' as const,
      icon: 'B',
      label: 'Bold (Ctrl/Cmd + B)',
      isActive: isBold,
      onClick: onBold
    },
    {
      type: 'italic' as const,
      icon: 'I',
      label: 'Italic (Ctrl/Cmd + I)',
      isActive: isItalic,
      onClick: onItalic
    },
    {
      type: 'underline' as const,
      icon: 'U',
      label: 'Underline (Ctrl/Cmd + U)',
      isActive: isUnderline,
      onClick: onUnderline
    },
    {
      type: 'strikethrough' as const,
      icon: 'S',
      label: 'Strikethrough',
      isActive: isStrikethrough,
      onClick: onStrikethrough
    }
  ]

  const sectionButtons = [
    {
      type: 'verse' as const,
      icon: '📝',
      label: 'Verse',
      isActive: activeSection === 'verse',
      onClick: onVerse,
      tooltip: activeSection === 'verse' ? 'Remove Verse formatting' : 'Mark as Verse (click again to remove)'
    },
    {
      type: 'chorus' as const,
      icon: '🎵',
      label: 'Chorus',
      isActive: activeSection === 'chorus',
      onClick: onChorus,
      tooltip: activeSection === 'chorus' ? 'Remove Chorus formatting' : 'Mark as Chorus (click again to remove)'
    },
    {
      type: 'pre-chorus' as const,
      icon: '✨',
      label: 'Pre-Chorus',
      isActive: activeSection === 'pre-chorus',
      onClick: onPreChorus,
      tooltip: activeSection === 'pre-chorus' ? 'Remove Pre-Chorus formatting' : 'Mark as Pre-Chorus (click again to remove)'
    },
    {
      type: 'bridge' as const,
      icon: '🌉',
      label: 'Bridge',
      isActive: activeSection === 'bridge',
      onClick: onBridge,
      tooltip: activeSection === 'bridge' ? 'Remove Bridge formatting' : 'Mark as Bridge (click again to remove)'
    },
    {
      type: 'intro' as const,
      icon: '🎧',
      label: 'Intro',
      isActive: activeSection === 'intro',
      onClick: onIntro,
      tooltip: activeSection === 'intro' ? 'Remove Intro formatting' : 'Mark as Intro (click again to remove)'
    },
    {
      type: 'outro' as const,
      icon: '🎼',
      label: 'Outro',
      isActive: activeSection === 'outro',
      onClick: onOutro,
      tooltip: activeSection === 'outro' ? 'Remove Outro formatting' : 'Mark as Outro (click again to remove)'
    },
    {
      type: 'hook' as const,  
      icon: '🎣',
      label: 'Hook',
      isActive: activeSection === 'hook',
      onClick: onHook,
      tooltip: activeSection === 'hook' ? 'Remove Hook formatting' : 'Mark as Hook (click again to remove)'
    }
  ]

  // Helper function to get formatted section name
  const getFormattedSectionName = (section: string | null): string => {
    if (!section) return ''
    return section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Generate contextual clear button text and tooltip
  const clearButtonText = activeSection ? `Clear ${getFormattedSectionName(activeSection)}` : 'Clear Section'
  const clearButtonTooltip = activeSection 
    ? `Clear ${getFormattedSectionName(activeSection)} formatting from current line/selection (Ctrl/Cmd + Shift + X)`
    : 'Clear section formatting from current line/selection (Ctrl/Cmd + Shift + X)'

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 px-4 py-2 flex items-center gap-1">
      {/* Text formatting buttons */}
      {formatButtons.map((button) => (
        <button
          key={button.type}
          onClick={button.onClick}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            button.isActive
              ? 'bg-primary-100 text-primary-800 border border-primary-200/50 shadow-soft'
              : 'bg-white/50 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-transparent hover:border-neutral-200/50'
          }`}
          title={button.label}
          type="button"
        >
          <span className={`${
            button.type === 'bold' ? 'font-bold' : 
            button.type === 'italic' ? 'italic' : 
            button.type === 'underline' ? 'underline' :
            button.type === 'strikethrough' ? 'line-through' : ''
          }`}>
            {button.icon}
          </span>
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-6 bg-neutral-200/50 mx-2" />

      {/* Section formatting buttons */}
      {sectionButtons.map((button) => (
        <button
          key={button.type}
          onClick={button.onClick}
          className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
            button.isActive
              ? 'bg-creative-100 text-creative-800 border border-creative-200/50 shadow-soft'
              : 'bg-white/50 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-transparent hover:border-neutral-200/50'
          }`}
          title={button.tooltip}
          type="button"
        >
          <span className="text-xs">{button.icon}</span>
          <span className="text-xs hidden sm:inline">{button.label}</span>
        </button>
      ))}

      {/* Clear Section Button */}
      {activeSection && (
        <>
          <div className="w-px h-6 bg-neutral-200/50 mx-1" />
          <button
            onClick={onClearSection}
            className="px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 bg-red-50/80 text-red-600 hover:text-red-700 hover:bg-red-50 hover:shadow-soft border border-red-200/30 hover:border-red-300/50"
            title={clearButtonTooltip}
            type="button"
          >
            <span className="text-xs">✕</span>
            <span className="text-xs hidden sm:inline truncate max-w-[80px]" title={clearButtonText}>
              {clearButtonText}
            </span>
          </button>
        </>
      )}

      {/* Info Text */}
      <div className="flex-1" />
      <span className="text-xs text-neutral-500">
        {activeSection ? `Section: ${getFormattedSectionName(activeSection)}` : 'Select text to format'}
      </span>
    </div>
  )
}

export default FormattingToolbar