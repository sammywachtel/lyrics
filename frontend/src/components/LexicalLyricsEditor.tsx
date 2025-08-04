import React, { useRef, useCallback, useState, useEffect, useImperativeHandle } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $createTextNode, $createParagraphNode, type LexicalEditor } from 'lexical'

interface LexicalLyricsEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: () => void
  placeholder?: string
  className?: string
  rows?: number
  enableAutoSave?: boolean
  autoSaveDelay?: number
  onAutoSave?: (currentContent?: string) => Promise<void>
}

export interface LexicalLyricsEditorRef {
  getTextareaElement: () => HTMLTextAreaElement | null
  getWysiwygElement: () => HTMLDivElement | null
  insertTextAtCursor: (text: string) => void
  getCurrentCursorPosition: () => number | null
  setCursorPosition: (position: number) => void
  focus: () => void
  getSelectedText: () => string
  wrapSelectedText: (before: string, after: string) => void
  isSourceMode: () => boolean
}

// Lexical theme configuration
const theme = {
  root: 'lexical-editor',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

// Plugin to handle initial content and external value changes
function ValueSyncPlugin({ 
  value, 
  onChange,
  onAutoSave,
  autoSaveDelay = 10000,
  enableAutoSave = true
}: { 
  value: string
  onChange: (value: string) => void
  onAutoSave?: (currentContent?: string) => Promise<void>
  autoSaveDelay?: number
  enableAutoSave?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const isInitialized = useRef(false)
  const isUpdatingFromProps = useRef(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastChangeTimeRef = useRef<number>(0)
  const initialValueRef = useRef(value)
  const lastSavedContentRef = useRef('')
  
  // Initialize editor with value
  useEffect(() => {
    if (!isInitialized.current) {
      isUpdatingFromProps.current = true
      initialValueRef.current = value
      lastSavedContentRef.current = value
      
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        
        if (value) {
          // Split by lines and create paragraph nodes
          const lines = value.split('\n')
          lines.forEach((line) => {
            const paragraph = $createParagraphNode()
            const textNode = $createTextNode(line)
            paragraph.append(textNode)
            root.append(paragraph)
          })
        } else {
          // Create empty paragraph
          const emptyParagraph = $createParagraphNode()
          root.append(emptyParagraph)
        }
      })
      
      isInitialized.current = true
      // Wait longer before allowing changes to be detected
      setTimeout(() => {
        isUpdatingFromProps.current = false
      }, 200)
    }
  }, [editor, value])
  
  // Update editor when external value changes (but not during initialization)
  useEffect(() => {
    if (isInitialized.current && !isUpdatingFromProps.current && value !== initialValueRef.current) {
      const currentText = editor.getEditorState().read(() => {
        const root = $getRoot()
        const children = root.getChildren()
        return children.map(child => {
          if (child.getType() === 'paragraph') {
            return child.getTextContent()
          }
          return child.getTextContent()
        }).join('\n')
      })
      
      if (currentText !== value) {
        isUpdatingFromProps.current = true
        lastSavedContentRef.current = value
        
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          
          if (value) {
            const lines = value.split('\n')
            lines.forEach((line) => {
              const paragraph = $createParagraphNode()
              const textNode = $createTextNode(line)
              paragraph.append(textNode)
              root.append(paragraph)
            })
          } else {
            const emptyParagraph = $createParagraphNode()
            root.append(emptyParagraph)
          }
        })
        
        setTimeout(() => {
          isUpdatingFromProps.current = false
        }, 100)
      }
    }
  }, [editor, value])
  
  // Handle editor content changes
  const handleEditorChange = useCallback(() => {
    if (isUpdatingFromProps.current) {
      return
    }
    
    // Use Lexical's update mechanism to ensure proper scheduling
    // This ensures content is read after Lexical has fully processed the change
    editor.update(() => {
      const root = $getRoot()
      // Use custom text extraction to preserve original newline structure
      const children = root.getChildren()
      const textContent = children.map(child => {
        if (child.getType() === 'paragraph') {
          return child.getTextContent()
        }
        return child.getTextContent()
      }).join('\n')
      
      // Only process if content actually changed from the last saved version
      if (textContent === lastSavedContentRef.current) {
        return
      }
      
      // Update parent component with new content
      onChange(textContent)
      lastChangeTimeRef.current = Date.now()
      
      // Setup debounced auto-save
      if (enableAutoSave && onAutoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          const timeSinceLastChange = Date.now() - lastChangeTimeRef.current
          if (timeSinceLastChange >= autoSaveDelay - 100) {
            // Get the latest content directly from the editor at save time
            editor.update(() => {
              const currentRoot = $getRoot()
              // Use custom text extraction to preserve original newline structure
              const children = currentRoot.getChildren()
              const currentContent = children.map(child => {
                if (child.getType() === 'paragraph') {
                  return child.getTextContent()
                }
                return child.getTextContent()
              }).join('\n')
              
              console.log('📝 Auto-save content check:', {
                capturedAtChange: textContent.length,
                currentAtSave: currentContent.length,
                content: currentContent.slice(-10) // Last 10 chars
              })
              
              // Always ensure React state is synchronized
              if (currentContent !== textContent) {
                console.log('🔧 React state behind Lexical - updating immediately')
                onChange(currentContent)
              }
              
              lastSavedContentRef.current = currentContent
              onAutoSave(currentContent).catch(error => {
                console.error('Auto-save failed:', error)
              })
            })
          }
        }, autoSaveDelay)
      }
    })
  }, [editor, onChange, onAutoSave, enableAutoSave, autoSaveDelay])
  
  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])
  
  return <OnChangePlugin onChange={handleEditorChange} />
}

