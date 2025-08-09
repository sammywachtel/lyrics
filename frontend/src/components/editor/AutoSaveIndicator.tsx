import React from 'react'

export type AutoSaveStatus = 'saved' | 'saving' | 'error' | 'pending'

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus
  className?: string
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saved':
        return {
          icon: '✓',
          text: 'Saved',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300',
          pulseAnimation: '',
        }
      case 'saving':
        return {
          icon: '⌛',
          text: 'Saving...',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-300',
          pulseAnimation: 'animate-pulse',
        }
      case 'error':
        return {
          icon: '⚠️',
          text: 'Error',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
          pulseAnimation: '',
        }
      case 'pending':
        return {
          icon: '⏳',
          text: 'Changes pending',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300',
          pulseAnimation: 'animate-pulse',
        }
      default:
        return {
          icon: '💾',
          text: 'Unknown',
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-700',
          borderColor: 'border-neutral-300',
          pulseAnimation: '',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        border backdrop-blur-sm transition-all duration-300
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.pulseAnimation}
        ${className}
      `}
      title={`Auto-save status: ${config.text}`}
    >
      <span className="text-sm">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  )
}

export default AutoSaveIndicator
