import React from 'react'
import { parseFormattedText } from '../utils/textFormatting'

interface FormattedTextPreviewProps {
  text: string
  maxLines?: number
  className?: string
}

export const FormattedTextPreview: React.FC<FormattedTextPreviewProps> = ({
  text,
  maxLines = 10,
  className = ''
}) => {
  const lines = text.split('\n')
  const displayLines = maxLines ? lines.slice(0, maxLines) : lines
  const hasMoreLines = lines.length > maxLines

  const renderFormattedLine = (line: string, lineIndex: number) => {
    if (!line.trim()) {
      return <div key={lineIndex} className="h-6">&nbsp;</div>
    }

    const segments = parseFormattedText(line)
    
    return (
      <div key={lineIndex} className="leading-relaxed">
        {segments.map((segment, segmentIndex) => {
          let className = ''
          
          if (segment.bold) className += 'font-bold '
          if (segment.italic) className += 'italic '
          if (segment.underline) className += 'underline '
          
          return (
            <span key={segmentIndex} className={className.trim()}>
              {segment.text}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`font-mono text-sm text-neutral-800 leading-relaxed ${className}`}>
      {displayLines.map((line, index) => renderFormattedLine(line, index))}
      {hasMoreLines && (
        <div className="text-neutral-500 italic text-xs mt-2">
          ... and {lines.length - maxLines} more lines
        </div>
      )}
    </div>
  )
}

export default FormattedTextPreview