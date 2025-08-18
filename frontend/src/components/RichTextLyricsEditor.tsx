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
  type EditorState,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  KEY_ENTER_COMMAND
} from 'lexical'
import FormattingToolbar from './FormattingToolbar'
import { type LexicalLyricsEditorRef } from './LexicalLyricsEditor'
import { SectionNode } from './lexical/nodes/SectionNode'
import { SyllableNode } from './lexical/nodes/SyllableNode'
import { RhymeNode } from './lexical/nodes/RhymeNode'
import { SectionParagraphNode, $createSectionParagraphNode, $isSectionParagraphNode } from './lexical/nodes/SectionParagraphNode'
import { SectionTagNode } from './nodes/SectionTagNode'
import { StressedTextNode, $createStressedTextNode, $isStressedTextNode } from './lexical/nodes/StressedTextNode'
import { StressMarkDecoratorNode } from './lexical/nodes/StressMarkDecoratorNode'
import { StressMarkDecoratorPlugin } from './lexical/plugins/StressMarkDecoratorPlugin'
import { AutoStressDetectionPlugin } from './lexical/plugins/AutoStressDetectionPlugin'
import { StableTextToStressedPlugin } from './lexical/plugins/StableTextToStressedPlugin'
import { ComprehensiveStressPlugin } from './lexical/plugins/ComprehensiveStressPlugin'
import StressContextMenu from './lexical/ui/StressContextMenu'
// Legacy plugin removed - SectionHeaderPlugin
// TODO: Re-enable when plugins are fully TypeScript compliant
// import { SectionDetectionPlugin } from './lexical/plugins/SectionDetectionPlugin'
// import { ProsodyAnalysisPlugin } from './lexical/plugins/ProsodyAnalysisPlugin'

