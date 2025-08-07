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
  type LexicalEditor,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW
} from 'lexical'
import FormattingToolbar from './FormattingToolbar'
import { type LexicalLyricsEditorRef } from './LexicalLyricsEditor'
import { SectionNode } from './lexical/nodes/SectionNode'
import { SyllableNode } from './lexical/nodes/SyllableNode'
import { RhymeNode } from './lexical/nodes/RhymeNode'
import { SectionParagraphNode, $createSectionParagraphNode, $isSectionParagraphNode } from './lexical/nodes/SectionParagraphNode'
import { SectionTagNode } from './nodes/SectionTagNode'
// import SectionHeaderPlugin from './plugins/SectionHeaderPlugin' // TODO: Re-enable when test environment supports full Lexical
// TODO: Re-enable when plugins are fully TypeScript compliant
// import { SectionDetectionPlugin } from './lexical/plugins/SectionDetectionPlugin'
// import { ProsodyAnalysisPlugin } from './lexical/plugins/ProsodyAnalysisPlugin'

// Import the section formatting commands and utilities
import { SECTION_FORMAT_COMMAND, $getCurrentSectionType, $applySectionFormatting, $clearSectionFormatting } from './lexical/commands/SectionFormattingCommands'

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
  enableProsodyAnalysis?: boolean
  enableSyllableMarking?: boolean
  enableRhymeScheme?: boolean
}

// Enhanced Lexical theme configuration for rich text
const theme = {
  root: 'lexical-editor rich-text-editor',
  ltr: 'ltr',
  rtl: 'rtl',
  text: {
    bold: 'lexical-text-bold',
    italic: 'lexical-text-italic',
    underline: 'lexical-text-underline',
    strikethrough: 'lexical-text-strikethrough',
    // Section formatting
    verse: 'lexical-text-verse',
    chorus: 'lexical-text-chorus',
    'pre-chorus': 'lexical-text-pre-chorus',
    bridge: 'lexical-text-bridge',
    intro: 'lexical-text-intro',
    outro: 'lexical-text-outro',
    hook: 'lexical-text-hook',
  },
  paragraph: 'lexical-paragraph',
  // Custom node themes
  sectionNode: 'section-node',
  sectionParagraph: 'lexical-paragraph',
  syllableNode: 'syllable-node',
  prosodyNode: 'prosody-node',
  rhymeNode: 'rhyme-node',
}

