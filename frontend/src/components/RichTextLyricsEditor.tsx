import React, { useRef, useCallback, useState, useEffect, useImperativeHandle } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getRoot, 
  $createTextNode, 
  $createParagraphNode, 
  type LexicalEditor,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL
} from 'lexical'
import FormattingToolbar from './FormattingToolbar'
import { type LexicalLyricsEditorRef } from './LexicalLyricsEditor'
import { SectionNode } from './lexical/nodes/SectionNode'
import { SyllableNode } from './lexical/nodes/SyllableNode'
import { RhymeNode } from './lexical/nodes/RhymeNode'
import { SectionDetectionPlugin } from './lexical/plugins/SectionDetectionPlugin'
import { ProsodyAnalysisPlugin } from './lexical/plugins/ProsodyAnalysisPlugin'

interface RichTextLyricsEditorProps {
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

// Enhanced Lexical theme configuration for rich text
const theme = {
  root: 'lexical-editor rich-text-editor',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  paragraph: 'lexical-paragraph',
  // Custom node themes
  sectionNode: 'section-node',
  syllableNode: 'syllable-node',
  prosodyNode: 'prosody-node',
  rhymeNode: 'rhyme-node',
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
            if (line.trim()) {
              const textNode = $createTextNode(line)
              paragraph.append(textNode)
            }
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
              if (line.trim()) {
                const textNode = $createTextNode(line)
                paragraph.append(textNode)
              }
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
    
    editor.update(() => {
      const root = $getRoot()
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
            editor.update(() => {
              const currentRoot = $getRoot()
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
                content: currentContent.slice(-10)
              })
              
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

// Selection tracking plugin for toolbar updates
function SelectionPlugin({ onSelectionChange }: { onSelectionChange?: () => void }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (onSelectionChange) {
          onSelectionChange()
        }
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor, onSelectionChange])
  
  return null
}

// Plugin to store editor reference
function EditorRefPlugin({ onEditorRef }: { onEditorRef: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    onEditorRef(editor)
  }, [editor, onEditorRef])
  
  return null
}

const RichTextLyricsEditor = React.forwardRef<LexicalLyricsEditorRef, RichTextLyricsEditorProps>(
  ({
    value,
    onChange,
    onSelectionChange,
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
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrikethrough, setIsStrikethrough] = useState(false)
    
    // Lexical configuration with custom nodes  
    const initialConfig = React.useMemo(() => ({
      namespace: 'RichTextLyricsEditor',
      theme,
      nodes: [
        SectionNode,
        SyllableNode,
        RhymeNode,
      ],
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
    
    // Update formatting state based on selection
    const updateFormattingState = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'))
            setIsItalic(selection.hasFormat('italic'))
            setIsUnderline(selection.hasFormat('underline'))
            setIsStrikethrough(selection.hasFormat('strikethrough'))
          }
        })
      }
    }, [])
    
    // Handle selection changes
    const handleSelectionChange = useCallback(() => {
      updateFormattingState()
      if (onSelectionChange) {
        onSelectionChange()
      }
    }, [updateFormattingState, onSelectionChange])
    
    // Format text commands
    const formatBold = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
      }
    }, [])
    
    const formatItalic = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
      }
    }, [])
    
    const formatUnderline = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
      }
    }, [])
    
    const formatStrikethrough = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
      }
    }, [])
    
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
        } else if (editorRef.current) {
          editorRef.current.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertText(text)
            }
          })
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
        } else if (editorRef.current) {
          return editorRef.current.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              return selection.getTextContent()
            }
            return ''
          })
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
    
    // Store editor reference
    const storeEditorRef = useCallback((editor: LexicalEditor) => {
      editorRef.current = editor
    }, [])
    
    const minHeight = `${rows * 1.5}rem`
    
    return (
      <div className={`rich-text-lyrics-editor h-full flex flex-col relative ${className}`}>
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
                {/* Store editor reference */}
                <EditorRefPlugin onEditorRef={storeEditorRef} />
                
                {/* Formatting Toolbar */}
                <FormattingToolbar
                  isBold={isBold}
                  isItalic={isItalic}
                  isUnderline={isUnderline}
                  isStrikethrough={isStrikethrough}
                  onBold={formatBold}
                  onItalic={formatItalic}
                  onUnderline={formatUnderline}
                  onStrikethrough={formatStrikethrough}
                />
                
                <div className="flex-1 overflow-y-auto scroll-smooth">
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        className={`lexical-editor rich-text-content w-full min-h-full border-0 px-6 py-6 text-lyrics focus:outline-none resize-none transition-all duration-200 text-neutral-900 bg-transparent leading-relaxed ${className}`}
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
                <SelectionPlugin onSelectionChange={handleSelectionChange} />
                <SectionDetectionPlugin />
                <ProsodyAnalysisPlugin />
              </div>
            </LexicalComposer>
          )}
        </div>
        
        {/* Mode Toggle - Floating Button */}
        <button
          onClick={toggleMode}
          className="absolute top-4 right-4 z-10 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white/90 text-neutral-600 hover:text-neutral-800 hover:bg-white hover:shadow-soft border border-neutral-200/50 hover:border-neutral-300 backdrop-blur-sm"
          title={isSourceMode ? 'Switch to Rich Text Mode' : 'Switch to Source Mode'}
        >
          {isSourceMode ? (
            <>
              <span className="mr-2">🎨</span>
              Rich Text
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

RichTextLyricsEditor.displayName = 'RichTextLyricsEditor'

export default RichTextLyricsEditor