// Auto-focus plugin
function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      editor.focus()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [editor])
  
  return null
}

const LexicalLyricsEditor = React.forwardRef<LexicalLyricsEditorRef, LexicalLyricsEditorProps>(
  ({
    value,
    onChange,
    placeholder = 'Start writing your lyrics...',
    className = '',
    rows = 24,
    enableAutoSave = true,
    autoSaveDelay = 10000,
    onAutoSave,
  }, ref) => {
    const [isSourceMode, setIsSourceMode] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const editorRef = useRef<LexicalEditor | null>(null)
    
    // Lexical configuration  
    const initialConfig = React.useMemo(() => ({
      namespace: 'LexicalLyricsEditor',
      theme,
      onError: (error: Error) => {
        console.error('Lexical error:', error)
      },
    }), [])
    
    // Handle source mode changes
    const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    }, [onChange])
    
    // Toggle between modes
    const toggleMode = useCallback(() => {
      setIsSourceMode(!isSourceMode)
    }, [isSourceMode])
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getTextareaElement: () => textareaRef.current,
      getWysiwygElement: () => (editorRef.current?.getRootElement() || null) as HTMLDivElement | null,
      insertTextAtCursor: (text: string) => {
        if (isSourceMode && textareaRef.current) {
          const textarea = textareaRef.current
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const newValue = value.substring(0, start) + text + value.substring(end)
          onChange(newValue)
          setTimeout(() => {
            textarea.setSelectionRange(start + text.length, start + text.length)
          }, 0)
        }
      },
      getCurrentCursorPosition: () => {
        if (isSourceMode && textareaRef.current) {
          return textareaRef.current.selectionStart
        }
        return 0
      },
      setCursorPosition: (position: number) => {
        if (isSourceMode && textareaRef.current) {
          textareaRef.current.setSelectionRange(position, position)
        }
      },
      focus: () => {
        if (isSourceMode && textareaRef.current) {
          textareaRef.current.focus()
        } else if (editorRef.current) {
          editorRef.current.focus()
        }
      },
      getSelectedText: () => {
        if (isSourceMode && textareaRef.current) {
          const textarea = textareaRef.current
          return value.substring(textarea.selectionStart, textarea.selectionEnd)
        }
        return ''
      },
      wrapSelectedText: (before: string, after: string) => {
        if (isSourceMode && textareaRef.current) {
          const textarea = textareaRef.current
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const selectedText = value.substring(start, end)
          const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)
          onChange(newValue)
        }
      },
      isSourceMode: () => isSourceMode,
    }), [isSourceMode, value, onChange])
    
    const minHeight = `${rows * 1.5}rem`
    
    return (
      <div className={`lexical-lyrics-editor h-full flex flex-col relative ${className}`}>
        {/* Editor Content - Full Height with Internal Scrolling */}
        <div className="flex-1 relative overflow-hidden rounded-lg border border-neutral-200/50 bg-white/80 backdrop-blur-sm">
          {isSourceMode ? (
            <div className="h-full overflow-y-auto scroll-smooth">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleSourceChange}
                placeholder={placeholder}
                className={`w-full h-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent leading-relaxed ${className}`}
                style={{ 
                  minHeight,
                  fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace'
                }}
              />
            </div>
          ) : (
            <LexicalComposer initialConfig={initialConfig}>
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto scroll-smooth">
                  <PlainTextPlugin
                    contentEditable={
                      <ContentEditable
                        className={`lexical-editor w-full min-h-full border-0 px-6 py-6 text-lyrics focus:outline-none font-mono resize-none transition-all duration-200 text-neutral-900 bg-transparent leading-relaxed ${className}`}
                        style={{ 
                          minHeight,
                          fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
                          whiteSpace: 'pre-wrap'
                        }}
                        aria-placeholder={placeholder}
                        placeholder={
                          <div 
                            className="absolute top-6 left-6 text-neutral-400 pointer-events-none select-none font-mono"
                            style={{
                              fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace'
                            }}
                          >
                            {placeholder}
                          </div>
                        }
                      />
                    }
                    ErrorBoundary={({ children }) => <div>{children}</div>}
                  />
                </div>
                
                <HistoryPlugin />
                <ValueSyncPlugin 
                  value={value} 
                  onChange={onChange} 
                  onAutoSave={onAutoSave}
                  autoSaveDelay={autoSaveDelay}
                  enableAutoSave={enableAutoSave}
                />
                <AutoFocusPlugin />
              </div>
            </LexicalComposer>
          )}
        </div>
        
        {/* Mode Toggle - Floating Button */}
        <button
          onClick={toggleMode}
          className="absolute top-4 right-4 z-10 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white/90 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-neutral-200/50 hover:border-neutral-300 backdrop-blur-sm"
          title={isSourceMode ? 'Switch to Preview Mode' : 'Switch to Source Mode'}
        >
          {isSourceMode ? (
            <>
              <span className="mr-2">👁</span>
              Preview
            </>
          ) : (
            <>
              <span className="mr-2">⚡</span>
              Source
            </>
          )}
        </button>
      </div>
    )
  }
)

LexicalLyricsEditor.displayName = 'LexicalLyricsEditor'

export default LexicalLyricsEditor