import React, { useRef, useEffect, useCallback, useState } from 'react'

interface SimpleWysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: () => void
  placeholder?: string
  className?: string
  rows?: number
}

export const SimpleWysiwygEditor: React.FC<SimpleWysiwygEditorProps> = ({
  value,
  onChange,
  onSelectionChange,
  placeholder = 'Start typing...',
  className = '',
  rows = 24
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wysiwygRef = useRef<HTMLDivElement>(null)
  const [isSourceMode, setIsSourceMode] = useState(false)

  // Convert markdown to HTML for display
  const convertToHtml = useCallback((text: string) => {
    if (!text) return ''
    
    // First escape HTML characters to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    
    // Then convert markdown to HTML (bold first, then italic to avoid conflicts)
    html = html
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/_([^_\n]+)_/g, '<u>$1</u>')
      .replace(/\n/g, '<br>')
    
    return html
  }, [])

  // Convert HTML back to markdown
  const convertToMarkdown = useCallback((html: string) => {
    if (!html) return ''
    
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      .replace(/<[^>]*>/g, '') // Remove any other HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }, [])

  // Update WYSIWYG content when value changes
  useEffect(() => {
    if (!isSourceMode && wysiwygRef.current) {
      const htmlContent = convertToHtml(value)
      wysiwygRef.current.innerHTML = htmlContent
    }
  }, [value, isSourceMode, convertToHtml])

  // Handle WYSIWYG changes
  const handleWysiwygChange = useCallback(() => {
    if (wysiwygRef.current) {
      const html = wysiwygRef.current.innerHTML
      const markdown = convertToMarkdown(html)
      onChange(markdown)
    }
    if (onSelectionChange) {
      onSelectionChange()
    }
  }, [onChange, onSelectionChange, convertToMarkdown])

  // Handle source mode changes  
  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Toggle between modes
  const toggleMode = useCallback(() => {
    setIsSourceMode(!isSourceMode)
  }, [isSourceMode])

  // Format functions
  const formatBold = useCallback(() => {
    if (isSourceMode) return
    document.execCommand('bold', false)
    handleWysiwygChange()
  }, [isSourceMode, handleWysiwygChange])

  const formatItalic = useCallback(() => {
    if (isSourceMode) return
    document.execCommand('italic', false)
    handleWysiwygChange()
  }, [isSourceMode, handleWysiwygChange])

  const formatUnderline = useCallback(() => {
    if (isSourceMode) return
    document.execCommand('underline', false)
    handleWysiwygChange()
  }, [isSourceMode, handleWysiwygChange])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isSourceMode) return
    
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatBold()
          break
        case 'i':
          e.preventDefault()
          formatItalic()
          break
        case 'u':
          e.preventDefault()
          formatUnderline()
          break
      }
    }
  }, [isSourceMode, formatBold, formatItalic, formatUnderline])

  const minHeight = `${rows * 1.5}rem`

  return (
    <div className="relative h-full flex flex-col">
      {/* Custom styles for better formatting visibility */}
      <style>{`
        .wysiwyg-editor strong {
          font-weight: 900 !important;
          color: #1f2937 !important;
          /* Add a subtle text-shadow to make bold more visible in monospace fonts */
          text-shadow: 0.5px 0 0 currentColor !important;
        }
        .wysiwyg-editor em {
          font-style: italic !important;
          color: #374151 !important;
        }
        .wysiwyg-editor u {
          text-decoration: underline !important;
          text-underline-offset: 2px !important;
        }
        /* Override any inherited font-weight from parent elements */
        .wysiwyg-editor * {
          font-family: inherit;
        }
      `}</style>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm border-b border-neutral-200/30">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-700 mr-3">
            {isSourceMode ? 'Source:' : 'Format:'}
          </span>
          
          {!isSourceMode && (
            <>
              <button
                onClick={formatBold}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft"
                title="Bold (Cmd+B)"
              >
                B
              </button>
              <button
                onClick={formatItalic}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border italic bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft"
                title="Italic (Cmd+I)"
              >
                I
              </button>
              <button
                onClick={formatUnderline}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border underline bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft"
                title="Underline (Cmd+U)"
              >
                U
              </button>
            </>
          )}
        </div>

        <button
          onClick={toggleMode}
          className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white/80 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-neutral-200/50 hover:border-neutral-300"
        >
          {isSourceMode ? (
            <span className="flex items-center space-x-2">
              <span>👁️</span>
              <span>WYSIWYG</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>💻</span>
              <span>Source</span>
            </span>
          )}
        </button>
      </div>

      {/* Editor - Flex grow to fill available space */}
      <div className="flex-1 overflow-y-auto">
        {isSourceMode ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleSourceChange}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            className={`w-full h-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent placeholder:text-neutral-400 leading-relaxed ${className}`}
            style={{ minHeight }}
            placeholder={`${placeholder}

[Verse 1]
**Start** with your lyrics...

[Chorus]
*This* is where the _chorus_ goes...

Use **bold**, *italic*, and _underline_ for formatting!`}
          />
        ) : (
          <div
            ref={wysiwygRef}
            contentEditable
            onInput={handleWysiwygChange}
            onKeyDown={handleKeyDown}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            className={`wysiwyg-editor w-full h-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent leading-relaxed overflow-y-auto ${className}`}
            style={{ 
              minHeight,
              // Ensure formatting is visible
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace'
            }}
            suppressContentEditableWarning={true}
          />
        )}
      </div>
      
      {/* Debug info */}
      <div className="px-6 py-2 text-xs text-neutral-500 bg-neutral-50/50 border-t border-neutral-200/30">
        Mode: {isSourceMode ? 'Source' : 'WYSIWYG'} | Content length: {value?.length || 0}
      </div>
    </div>
  )
}

export default SimpleWysiwygEditor