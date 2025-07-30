import React, { useRef, useEffect, useCallback, useState } from 'react'
import { formatTextToHtml } from '../utils/textFormatting'

interface WysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: () => void
  placeholder?: string
  className?: string
  rows?: number
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  onSelectionChange,
  placeholder = 'Start typing...',
  className = '',
  rows = 24
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [sourceText, setSourceText] = useState(value || '')
  const lastValueRef = useRef(value || '')
  
  // Debug logging
  console.log('WysiwygEditor render:', { value, sourceText, isSourceMode })

  // Convert markdown to HTML for WYSIWYG display
  const convertToHtml = useCallback((markdown: string) => {
    if (!markdown) return ''
    
    console.log('Converting to HTML:', markdown)
    const html = formatTextToHtml(markdown)
    const result = html.replace(/\n/g, '<br>')
    console.log('HTML result:', result)
    return result
  }, [])

  // Convert HTML back to markdown
  const convertToMarkdown = useCallback((html: string) => {
    if (!html) return ''
    
    let markdown = html
      // Convert <br> tags back to line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Convert HTML tags to markdown
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      // Remove any other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    
    return markdown
  }, [])

  // Initialize source text with the initial value
  useEffect(() => {
    if (sourceText !== value) {
      setSourceText(value)
    }
  }, [value])

  // Update editor content when value changes externally
  useEffect(() => {
    if (value !== lastValueRef.current) {
      if (isSourceMode) {
        setSourceText(value)
      } else if (editorRef.current) {
        const htmlContent = convertToHtml(value)
        editorRef.current.innerHTML = htmlContent
      }
      lastValueRef.current = value
    }
  }, [value, isSourceMode, convertToHtml])

  // Initialize WYSIWYG content on mount and when ref changes
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      const htmlContent = convertToHtml(value)
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent
      }
    }
  }, [editorRef.current, convertToHtml, isSourceMode, value])

  // Handle content changes in WYSIWYG mode
  const handleWysiwygChange = useCallback(() => {
    if (!editorRef.current) return
    
    const html = editorRef.current.innerHTML
    const markdown = convertToMarkdown(html)
    
    if (markdown !== lastValueRef.current) {
      lastValueRef.current = markdown
      onChange(markdown)
    }
    
    if (onSelectionChange) {
      onSelectionChange()
    }
  }, [convertToMarkdown, onChange, onSelectionChange])

  // Handle content changes in source mode
  const handleSourceChange = useCallback((newValue: string) => {
    setSourceText(newValue)
    lastValueRef.current = newValue
    onChange(newValue)
  }, [onChange])

  // Toggle between WYSIWYG and source mode
  const toggleMode = useCallback(() => {
    if (isSourceMode) {
      // Switching from source to WYSIWYG
      const htmlContent = convertToHtml(sourceText)
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent
      }
      onChange(sourceText)
    } else {
      // Switching from WYSIWYG to source
      if (editorRef.current) {
        const markdown = convertToMarkdown(editorRef.current.innerHTML)
        setSourceText(markdown)
        onChange(markdown)
      }
    }
    setIsSourceMode(!isSourceMode)
  }, [isSourceMode, sourceText, convertToHtml, convertToMarkdown, onChange])

  // Format selected text
  const formatSelection = useCallback((command: string, value?: string) => {
    if (isSourceMode || !editorRef.current) return
    
    document.execCommand(command, false, value)
    handleWysiwygChange()
    editorRef.current.focus()
  }, [isSourceMode, handleWysiwygChange])

  // Format buttons
  const formatBold = useCallback(() => formatSelection('bold'), [formatSelection])
  const formatItalic = useCallback(() => formatSelection('italic'), [formatSelection])
  const formatUnderline = useCallback(() => formatSelection('underline'), [formatSelection])

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

  // Check if current selection has specific formatting
  const hasFormat = useCallback((command: string) => {
    if (isSourceMode) return false
    try {
      return document.queryCommandState(command)
    } catch {
      return false
    }
  }, [isSourceMode])

  const minHeight = `${rows * 1.5}rem`

  return (
    <div className="relative">
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
                className={`group relative flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  hasFormat('bold')
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                    : 'bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft'
                }`}
                title="Bold (Cmd+B)"
              >
                B
              </button>
              <button
                onClick={formatItalic}
                className={`group relative flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border italic ${
                  hasFormat('italic')
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                    : 'bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft'
                }`}
                title="Italic (Cmd+I)"
              >
                I
              </button>
              <button
                onClick={formatUnderline}
                className={`group relative flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border underline ${
                  hasFormat('underline')
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                    : 'bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft'
                }`}
                title="Underline (Cmd+U)"
              >
                U
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMode}
            className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white/80 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-neutral-200/50 hover:border-neutral-300"
            title={isSourceMode ? 'Switch to WYSIWYG mode' : 'Switch to source mode'}
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
          
          {!isSourceMode && (
            <div className="hidden sm:flex items-center space-x-3 text-xs text-neutral-500">
              <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">**bold**</span>
              <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">*italic*</span>
              <span className="px-2 py-1 bg-neutral-100 rounded-md font-mono">_underline_</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        {isSourceMode ? (
          <textarea
            value={sourceText}
            onChange={(e) => handleSourceChange(e.target.value)}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            className={`w-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent placeholder:text-neutral-400 leading-relaxed ${className}`}
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
            ref={editorRef}
            contentEditable
            onInput={handleWysiwygChange}
            onKeyDown={handleKeyDown}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            className={`w-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent leading-relaxed ${className}`}
            style={{ minHeight }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
        
        {/* Placeholder for WYSIWYG mode */}
        {!isSourceMode && !value && (
          <div 
            className="absolute inset-0 px-6 py-6 text-lyrics font-mono text-neutral-400 leading-relaxed pointer-events-none"
            style={{ minHeight }}
          >
            {placeholder}
            <br /><br />
            [Verse 1]<br />
            <strong>Start</strong> with your lyrics...<br /><br />
            [Chorus]<br />
            <em>This</em> is where the <u>chorus</u> goes...<br /><br />
            Use formatting buttons or Cmd+B/I/U for rich text!
          </div>
        )}
      </div>
    </div>
  )
}

export default WysiwygEditor