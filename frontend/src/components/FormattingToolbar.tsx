import React, { useState, useCallback } from 'react'

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onTextChange: (text: string) => void
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  onTextChange
}) => {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  // Get the currently selected text in the textarea
  const getSelectedText = useCallback(() => {
    if (!textareaRef.current) return null
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    return {
      text: selectedText,
      start,
      end,
      hasSelection: start !== end
    }
  }, [textareaRef])

  // Apply formatting to selected text
  const applyFormatting = useCallback((formatType: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef.current) return

    const selection = getSelectedText()
    if (!selection) return

    const textarea = textareaRef.current
    const { text, start, end, hasSelection } = selection

    if (!hasSelection) {
      // If no selection, just insert format markers at cursor
      const formatMap = {
        bold: '**',
        italic: '*',
        underline: '_'
      }
      
      const marker = formatMap[formatType]
      const newText = textarea.value.substring(0, start) + 
                     marker + marker + 
                     textarea.value.substring(start)
      
      onTextChange(newText)
      
      // Position cursor between the markers
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + marker.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
      return
    }

    // Check if text is already formatted
    const beforeText = textarea.value.substring(0, start)
    const afterText = textarea.value.substring(end)
    
    let newText: string
    let newSelectionStart: number
    let newSelectionEnd: number

    switch (formatType) {
      case 'bold':
        if (text.startsWith('**') && text.endsWith('**') && text.length > 4) {
          // Remove bold formatting
          const unformattedText = text.substring(2, text.length - 2)
          newText = beforeText + unformattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + unformattedText.length
        } else {
          // Add bold formatting
          const formattedText = `**${text}**`
          newText = beforeText + formattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + formattedText.length
        }
        break
        
      case 'italic':
        if (text.startsWith('*') && text.endsWith('*') && text.length > 2 && 
            !(text.startsWith('**') && text.endsWith('**'))) {
          // Remove italic formatting
          const unformattedText = text.substring(1, text.length - 1)
          newText = beforeText + unformattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + unformattedText.length
        } else {
          // Add italic formatting
          const formattedText = `*${text}*`
          newText = beforeText + formattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + formattedText.length
        }
        break
        
      case 'underline':
        if (text.startsWith('_') && text.endsWith('_') && text.length > 2) {
          // Remove underline formatting
          const unformattedText = text.substring(1, text.length - 1)
          newText = beforeText + unformattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + unformattedText.length
        } else {
          // Add underline formatting
          const formattedText = `_${text}_`
          newText = beforeText + formattedText + afterText
          newSelectionStart = start
          newSelectionEnd = start + formattedText.length
        }
        break
        
      default:
        return
    }

    onTextChange(newText)
    
    // Restore selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd)
      updateActiveFormats()
    }, 0)
  }, [textareaRef, getSelectedText, onTextChange])

  // Update active formats based on current selection
  const updateActiveFormats = useCallback(() => {
    const selection = getSelectedText()
    if (!selection) return

    const { text } = selection
    const newActiveFormats = new Set<string>()

    // Check for bold
    if (text.startsWith('**') && text.endsWith('**') && text.length > 4) {
      newActiveFormats.add('bold')
    }
    
    // Check for italic (but not bold)
    if (text.startsWith('*') && text.endsWith('*') && text.length > 2 && 
        !(text.startsWith('**') && text.endsWith('**'))) {
      newActiveFormats.add('italic')
    }
    
    // Check for underline
    if (text.startsWith('_') && text.endsWith('_') && text.length > 2) {
      newActiveFormats.add('underline')
    }

    setActiveFormats(newActiveFormats)
  }, [getSelectedText])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          applyFormatting('bold')
          break
        case 'i':
          e.preventDefault()
          applyFormatting('italic')
          break
        case 'u':
          e.preventDefault()
          applyFormatting('underline')
          break
      }
    }
  }, [applyFormatting])

  // Attach keyboard handler to textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyDownEvent = (e: KeyboardEvent) => {
      handleKeyDown(e as any)
    }

    const handleSelectionChange = () => {
      updateActiveFormats()
    }

    textarea.addEventListener('keydown', handleKeyDownEvent)
    textarea.addEventListener('mouseup', handleSelectionChange)
    textarea.addEventListener('keyup', handleSelectionChange)

    return () => {
      textarea.removeEventListener('keydown', handleKeyDownEvent)
      textarea.removeEventListener('mouseup', handleSelectionChange)
      textarea.removeEventListener('keyup', handleSelectionChange)
    }
  }, [textareaRef, handleKeyDown, updateActiveFormats])

  const formatButtons = [
    {
      type: 'bold' as const,
      icon: 'B',
      label: 'Bold (Cmd+B)',
      shortcut: '**text**'
    },
    {
      type: 'italic' as const,
      icon: 'I',
      label: 'Italic (Cmd+I)',
      shortcut: '*text*'
    },
    {
      type: 'underline' as const,
      icon: 'U',
      label: 'Underline (Cmd+U)',
      shortcut: '_text_'
    }
  ]

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm border-b border-neutral-200/30">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-neutral-700 mr-3">Format:</span>
        {formatButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => applyFormatting(button.type)}
            className={`group relative flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border ${
              activeFormats.has(button.type)
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                : 'bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft'
            }`}
            title={button.label}
          >
            <span className={`${button.type === 'italic' ? 'italic' : ''} ${button.type === 'underline' ? 'underline' : ''}`}>
              {button.icon}
            </span>
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-4 text-xs text-neutral-500">
        <div className="hidden sm:flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">**bold**</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">*italic*</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">_underline_</span>
          </span>
        </div>
        <div className="w-px h-4 bg-neutral-300"></div>
        <span className="text-neutral-400">Use Cmd+B/I/U for shortcuts</span>
      </div>
    </div>
  )
}

export default FormattingToolbar