// Import the section formatting commands and utilities
import { SECTION_FORMAT_COMMAND, $getCurrentSectionType, $applySectionFormatting, $clearSectionFormatting } from './lexical/commands/SectionFormattingCommands'
// Import prosody styles
import '../styles/prosody.css'
// Import validation utilities
import { prepareLexicalForSave } from '../utils/lexicalDataValidation'

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
  enableStressMarking?: boolean
  editable?: boolean
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
              // Ensure the editor state has content before setting it
              const hasContent = editorState.read(() => {
                const root = $getRoot()
                return root.getChildren().length > 0
              })
              if (hasContent) {
                editor.setEditorState(editorState)
                return
              } else {
                console.warn('Parsed Lexical JSON has empty root, falling back to plain text')
              }
            } catch (error) {
              console.warn('Failed to parse Lexical JSON, falling back to plain text:', error)
            }
          }

          // Fallback: treat as plain text and create section paragraph nodes
          const lines = value.split('\n')

          // Filter out empty lines to prevent extra newlines
          const nonEmptyLines = lines.filter(line => line.trim().length > 0)

          if (nonEmptyLines.length > 0) {
            nonEmptyLines.forEach((line) => {
              const paragraph = $createSectionParagraphNode()
              const textNode = $createStressedTextNode(line.trim())
              paragraph.append(textNode)
              root.append(paragraph)
            })
          } else {
            // Create single empty paragraph for empty content
            const emptyParagraph = $createSectionParagraphNode()
            root.append(emptyParagraph)
          }
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

  // DISABLED: This useEffect was causing cursor focus issues
  // It was triggering editor.setEditorState() when value prop changed from user typing,
  // which disrupted the cursor position and caused text scrambling
  //
  // The controlled component pattern doesn't work well with Lexical's internal state management
  // For now, we'll rely on the initial load and manual updates only
  //
  // useEffect(() => {
  //   if (isInitialized.current && !isUpdatingFromProps.current && value !== initialValueRef.current) {
  //     // ... editor update logic that was causing cursor issues
  //   }
  // }, [editor, value])

  // Handle editor content changes - now using Lexical JSON serialization
  const handleEditorChange = useCallback((editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {
    if (isUpdatingFromProps.current) {
      return
    }

    // Only ignore decorator replacement updates (not text conversion or stress detection)
    // We want to capture word counts even after stress processing
    if (tags.has('decorator-replacement')) {
      return
    }

    // Get the current editor state as JSON (preserves all formatting)
    const rawJSON = JSON.stringify(editorState.toJSON())

    // Validate and prepare for saving
    const safeData = prepareLexicalForSave(rawJSON)

    if (!safeData.isValid) {
      console.warn('⚠️ Prevented saving corrupted Lexical data:', safeData.errors)
    }

    // Only process if content actually changed from the last saved version
    if (safeData.data === lastSavedContentRef.current) {
      return
    }

    // Extract plain text for word counts and section parsing
    // Use custom extraction to avoid newline duplication
    const plainText = editorState.read(() => {
      const root = $getRoot()
      const children = root.getChildren()

      // Extract text from each paragraph node and join with single newlines
      const lines: string[] = []
      children.forEach(child => {
        if ($isSectionParagraphNode(child) || child.getType() === 'paragraph') {
          const textContent = child.getTextContent()
          lines.push(textContent)
        }
      })

      // Join with single newlines to avoid duplication
      return lines.join('\n')
    })

    // Update parent component with plain text for word counts and section parsing
    onChange(plainText)
    lastChangeTimeRef.current = Date.now()

    // Setup debounced auto-save
    if (enableAutoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const timeSinceLastChange = Date.now() - lastChangeTimeRef.current
        if (timeSinceLastChange >= autoSaveDelay - 100) {
          // Get current state for auto-save with validation
          const currentEditorState = editor.getEditorState()
          const rawCurrentContent = JSON.stringify(currentEditorState.toJSON())
          const safeCurrentData = prepareLexicalForSave(rawCurrentContent)

          console.log('📝 Auto-save content check:', {
            capturedAtChange: safeData.data.length,
            currentAtSave: safeCurrentData.data.length,
            hasFormatting: safeCurrentData.data.includes('"format"'),
            wasValidated: !safeCurrentData.isValid
          })

          if (safeCurrentData.data !== safeData.data) {
            console.log('🔧 React state behind Lexical - updating immediately')
            // Extract current plain text for word counts using custom extraction
            const currentPlainText = currentEditorState.read(() => {
              const root = $getRoot()
              const children = root.getChildren()

              const lines: string[] = []
              children.forEach(child => {
                if ($isSectionParagraphNode(child) || child.getType() === 'paragraph') {
                  const textContent = child.getTextContent()
                  lines.push(textContent)
                }
              })

              return lines.join('\n')
            })
            onChange(currentPlainText)
          }

          lastSavedContentRef.current = safeCurrentData.data
          onAutoSave(safeCurrentData.data).catch(error => {
            console.error('Auto-save failed:', error)
          })
        }
      }, autoSaveDelay)
    }
  }, [onChange, onAutoSave, enableAutoSave, autoSaveDelay])

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
        }, { tag: 'apply-section-formatting' })
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
        }, { tag: 'clear-section-formatting' })
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
      PASTE_COMMAND,
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
            const nonEmptyLines = lines.filter(line => line.trim().length > 0)

            // Create section paragraph nodes for each non-empty line
            const paragraphNodes = nonEmptyLines.map(line => {
              const paragraph = $createSectionParagraphNode()
              const textNode = $createStressedTextNode(line.trim())
              paragraph.append(textNode)
              return paragraph
            })

            // Insert the paragraph nodes
            if (paragraphNodes.length > 0) {
              selection.insertNodes(paragraphNodes)
            }
          }
        }, { tag: 'paste-lyrics-content' })

        return true
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor])

  return null
}

// Plugin to ensure Enter key creates SectionParagraphNodes
function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        if (event && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault() // Prevent the default browser behavior
          // Handle Enter key to create SectionParagraphNodes
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              // Create a new paragraph and properly position cursor
              const newParagraph = $createSectionParagraphNode()
              selection.insertNodes([newParagraph])

              // Ensure the cursor is positioned in the new paragraph
              newParagraph.select()
            }
          }, { tag: 'create-new-paragraph' })
          return true // Prevent default Enter behavior
        }
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor])

  return null
}

