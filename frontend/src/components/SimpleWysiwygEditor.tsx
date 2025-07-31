import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useProsodyAnalysis } from '../hooks/useProsodyAnalysis'
import { ProsodyLegend } from './editor/ProsodyLegend'
import type {LineAnalysis} from '../utils/prosodyAnalysis'

interface SimpleWysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: () => void
  placeholder?: string
  className?: string
  rows?: number
  showProsodyAnalysis?: boolean
  showStabilityIndicators?: boolean
  showRhymeScheme?: boolean
}

export const SimpleWysiwygEditor: React.FC<SimpleWysiwygEditorProps> = ({
  value,
  onChange,
  onSelectionChange,
  placeholder = 'Start typing...',
  className = '',
  rows = 24,
  showProsodyAnalysis = true,
  showStabilityIndicators = true,
  showRhymeScheme = true
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wysiwygRef = useRef<HTMLDivElement>(null)
  const [isSourceMode, setIsSourceMode] = useState(false)
  // const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null) // Unused for now
  const [showProsodyLegend, setShowProsodyLegend] = useState(false)
  const [lastContentValue, setLastContentValue] = useState('')
  const [lastAnalysisUpdate, setLastAnalysisUpdate] = useState<number>(0)
  
  // Prosody analysis with longer debounce to prevent constant refresh
  const { analysis, isAnalyzing } = useProsodyAnalysis({
    text: value,
    settings: {
      enableStabilityAnalysis: showStabilityIndicators,
      enableRhymeDetection: showRhymeScheme,
      analysisDelay: 1000 // Increased from 300ms to 1000ms for better UX
    }
  })

  // Get section icon and color for visual headers
  const getSectionIcon = useCallback((sectionName: string): string => {
    const lowerName = sectionName.toLowerCase()
    if (lowerName.includes('verse')) return '📝'
    if (lowerName.includes('chorus') || lowerName.includes('hook')) return '🎵'
    if (lowerName.includes('bridge')) return '🌉'
    if (lowerName.includes('pre') || lowerName.includes('prechorus')) return '🔄'
    if (lowerName.includes('intro')) return '🎬'
    if (lowerName.includes('outro') || lowerName.includes('end')) return '🎭'
    if (lowerName.includes('breakdown') || lowerName.includes('break')) return '⚡'
    return '🎼'
  }, [])
  
  const getSectionColor = useCallback((sectionName: string): string => {
    const lowerName = sectionName.toLowerCase()
    if (lowerName.includes('verse')) return 'from-blue-100 to-blue-200 text-blue-800 border-blue-300'
    if (lowerName.includes('chorus') || lowerName.includes('hook')) return 'from-green-100 to-green-200 text-green-800 border-green-300'
    if (lowerName.includes('bridge')) return 'from-amber-100 to-amber-200 text-amber-800 border-amber-300'
    if (lowerName.includes('pre') || lowerName.includes('prechorus')) return 'from-purple-100 to-purple-200 text-purple-800 border-purple-300'
    if (lowerName.includes('intro')) return 'from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300'
    if (lowerName.includes('outro') || lowerName.includes('end')) return 'from-rose-100 to-rose-200 text-rose-800 border-rose-300'
    if (lowerName.includes('breakdown') || lowerName.includes('break')) return 'from-orange-100 to-orange-200 text-orange-800 border-orange-300'
    return 'from-neutral-100 to-neutral-200 text-neutral-800 border-neutral-300'
  }, [])

  // Convert markdown to HTML for display with prosody indicators
  const convertToHtml = useCallback((text: string, lineAnalyses?: LineAnalysis[]) => {
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
    
    // Replace section headers with clean section borders (unlabeled)
    html = html.replace(/\[([^\]]+)\]/g, (_, sectionName) => {
      return `<div class="section-border" data-section="${sectionName}" aria-label="Section: ${sectionName}"></div>`
    })
    
    // Add line-level prosody indicators
    if (showProsodyAnalysis && lineAnalyses) {
      const lines = html.split('\n')
      html = lines.map((line, index) => {
        // Skip section borders for prosody analysis
        if (line.includes('section-border')) {
          return line
        }
        
        const lineAnalysis = lineAnalyses.find(la => la.lineNumber === index + 1)
        let stabilityClass = 'line-neutral'
        
        if (lineAnalysis && line.trim() && !line.includes('section-header')) {
          stabilityClass = `line-${lineAnalysis.endingType}`
        }
        
        return `<div class="prosody-line ${stabilityClass}" data-line="${index}">${line || '&nbsp;'}</div>`
      }).join('')
    } else {
      html = html.replace(/\n/g, '<br>')
    }
    
    return html
  }, [showProsodyAnalysis, getSectionIcon, getSectionColor])

  // Convert HTML back to markdown
  const convertToMarkdown = useCallback((html: string) => {
    if (!html) return ''
    
    // First extract text from prosody divs if they exist
    let processedHtml = html
    
    // Convert section borders back to bracket format
    processedHtml = processedHtml.replace(
      /<div class="section-border"[^>]*data-section="([^"]+)"[^>]*><\/div>/gi, 
      '[\$1]'
    )
    
    // Extract text from prosody line divs, preserving line breaks
    processedHtml = processedHtml.replace(/<div class="prosody-line[^"]*"[^>]*>(.*?)<\/div>/gi, '$1\n')
    
    return processedHtml
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
      .replace(/\n\s*\n/g, '\n') // Clean up extra newlines
      .trim()
  }, [])

  // Store cursor position before updates
  const saveCursorPosition = useCallback(() => {
    if (!wysiwygRef.current) return null
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    
    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(wysiwygRef.current)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    
    return {
      start: preCaretRange.toString().length,
      end: preCaretRange.toString().length
    }
  }, [])
  
  // Restore cursor position after updates
  const restoreCursorPosition = useCallback((position: { start: number; end: number } | null) => {
    if (!position || !wysiwygRef.current) return
    
    const walker = document.createTreeWalker(
      wysiwygRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    let charCount = 0
    let startNode = null
    let endNode = null
    let startOffset = 0
    let endOffset = 0
    
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const nodeLength = node.textContent?.length || 0
      
      if (!startNode && charCount + nodeLength >= position.start) {
        startNode = node
        startOffset = position.start - charCount
      }
      
      if (!endNode && charCount + nodeLength >= position.end) {
        endNode = node
        endOffset = position.end - charCount
        break
      }
      
      charCount += nodeLength
    }
    
    if (startNode && endNode) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  // Remove duplicate state declarations - they're already declared above
  
  // Update WYSIWYG content when content changes or when switching to WYSIWYG mode
  useEffect(() => {
    if (!isSourceMode && wysiwygRef.current && value !== lastContentValue) {
      // Save cursor position before updating
      const cursorPosition = saveCursorPosition()
      
      const htmlContent = convertToHtml(value, analysis?.lines)
      wysiwygRef.current.innerHTML = htmlContent
      setLastContentValue(value)
      
      // Restore cursor position after a short delay
      setTimeout(() => {
        restoreCursorPosition(cursorPosition)
      }, 0)
    }
  }, [value, lastContentValue, isSourceMode, convertToHtml, analysis, saveCursorPosition, restoreCursorPosition])
  
  // Update prosody indicators separately without affecting cursor
  useEffect(() => {
    if (!isSourceMode && wysiwygRef.current && analysis && value === lastContentValue) {
      const currentTime = Date.now()
      // Throttle prosody visual updates to prevent constant refresh feeling
      if (currentTime - lastAnalysisUpdate > 500) {
        const lines = wysiwygRef.current.querySelectorAll('.prosody-line')
        analysis.lines.forEach((lineAnalysis, index) => {
          const lineElement = lines[index] as HTMLElement
          if (lineElement) {
            // Update only the visual indicators without changing innerHTML
            lineElement.className = `prosody-line line-${lineAnalysis.endingType}`
          }
        })
        setLastAnalysisUpdate(currentTime)
      }
    }
  }, [analysis, isSourceMode, value, lastContentValue, lastAnalysisUpdate])

  // Handle WYSIWYG changes
  const handleWysiwygChange = useCallback(() => {
    if (wysiwygRef.current) {
      const html = wysiwygRef.current.innerHTML
      const markdown = convertToMarkdown(html)
      
      // Only update if content actually changed to prevent cursor jumping
      if (markdown !== value) {
        onChange(markdown)
      }
      
      // Update current line index based on cursor position
      const selection = window.getSelection()
      if (selection && selection.anchorNode) {
        const lineDiv = selection.anchorNode.parentElement?.closest('[data-line]')
        if (lineDiv) {
          // const lineIndex = parseInt(lineDiv.getAttribute('data-line') || '0') // Disabled for now
          // setCurrentLineIndex(lineIndex) // Disabled for now
        }
      }
    }
    if (onSelectionChange) {
      onSelectionChange()
    }
  }, [onChange, onSelectionChange, convertToMarkdown, value])

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

  // Handle keyboard shortcuts and special keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isSourceMode) return
    
    // Handle formatting shortcuts
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
      return
    }
    
    // Handle Enter key to create proper line breaks
    if (e.key === 'Enter') {
      e.preventDefault()
      
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Insert a line break
        const br = document.createElement('br')
        range.insertNode(br)
        
        // Move cursor after the break
        range.setStartAfter(br)
        range.setEndAfter(br)
        selection.removeAllRanges()
        selection.addRange(range)
        
        // Trigger change event
        handleWysiwygChange()
      }
    }
  }, [isSourceMode, formatBold, formatItalic, formatUnderline, handleWysiwygChange])

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
        
        /* Section borders - clean visual separators with no text labels */
        .section-border {
          position: relative;
          margin: 24px 0 16px 0;
          padding: 0;
          height: 1px;
          border-top: 1px solid rgba(148, 163, 184, 0.3);
        }
        .section-border::after {
          content: '';
          position: absolute;
          top: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3B82F6, transparent);
          transition: width 0.2s ease;
        }
        .section-border:hover::after {
          width: 60px;
        }
        
        /* Accessibility: screen readers can still identify sections */
        .section-border[aria-label] {
          position: relative;
        }
        
        /* Prosody line indicators */
        .prosody-line {
          padding-left: 8px;
          border-left: 3px solid transparent;
          transition: all 0.2s ease;
          min-height: 1.5rem;
          display: block;
          margin: 0;
        }
        .prosody-line.line-stable {
          border-left-color: #10b981 !important;
          background: linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent 20px);
        }
        .prosody-line.line-mixed {
          border-left-color: #f59e0b !important;
          background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent 20px);
        }
        .prosody-line.line-unstable {
          border-left-color: #ef4444 !important;
          background: linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent 20px);
        }
        .prosody-line.line-neutral {
          border-left-color: transparent;
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
              
              {/* Prosody Legend Toggle */}
              {showProsodyAnalysis && (
                <button
                  onClick={() => setShowProsodyLegend(!showProsodyLegend)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200 border ${
                    showProsodyLegend 
                      ? 'bg-primary-100 text-primary-700 border-primary-300' 
                      : 'bg-white/80 text-neutral-600 border-neutral-200/50 hover:bg-white hover:text-neutral-800 hover:border-neutral-300 hover:shadow-soft'
                  }`}
                  title="Show/Hide Prosody Legend"
                >
                  🎵
                </button>
              )}
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
      <div className="flex-1 overflow-y-auto relative">
        
        {/* Prosody Legend - Always visible when prosody is enabled */}
        {showProsodyAnalysis && showProsodyLegend && (
          <ProsodyLegend 
            show={showProsodyLegend} 
            onToggle={() => setShowProsodyLegend(false)}
            className="absolute top-4 right-4 z-20 max-w-sm shadow-strong"
          />
        )}
        {isSourceMode ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleSourceChange}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            onFocus={onSelectionChange}
            onClick={onSelectionChange}
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
            onFocus={onSelectionChange}
            onClick={onSelectionChange}
            onPaste={(e) => {
              e.preventDefault()
              const text = e.clipboardData.getData('text/plain')
              document.execCommand('insertText', false, text)
              handleWysiwygChange()
            }}
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
      
      {/* Prosody Analysis Panel */}
      {showProsodyAnalysis && !isSourceMode && analysis && (
        <div className="px-6 py-3 bg-gradient-to-r from-neutral-50/50 to-white/30 border-t border-neutral-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-neutral-600">
                Stability: <span style={{ color: analysis.overallStability === 'stable' ? '#10b981' : analysis.overallStability === 'mixed' ? '#f59e0b' : '#ef4444' }}>
                  {analysis.overallStability}
                </span>
              </span>
              <span className="text-xs font-medium text-neutral-600">
                Pattern: {analysis.dominantRhymeScheme}
              </span>
              {analysis.sections.length > 0 && (
                <span className="text-xs font-medium text-neutral-600">
                  Sections: {analysis.sections.length}
                </span>
              )}
            </div>
            {isAnalyzing && (
              <span className="text-xs text-neutral-500">Analyzing...</span>
            )}
          </div>
        </div>
      )}
      
      {/* Debug info */}
      <div className="px-6 py-2 text-xs text-neutral-500 bg-neutral-50/50 border-t border-neutral-200/30">
        Mode: {isSourceMode ? 'Source' : 'WYSIWYG'} | Content length: {value?.length || 0}
        {showProsodyAnalysis && analysis && (
          <> | Lines: {analysis.lines.length} | Clichés: {analysis.clicheDetections.length}</>
        )}
      </div>
    </div>
  )
}

export default SimpleWysiwygEditor