// Plugin to handle initial content and external value changes with Lexical serialization
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
  
  // Helper function to check if content is Lexical JSON
  const isLexicalJSON = (content: string): boolean => {
    try {
      const parsed = JSON.parse(content)
      return parsed && typeof parsed === 'object' && 'root' in parsed
    } catch {
      return false
    }
  }
  
  // Initialize editor with value (supports both plain text and Lexical JSON)
  useEffect(() => {
    if (!isInitialized.current) {
      isUpdatingFromProps.current = true
      initialValueRef.current = value
      lastSavedContentRef.current = value
      
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        
        if (value) {
          if (isLexicalJSON(value)) {
            // If it's Lexical JSON, parse and set the editor state
            try {
              const editorState = editor.parseEditorState(value)
              editor.setEditorState(editorState)
              return
            } catch (error) {
              console.warn('Failed to parse Lexical JSON, falling back to plain text:', error)
            }
          }
          
          // Fallback: treat as plain text and create section paragraph nodes
          const lines = value.split('\n')
          lines.forEach((line) => {
            const paragraph = $createSectionParagraphNode()
            if (line.trim()) {
              const textNode = $createTextNode(line)
              paragraph.append(textNode)
            }
            root.append(paragraph)
          })
        } else {
          // Create empty section paragraph
          const emptyParagraph = $createSectionParagraphNode()
          root.append(emptyParagraph)
        }
      }, { tag: 'history-merge' })
      
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
      // Get current editor content as JSON for comparison
      const currentContent = JSON.stringify(editor.getEditorState().toJSON())
      
      if (currentContent !== value && !isLexicalJSON(value)) {
        // Only update if value is different and not already Lexical JSON
        isUpdatingFromProps.current = true
        lastSavedContentRef.current = value
        
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          
          if (value) {
            if (isLexicalJSON(value)) {
              try {
                const editorState = editor.parseEditorState(value)
                editor.setEditorState(editorState)
                return
              } catch (error) {
                console.warn('Failed to parse Lexical JSON during update:', error)
              }
            }
            
            // Fallback to plain text parsing
            const lines = value.split('\n')
            lines.forEach((line) => {
              const paragraph = $createSectionParagraphNode()
              if (line.trim()) {
                const textNode = $createTextNode(line)
                paragraph.append(textNode)
              }
              root.append(paragraph)
            })
          } else {
            const emptyParagraph = $createSectionParagraphNode()
            root.append(emptyParagraph)
          }
        }, { tag: 'history-merge' })
        
        setTimeout(() => {
          isUpdatingFromProps.current = false
        }, 100)
      }
    }
  }, [editor, value])
  
  // Handle editor content changes - now using Lexical JSON serialization
  const handleEditorChange = useCallback(() => {
    if (isUpdatingFromProps.current) {
      return
    }
    
    // Get the current editor state as JSON (preserves all formatting)
    const editorState = editor.getEditorState()
    const jsonContent = JSON.stringify(editorState.toJSON())
    
    // Only process if content actually changed from the last saved version
    if (jsonContent === lastSavedContentRef.current) {
      return
    }
    
    // Update parent component with new content (as Lexical JSON)
    onChange(jsonContent)
    lastChangeTimeRef.current = Date.now()
    
    // Setup debounced auto-save
    if (enableAutoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        const timeSinceLastChange = Date.now() - lastChangeTimeRef.current
        if (timeSinceLastChange >= autoSaveDelay - 100) {
          // Get current state for auto-save
          const currentEditorState = editor.getEditorState()
          const currentContent = JSON.stringify(currentEditorState.toJSON())
          
          console.log('📝 Auto-save content check:', {
            capturedAtChange: jsonContent.length,
            currentAtSave: currentContent.length,
            hasFormatting: currentContent.includes('"format"')
          })
          
          if (currentContent !== jsonContent) {
            console.log('🔧 React state behind Lexical - updating immediately')
            onChange(currentContent)
          }
          
          lastSavedContentRef.current = currentContent
          onAutoSave(currentContent).catch(error => {
            console.error('Auto-save failed:', error)
          })
        }
      }, autoSaveDelay)
    }
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

// Plugin to handle section formatting commands using Lexical state management
function SectionFormattingPlugin() {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    return editor.registerCommand(
      SECTION_FORMAT_COMMAND,
      (sectionType: string | null) => {
        editor.update(() => {
          $applySectionFormatting(sectionType)
        })
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor])
  
  // Register keyboard shortcut for clearing section formatting
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'X') {
        event.preventDefault()
        editor.update(() => {
          $clearSectionFormatting()
        })
        return true
      }
      return false
    }

    const rootElement = editor.getRootElement()
    if (rootElement) {
      rootElement.addEventListener('keydown', handleKeyDown)
      return () => {
        rootElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor])
  
  return null
}