// Stress interaction handler is now inline in the main component


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
    editable = true,
  }, ref) => {
    const [showSourceDebug, setShowSourceDebug] = useState(false)
    const editorRef = useRef<LexicalEditor | null>(null)
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrikethrough, setIsStrikethrough] = useState(false)

    // Section formatting state
    const [activeSection, setActiveSection] = useState<string | null>(null)

    // Stress marking context menu state
    const [contextMenu, setContextMenu] = useState<{
      x: number
      y: number
      word: string
      syllableIndex?: number
    } | null>(null)

    // Lexical configuration with custom nodes
    const initialConfig = React.useMemo(() => ({
      namespace: 'RichTextLyricsEditor',
      theme,
      editable,
      nodes: [
        SectionNode,
        SyllableNode,
        RhymeNode,
        SectionParagraphNode,
        SectionTagNode,
        StressedTextNode,
        StressMarkDecoratorNode,
      ],
      onError: (error: Error) => {
        console.error('Lexical error:', error)
      },
    }), [editable])

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
        }, { tag: 'clear-section-formatting-callback' })
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
          }, { tag: 'section-navigation-position-cursor' })

          // Use Lexical's selection system for scrolling instead of direct DOM manipulation
          setTimeout(() => {
            // Scroll via editor's built-in scrolling behavior
            editorRef.current!.update(() => {
              const targetNode = $getNodeByKey(targetNodeKey!)
              if (targetNode) {
                targetNode.selectStart()
              }
            }, { tag: 'section-navigation-scroll-and-select' })

            // Use CSS-based highlighting instead of direct DOM manipulation
            const rootElement = editorRef.current!.getRootElement()
            if (rootElement && targetElement) {
              // Add temporary CSS class via data attribute that CSS can target
              targetElement.setAttribute('data-navigation-highlight', 'true')
              setTimeout(() => {
                targetElement?.removeAttribute('data-navigation-highlight')
              }, 2000)
            }
          }, 100)

          console.log(`Successfully navigated to section: ${sectionName}`)
        } else {
          console.warn(`Could not find section: ${sectionName}`)
          // Fallback: focus the editor and move selection to top
          editorRef.current.focus()
          editorRef.current.update(() => {
            const root = $getRoot()
            const firstChild = root.getFirstChild()
            if (firstChild) {
              firstChild.selectStart()
            }
          }, { tag: 'section-navigation-fallback-select-start' })
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
          }, { tag: 'insert-text-at-cursor' })
        }
      },
      getCurrentCursorPosition: () => {
        // Rich text position is more complex, return 0 for now
        return 0
      },
      setCursorPosition: () => {
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
      wrapSelectedText: () => {
        // TODO: Implement rich text wrapping if needed
      },
      isSourceMode: () => false, // Always false now
      jumpToSection: (sectionName: string) => {
        if (editorRef.current) {
          jumpToSection(sectionName)
        }
      },
      onEditorReady: (callback: () => void) => {
        console.log('🎯 RICH-TEXT-EDITOR: onEditorReady called')

        if (!editorRef.current) {
          console.log('⚠️ RICH-TEXT-EDITOR: No editor ref available')
          return () => {}
        }

        // Use Lexical's built-in editor ready state
        const unregister = editorRef.current.registerUpdateListener(({ editorState }) => {
          console.log('🔄 RICH-TEXT-EDITOR: Update listener fired')

          // This fires when editor is fully initialized with content
          editorState.read(() => {
            const root = $getRoot()
            const childrenSize = root.getChildrenSize()
            console.log('📊 RICH-TEXT-EDITOR: Root children count:', childrenSize)

            if (childrenSize > 0) {
              // Editor has content and is ready
              console.log('✅ RICH-TEXT-EDITOR: Editor is ready with content, calling callback')
              callback()
              unregister() // Only call once
            }
          })
        })

        console.log('🎯 RICH-TEXT-EDITOR: Update listener registered')
        return unregister
      },
    }), [jumpToSection])

    // Store editor reference
    const storeEditorRef = useCallback((editor: LexicalEditor) => {
      editorRef.current = editor
    }, [])

    const minHeight = `${rows * 1.5}rem`

    return (
      <div className={`rich-text-lyrics-editor h-full flex flex-col relative ${className}`} data-testid="lyrics-editor">
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
                enableAutoSave={enableAutoSave && editable}
              />
              <AutoFocusPlugin />
              <SelectionPlugin onSelectionChange={handleSelectionChange} />
              <SectionFormattingPlugin />
              {/* Legacy SectionHeaderPlugin removed */}
              <PastePlugin />
              <EnterKeyPlugin />
              <StableTextToStressedPlugin
                enabled={true}
                debounceMs={500}
              />
              <StressMarkDecoratorPlugin
                enabled={true}
                autoDetectionEnabled={true}
                onStressMarkInteraction={(event) => {
                  setContextMenu({
                    x: event.x,
                    y: event.y,
                    word: event.word,
                    syllableIndex: event.syllableIndex,
                  })
                }}
              />
              <AutoStressDetectionPlugin
                enabled={true}
                debounceMs={300}
              />
              <ComprehensiveStressPlugin
                enabled={false}
              />
              {/* TODO: Re-enable when plugins are fully TypeScript compliant */}
              {/* <SectionDetectionPlugin /> */}
              {/* <ProsodyAnalysisPlugin /> */}
            </div>
          </LexicalComposer>
        </div>

        {/* Stress Context Menu */}
        {contextMenu && (
          <StressContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            word={contextMenu.word}
            syllableIndex={contextMenu.syllableIndex}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Compact Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-1">
          {/* Stress Refresh Button */}
          <button
            onClick={() => {
              if (editorRef.current) {
                console.log('🔄 REFRESH: Clearing all stress data and forcing re-evaluation')
                editorRef.current.update(() => {
                  // Get all StressedTextNodes and convert them back to regular TextNodes
                  const root = $getRoot()
                  const allNodes = root.getAllTextNodes()

                  allNodes.forEach(node => {
                    if ($isStressedTextNode(node)) {
                      // Create a new regular TextNode with the same text content
                      const textContent = node.getTextContent()
                      const newTextNode = $createTextNode(textContent)

                      // Copy formatting
                      newTextNode.setFormat(node.getFormat())
                      newTextNode.setDetail(node.getDetail())
                      newTextNode.setMode(node.getMode())
                      newTextNode.setStyle(node.getStyle())

                      // Replace the StressedTextNode
                      node.replace(newTextNode)
                      console.log(`🔄 REFRESH: Converted StressedTextNode back to TextNode: "${textContent.substring(0, 15)}..."`)
                    }
                  })

                  // Mark content as dirty for re-evaluation in the same update to avoid race conditions
                  const firstChild = root.getFirstChild()
                  if (firstChild) {
                    const key = firstChild.getKey()
                    console.log(`🎯 REFRESH: Marking node ${key} as dirty for re-evaluation`)
                  }
                }, { tag: 'stress-refresh-and-reeval' })
              }
            }}
            className="px-2 py-1 text-xs font-mono rounded transition-all duration-200 bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border border-blue-200/50 hover:border-blue-300/70 backdrop-blur-sm opacity-70 hover:opacity-100"
            title="Clear all stress data and re-evaluate with new function-based detection"
          >
            🔄
          </button>

          {/* View Source Debug Button */}
          <button
            onClick={toggleDebugView}
            className="px-2 py-1 text-xs font-mono rounded transition-all duration-200 bg-white/80 text-neutral-500 hover:text-neutral-700 hover:bg-white/95 border border-neutral-200/50 hover:border-neutral-300/70 backdrop-blur-sm opacity-70 hover:opacity-100"
            title="View Lexical JSON (Debug)"
          >
            {showSourceDebug ? '👁️' : '🔍'}
          </button>
        </div>

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
