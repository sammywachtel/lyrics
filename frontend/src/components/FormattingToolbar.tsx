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

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 px-4 py-2 flex items-center gap-1">
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

      {/* Info Text */}
      <span className="text-xs text-neutral-500 ml-2">
        Select text to format
      </span>
    </div>
  )
}

export default FormattingToolbar