// Plugin to handle paste operations and clean up formatting
function PastePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      'PASTE_COMMAND' as any,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        // Get plain text without formatting
        const plainText = clipboardData.getData('text/plain')
        if (!plainText) return false

        // Prevent default paste behavior
        event.preventDefault()

        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            // Work WITH Lexical's paragraph model - each line becomes a paragraph
            const lines = plainText.split(/\r?\n/)
            
            // Create section paragraph nodes for each line (Lexical's natural behavior)
            const paragraphNodes = lines.map(line => {
              const paragraph = $createSectionParagraphNode()
              if (line.trim()) {
                const textNode = $createTextNode(line)
                paragraph.append(textNode)
              }
              return paragraph
            })
            
            // Insert the paragraph nodes
            selection.insertNodes(paragraphNodes)
          }
        })

        return true
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor])

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
    const [showSourceDebug, setShowSourceDebug] = useState(false)
    const editorRef = useRef<LexicalEditor | null>(null)
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrikethrough, setIsStrikethrough] = useState(false)
    
    // Section formatting state
    const [activeSection, setActiveSection] = useState<string | null>(null)
    
    // Lexical configuration with custom nodes  
    const initialConfig = React.useMemo(() => ({
      namespace: 'RichTextLyricsEditor',
      theme,
      nodes: [
        SectionNode,
        SyllableNode,
        RhymeNode,
        SectionParagraphNode,
        SectionTagNode,
      ],
      onError: (error: Error) => {
        console.error('Lexical error:', error)
      },
    }), [])
    
    // Get debug content (Lexical JSON)
    const getDebugContent = useCallback(() => {
      if (editorRef.current) {
        const editorState = editorRef.current.getEditorState()
        return JSON.stringify(editorState.toJSON(), null, 2)
      }
      return value
    }, [value])
    
    // Toggle debug view
    const toggleDebugView = useCallback(() => {
      setShowSourceDebug(!showSourceDebug)
    }, [showSourceDebug])
    
    // Update formatting state based on selection
    const updateFormattingState = useCallback(() => {
      if (editorRef.current) {
        // Use setTimeout to ensure we read the state AFTER the selection change is committed
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.getEditorState().read(() => {
              const selection = $getSelection()
              if ($isRangeSelection(selection)) {
                setIsBold(selection.hasFormat('bold'))
                setIsItalic(selection.hasFormat('italic'))
                setIsUnderline(selection.hasFormat('underline'))
                setIsStrikethrough(selection.hasFormat('strikethrough'))
                
                // Get current section formatting from Lexical state
                const currentSection = $getCurrentSectionType()
                setActiveSection(currentSection)
              }
            })
          }
        }, 0)
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
    
    // Section formatting commands using custom command
    const formatSection = useCallback((sectionType: string) => {
      if (editorRef.current) {
        editorRef.current.dispatchCommand(SECTION_FORMAT_COMMAND, sectionType)
      }
    }, [])
    
    const formatVerse = useCallback(() => formatSection('verse'), [formatSection])
    const formatChorus = useCallback(() => formatSection('chorus'), [formatSection])
    const formatPreChorus = useCallback(() => formatSection('pre-chorus'), [formatSection])
    const formatBridge = useCallback(() => formatSection('bridge'), [formatSection])
    const formatIntro = useCallback(() => formatSection('intro'), [formatSection])
    const formatOutro = useCallback(() => formatSection('outro'), [formatSection])
    const formatHook = useCallback(() => formatSection('hook'), [formatSection])
    
    // Clear section formatting command
    const clearSectionFormatting = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.update(() => {
          $clearSectionFormatting()
        })
      }
    }, [])
    
    // Jump to section functionality for Rich Text Editor
    const jumpToSection = useCallback((sectionName: string) => {
      if (!editorRef.current) {
        console.warn('Editor not available for section navigation')
        return
      }

      try {
        // Multi-strategy approach to find the target section
        let targetElement: HTMLElement | null = null
        let targetNodeKey: string | null = null

        // Strategy 1: Search by section text content (works with existing [Section Name] format)
        editorRef.current.getEditorState().read(() => {
          const root = $getRoot()
          const children = root.getChildren()
          
          // Look for text content matching [sectionName] format
          const targetTag = `[${sectionName}]`
          
          for (let i = 0; i < children.length; i++) {
            const child = children[i]
            const textContent = child.getTextContent()
            
            // Check if this paragraph contains the section tag
            if (textContent.trim() === targetTag || textContent.includes(targetTag)) {
              targetNodeKey = child.getKey()
              const domElement = editorRef.current?.getElementByKey(child.getKey())
              if (domElement) {
                targetElement = domElement as HTMLElement
                break
              }
            }
          }
        })

        // Strategy 2: If no tag found, try matching by section type (for formatted sections)
        if (!targetElement) {
          const getSectionTypeFromName = (name: string): string | null => {
            const lowerName = name.toLowerCase()
            if (lowerName.includes('verse')) return 'verse'
            if (lowerName.includes('chorus') && !lowerName.includes('pre-chorus')) return 'chorus'
            if (lowerName.includes('pre-chorus') || lowerName.includes('prechorus')) return 'pre-chorus'
            if (lowerName.includes('bridge')) return 'bridge'
            if (lowerName.includes('intro')) return 'intro'
            if (lowerName.includes('outro')) return 'outro'
            if (lowerName.includes('hook')) return 'hook'
            return null
          }

          const targetSectionType = getSectionTypeFromName(sectionName)
          
          if (targetSectionType) {
            editorRef.current.getEditorState().read(() => {
              const root = $getRoot()
              const children = root.getChildren()
              
              // Find the first SectionParagraphNode with matching section type
              for (let i = 0; i < children.length; i++) {
                const child = children[i]
                if ($isSectionParagraphNode(child)) {
                  const childSectionType = child.getSectionType()
                  if (childSectionType === targetSectionType) {
                    targetNodeKey = child.getKey()
                    const domElement = editorRef.current?.getElementByKey(child.getKey())
                    if (domElement) {
                      targetElement = domElement as HTMLElement
                      break
                    }
                  }
                }
              }
            })
          }
        }

        // Strategy 3: Fuzzy text matching if exact matches failed
        if (!targetElement) {
          editorRef.current.getEditorState().read(() => {
            const root = $getRoot()
            const children = root.getChildren()
            
            for (let i = 0; i < children.length; i++) {
              const child = children[i]
              const textContent = child.getTextContent().toLowerCase()
              const sectionNameLower = sectionName.toLowerCase()
              
              // Check for partial matches (e.g., "Verse 1" matches "verse")
              if (textContent.includes(sectionNameLower) || 
                  textContent.includes(`[${sectionNameLower}`) ||
                  (sectionNameLower.includes('verse') && textContent.includes('verse')) ||
                  (sectionNameLower.includes('chorus') && textContent.includes('chorus'))) {
                targetNodeKey = child.getKey()
                const domElement = editorRef.current?.getElementByKey(child.getKey())
                if (domElement) {
                  targetElement = domElement as HTMLElement
                  break
                }
              }
            }
          })
        }

        if (targetElement && targetNodeKey) {
          // Focus the editor first
          editorRef.current.focus()
          
          // Position cursor at the beginning of the target element
          editorRef.current.update(() => {
            const targetNode = $getNodeByKey(targetNodeKey!)
            if (targetNode) {
              const selection = $getSelection()
              if ($isRangeSelection(selection)) {
                // Position cursor at the start of the target node
                selection.anchor.set(targetNodeKey!, 0, 'element')
                selection.focus.set(targetNodeKey!, 0, 'element')
              }
            }
          })

          // Scroll the target element into view with smooth animation
          setTimeout(() => {
            targetElement!.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            })
            
            // Add a subtle highlight effect to show the navigated section
            targetElement!.classList.add('section-navigation-highlight')
            setTimeout(() => {
              targetElement!.classList.remove('section-navigation-highlight')
            }, 2000)
          }, 100)

          console.log(`Successfully navigated to section: ${sectionName}`)
        } else {
          console.warn(`Could not find section: ${sectionName}`)
          // Fallback: focus the editor and scroll to top
          editorRef.current.focus()
          const rootElement = editorRef.current.getRootElement()
          if (rootElement) {
            rootElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
          }
        }
      } catch (error) {
        console.error('Error during section navigation:', error)
        // Fallback: just focus the editor
        if (editorRef.current) {
          editorRef.current.focus()
        }
      }
    }, [])
    
    // Expose methods via ref (updated for rich-text only mode)
    useImperativeHandle(ref, () => ({
      getTextareaElement: () => null, // No longer used
      getWysiwygElement: () => (editorRef.current?.getRootElement() || null) as HTMLDivElement | null,
      insertTextAtCursor: (text: string) => {
        if (editorRef.current) {
          editorRef.current.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertText(text)
            }
          })
        }
      },
      getCurrentCursorPosition: () => {
        // Rich text position is more complex, return 0 for now
        return 0
      },
      setCursorPosition: (_position: number) => {
        // Rich text positioning requires different approach
        // TODO: Implement if needed
      },
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus()
        }
      },
      getSelectedText: () => {
        if (editorRef.current) {
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
      wrapSelectedText: (_before: string, _after: string) => {
        // TODO: Implement rich text wrapping if needed
      },
      isSourceMode: () => false, // Always false now
      jumpToSection: (sectionName: string) => {
        if (editorRef.current) {
          jumpToSection(sectionName)
        }
      },
    }), [value, onChange])
    
    // Store editor reference
    const storeEditorRef = useCallback((editor: LexicalEditor) => {
      editorRef.current = editor
    }, [])
    
    const minHeight = `${rows * 1.5}rem`
    
    return (
      <div className={`rich-text-lyrics-editor h-full flex flex-col relative ${className}`}>
        {/* Rich Text Editor - Always Active */}
        <div className="flex-1 relative overflow-hidden rounded-lg border border-neutral-200/50 bg-white/80 backdrop-blur-sm">
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
                activeSection={activeSection}
                onVerse={formatVerse}
                onChorus={formatChorus}
                onPreChorus={formatPreChorus}
                onBridge={formatBridge}
                onIntro={formatIntro}
                onOutro={formatOutro}
                onHook={formatHook}
                onClearSection={clearSectionFormatting}
              />
              
              <div className="flex-1 overflow-y-auto scroll-smooth relative">
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
              <SectionFormattingPlugin />
              {/* <SectionHeaderPlugin /> */} {/* TODO: Re-enable when test environment supports full Lexical */}
              <PastePlugin />
              {/* TODO: Re-enable when plugins are fully TypeScript compliant */}
              {/* <SectionDetectionPlugin /> */}
              {/* <ProsodyAnalysisPlugin /> */}
            </div>
          </LexicalComposer>
        </div>
        
        {/* View Source Debug - Subtle Button */}
        <button
          onClick={toggleDebugView}
          className="absolute top-4 right-4 z-10 px-2 py-1 text-xs font-mono rounded-md transition-all duration-200 bg-white/80 text-neutral-500 hover:text-neutral-700 hover:bg-white/95 border border-neutral-200/50 hover:border-neutral-300/70 backdrop-blur-sm opacity-60 hover:opacity-100"
          title="View Lexical JSON (Debug)"
        >
          {showSourceDebug ? '🔍 Hide' : '🔍'}
        </button>
        
        {/* Debug Modal */}
        {showSourceDebug && (
          <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-strong border border-neutral-200 max-w-4xl max-h-[80vh] w-full flex flex-col">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-800">Lexical Editor State (Debug)</h3>
                <button
                  onClick={() => setShowSourceDebug(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-xs font-mono text-neutral-700 whitespace-pre-wrap break-all">
                  {getDebugContent()}
                </pre>
              </div>
              <div className="p-4 border-t border-neutral-200 text-sm text-neutral-600">
                💡 This shows the internal Lexical JSON format that preserves all formatting
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

RichTextLyricsEditor.displayName = 'RichTextLyricsEditor'

export type { LexicalLyricsEditorRef as RichTextLyricsEditorRef }
export default RichTextLyricsEditor