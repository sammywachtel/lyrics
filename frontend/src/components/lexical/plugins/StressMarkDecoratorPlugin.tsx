import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

// Global flag to ensure only one plugin instance renders overlays
let activePluginId: string | null = null

import {
  $isStressedTextNode,
  type StressPattern,
  type Syllable,
} from '../nodes/StressedTextNode'
import { $isSectionParagraphNode } from '../nodes/SectionParagraphNode'
import { $getRoot, type LexicalNode, $isElementNode } from 'lexical'

interface StressMarkDecoratorPluginProps {
  enabled?: boolean
  autoDetectionEnabled?: boolean
  onStressMarkInteraction?: (event: {
    word: string
    syllableIndex: number
    nodeKey: string
    x: number
    y: number
  }) => void
}

interface StressMarkOverlay {
  nodeKey: string
  word: string
  pattern: StressPattern
  rect: DOMRect
}

/**
 * Plugin that renders stress marks as CSS overlays without fragmenting text
 * This maintains text integrity while providing visual stress indicators
 *
 * Architecture Note:
 * This plugin uses React Portals to render stress marks directly to document.body.
 * This is necessary because the Lexical editor or its containers may have CSS transforms,
 * filters, or other properties that create new stacking contexts, which would break
 * the fixed positioning of stress marks. By using a portal, we ensure stress marks
 * are positioned correctly relative to the viewport while maintaining the plugin's
 * integration with Lexical's update cycle and state management.
 *
 * This approach is compatible with future Lexical features as it:
 * - Doesn't modify the editor's DOM structure
 * - Maintains proper React component lifecycle
 * - Responds correctly to Lexical state updates
 * - Preserves text node integrity for other plugins
 */
export function StressMarkDecoratorPlugin({
  enabled = true,
  onStressMarkInteraction
}: StressMarkDecoratorPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [overlays, setOverlays] = useState<StressMarkOverlay[]>([])
  const [pluginId] = useState(() => Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    console.log(`🎨 STRESS-DECORATOR [${pluginId}]: Plugin mounted, enabled:`, enabled)

    // Track user typing to avoid disrupting focus
    let isUserTyping = false
    let lastUserActivity = 0

    // Add manual trigger for testing - press F1 to force update
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        console.log('🔥 MANUAL TRIGGER: Forcing stress overlay update')
        updateStressOverlays()
        return
      }

      // Track user typing activity
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        isUserTyping = true
        lastUserActivity = Date.now()

        // Mark as not typing after a delay
        setTimeout(() => {
          const timeSinceActivity = Date.now() - lastUserActivity
          if (timeSinceActivity >= 800) {
            isUserTyping = false
          }
        }, 1000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Only allow one plugin instance to be active
    if (!enabled) {
      setOverlays([])
      if (activePluginId === pluginId) {
        activePluginId = null
      }
      return
    }

    if (!activePluginId) {
      activePluginId = pluginId
      console.log(`🏆 STRESS-DECORATOR [${pluginId}]: Became the active plugin`)
    } else if (activePluginId !== pluginId) {
      console.log(`⏸️ STRESS-DECORATOR [${pluginId}]: Another plugin is active (${activePluginId}), staying passive`)
      setOverlays([]) // Clear overlays from inactive plugin
      return
    }

    let updateTimeout: NodeJS.Timeout | null = null
    let scrollTimeout: NodeJS.Timeout | null = null

    const updateStressOverlays = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }

      // Debounce overlay updates to avoid excessive DOM queries
      updateTimeout = setTimeout(() => {
        // Skip overlay updates if user is actively typing to avoid focus interruption
        if (isUserTyping) {
          console.log('🚫 STRESS-DECORATOR: Skipping overlay update - user is typing')
          // Retry after a delay
          setTimeout(updateStressOverlays, 1000)
          return
        }

        requestAnimationFrame(() => {
          const newOverlays: StressMarkOverlay[] = []

          // Simple approach: use viewport coordinates directly

          editor.getEditorState().read(() => {
            const root = $getRoot()

            function processNode(node: LexicalNode) {
              if ($isSectionParagraphNode(node)) {
                const children = node.getChildren()
                children.forEach((child: LexicalNode) => {
                  processTextChild(child)
                })
              } else if (node.getType() === 'paragraph' && $isElementNode(node)) {
                // Also process regular Lexical paragraphs (unsectioned text)
                const children = node.getChildren()
                children.forEach((child: LexicalNode) => {
                  processTextChild(child)
                })
              } else if ($isElementNode(node)) {
                const children = node.getChildren()
                children.forEach(processNode)
              }
            }

            function processTextChild(child: LexicalNode) {
                  const text = child.getTextContent() || 'N/A'
                  if ($isStressedTextNode(child)) {
                    const stressPatterns = child.getAllStressPatterns()
                    console.log(`✅ FOUND: StressedTextNode "${text}" with ${stressPatterns.size} patterns`)
                    if (stressPatterns.size === 0) {
                      console.log(`⚠️  NO PATTERNS: StressedTextNode "${text}" has no stress patterns - needs auto-detection`)
                    }
                  } else {
                    console.log(`❌ SKIP: ${child?.constructor?.name} "${text}" (not StressedTextNode)`)
                  }

                  if ($isStressedTextNode(child)) {
                    const stressPatterns = child.getAllStressPatterns()
                    if (stressPatterns.size > 0) {
                      // Find the DOM element for this node
                      const domElement = editor.getElementByKey(child.getKey())
                      console.log(`🔍 STRESS-DECORATOR: DOM element found:`, !!domElement)
                      if (domElement) {
                        const elementRect = domElement.getBoundingClientRect()
                        console.log(`🔍 STRESS-DECORATOR: Element "${child.getTextContent()}" rect:`, elementRect)
                      }
                      if (domElement) {
                        const text = child.getTextContent()
                        const words = extractWordsWithPositions(text)
                        console.log(`🔍 STRESS-DECORATOR: Found ${words.length} words:`, words.map(w => w.word))

                        words.forEach(({ word, startIndex, endIndex }) => {
                          const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase()
                          const pattern = stressPatterns.get(cleanWord)
                          console.log(`🔍 STRESS-DECORATOR: Word "${cleanWord}" has pattern:`, !!pattern)

                          if (pattern && pattern.syllables.length > 0) {
                            // Calculate word position within the text
                            const rect = getWordRect(domElement, startIndex, endIndex)
                            console.log(`🔍 STRESS-DECORATOR: Word "${cleanWord}" rect:`, rect ? `{left: ${rect.left}, top: ${rect.top}, width: ${rect.width}}` : 'null')
                            if (rect) {
                              // Use viewport coordinates directly (simpler approach)
                              console.log(`📍 VIEWPORT: Using direct coordinates for "${cleanWord}" at (${rect.left}, ${rect.top})`)

                              const isDuplicate = newOverlays.some(existing => {
                                return existing.nodeKey === child.getKey() &&
                                       existing.word === cleanWord &&
                                       Math.abs(existing.rect.left - rect.left) < 5 &&
                                       Math.abs(existing.rect.top - rect.top) < 5
                              })

                              if (!isDuplicate) {
                                newOverlays.push({
                                  nodeKey: child.getKey(),
                                  word: cleanWord,
                                  pattern,
                                  rect
                                })
                                console.log(`✅ OVERLAY: "${cleanWord}" → rect(${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) wordRect should be ${getWordRect(domElement, startIndex, endIndex)?.top.toFixed(1)}`)
                              }
                            }
                          }
                        })
                      }
                    }
                  }
            }

            processNode(root)
          })

          console.log(`🎨 STRESS-DECORATOR [${pluginId}]: Updated overlays:`, newOverlays.length)
          setOverlays(newOverlays)
        })
      }, 500)
    }

    // Listen for editor changes - but only update for meaningful changes
    const removeListener = editor.registerUpdateListener(({ tags }) => {
      // Only update overlays for stress-related changes to reduce interference
      if (tags.has('auto-stress-detection') || tags.has('stable-text-conversion')) {
        console.log('🔄 STRESS-DECORATOR: Stress-related update, updating overlays')
        updateStressOverlays()
      } else if (!tags.has('stress-decorator-update') && !tags.has('history-merge') && !isUserTyping) {
        // Only update for non-history changes when user is not typing
        console.log('🔄 STRESS-DECORATOR: Content change detected, updating overlays')
        updateStressOverlays()
      }
    })

    // Handle scroll events to update overlay positions
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // Debounce scroll updates to avoid excessive recalculations
      scrollTimeout = setTimeout(() => {
        console.log('📜 STRESS-DECORATOR: Scroll detected, updating overlay positions')
        updateStressOverlays()
      }, 50) // Short delay for smooth scrolling
    }

    // Add scroll event listeners to relevant containers
    const editorElement = editor.getRootElement()
    const parentScrollContainer = editorElement?.closest('[class*="overflow"]') // Find scrollable parent

    // Set up ResizeObserver to handle layout changes
    let resizeObserver: ResizeObserver | null = null

    if (editorElement) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      editorElement.addEventListener('scroll', handleScroll, { passive: true })

      if (parentScrollContainer && parentScrollContainer !== editorElement) {
        parentScrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      }

      // Watch for size changes that might affect text positioning
      resizeObserver = new ResizeObserver(() => {
        console.log('📏 STRESS-DECORATOR: Resize detected, updating overlay positions')
        updateStressOverlays()
      })

      resizeObserver.observe(editorElement)
    }

    // Initial overlay update
    updateStressOverlays()

    return () => {
      // Reset active plugin if this was the active one
      if (activePluginId === pluginId) {
        activePluginId = null
        console.log(`🏁 STRESS-DECORATOR [${pluginId}]: Active plugin unmounted, resetting`)
      }

      removeListener()
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // Remove scroll event listeners and ResizeObserver
      if (editorElement) {
        window.removeEventListener('scroll', handleScroll)
        editorElement.removeEventListener('scroll', handleScroll)

        if (parentScrollContainer && parentScrollContainer !== editorElement) {
          parentScrollContainer.removeEventListener('scroll', handleScroll)
        }
      }

      if (resizeObserver) {
        resizeObserver.disconnect()
      }

      document.removeEventListener('keydown', handleKeyDown)

      setOverlays([])
    }
  }, [editor, enabled, pluginId])

  // Create a portal container for stress marks
  // This ensures marks render outside any transformed containers while maintaining proper React lifecycle
  const portalContainer = typeof document !== 'undefined' ? document.body : null

  if (!portalContainer || overlays.length === 0) {
    return null
  }

  // Use React Portal to render stress marks directly to body
  // This avoids CSS transform issues while keeping the plugin architecture clean
  return ReactDOM.createPortal(
    <div
      className="lexical-stress-marks-portal"
      data-lexical-stress-marks="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {overlays.map((overlay, index) => {
        console.log(`🎭 PLUGIN-${pluginId}: Rendering overlay ${index} "${overlay.word}"`)
        return (
          <StressMarkOverlay
            key={`${overlay.nodeKey}-${overlay.word}-${index}`}
            overlay={overlay}
            onInteraction={onStressMarkInteraction}
          />
        )
      })}
    </div>,
    portalContainer
  )
}

/**
 * Individual stress mark overlay component
 */
function StressMarkOverlay({
  overlay,
  onInteraction
}: {
  overlay: StressMarkOverlay
  onInteraction?: StressMarkDecoratorPluginProps['onStressMarkInteraction']
}) {
  const { word, pattern, rect } = overlay

  // Calculate stress mark positions for each syllable

  const stressMarks = pattern.syllables.map((syllable, index) => {
    const mark = syllable.stressed ? '´' : '˘'

    // Calculate the actual position of the vowel within this syllable
    const vowelPosition = findVowelPositionInWord(pattern.syllables, index)

    if (vowelPosition === -1) {
      // Fallback to old method if vowel detection fails
      const syllableWidth = rect.width / pattern.syllables.length
      const x = rect.left + (index * syllableWidth) + (syllableWidth / 2)
      const y = rect.top - 5

      return createStressMarkSpan(mark, x, y, syllable, index, word, overlay, onInteraction)
    }

    // Calculate actual character position within the word
    const charWidth = rect.width / word.length
    const x = rect.left + (vowelPosition * charWidth) + (charWidth / 2)
    const y = rect.top - 5


    return createStressMarkSpan(mark, x, y, syllable, index, word, overlay, onInteraction)
  }).filter(Boolean) // Remove null values from bounds checking

  return <>{stressMarks}</>
}

/**
 * Find the position of the main vowel within a specific syllable of a word
 */
function findVowelPositionInWord(syllables: Syllable[], syllableIndex: number): number {
  if (syllableIndex >= syllables.length) return -1

  const syllable = syllables[syllableIndex]
  if (!syllable) return -1

  // Extract the text from the Syllable object
  const syllableText = typeof syllable === 'string' ? syllable : syllable.text

  // Calculate the start position of this syllable within the word
  const syllableStartPos = syllables.slice(0, syllableIndex).reduce((pos, syl) => {
    const sylText = typeof syl === 'string' ? syl : syl.text
    return pos + sylText.length
  }, 0)

  // Find the primary vowel within the syllable
  const vowelPattern = /[aeiouy]/i
  const vowelMatch = syllableText.match(vowelPattern)

  if (!vowelMatch || vowelMatch.index === undefined) {
    return -1 // No vowel found
  }

  // Return the absolute position within the word
  return syllableStartPos + vowelMatch.index
}

/**
 * Create a stress mark span element
 */
function createStressMarkSpan(
  mark: string,
  x: number,
  y: number,
  syllable: Syllable,
  index: number,
  word: string,
  overlay: StressMarkOverlay,
  onInteraction?: StressMarkDecoratorPluginProps['onStressMarkInteraction']
) {
  return (
    <span
      key={index}
      className="stress-mark"
      style={{
        position: 'fixed', // Fixed positioning relative to viewport
        left: `${x}px`,
        top: `${y}px`,
        fontSize: '12px', // Slightly larger for better visibility
        fontWeight: 'bold',
        color: syllable.stressed ? '#dc2626' : '#6b7280', // Red for stressed, gray for unstressed
        pointerEvents: 'auto',
        cursor: 'pointer',
        zIndex: 1001,
        userSelect: 'none',
        textAlign: 'center',
        transform: 'translateX(-50%)', // Center horizontally on the x coordinate
        backgroundColor: 'transparent', // No background for cleaner look
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' // White shadow for visibility on dark backgrounds
      }}
      onContextMenu={(e) => {
        e.preventDefault() // Prevent browser context menu
        if (onInteraction) {
          // Use right-click coordinates for stress context menu
          onInteraction({
            word,
            syllableIndex: index,
            nodeKey: overlay.nodeKey,
            x: e.clientX,
            y: e.clientY
          })
        }
      }}
      onClick={(e) => {
        // For debugging - left click can also trigger menu
        if (e.shiftKey && onInteraction) {
          onInteraction({
            word,
            syllableIndex: index,
            nodeKey: overlay.nodeKey,
            x: e.clientX,
            y: e.clientY
          })
        }
      }}
    >
      {mark}
    </span>
  )
}

/**
 * Extract words with their positions in the text
 */
interface WordInfo {
  word: string
  startIndex: number
  endIndex: number
}

function extractWordsWithPositions(text: string): WordInfo[] {
  const words: WordInfo[] = []
  const wordRegex = /\b[\w']+\b/g
  let match

  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      word: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return words
}

/**
 * Get the DOM rectangle for a specific word within a text element
 */
function getWordRect(element: Element, startIndex: number, endIndex: number): DOMRect | null {
  try {
    // Create a range for the specific word
    const textNode = element.firstChild
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      console.warn(`getWordRect: No text node found in element`)
      return null
    }

    // Debug: log what we're trying to select
    const fullText = textNode.textContent || ''
    const selectedText = fullText.substring(startIndex, endIndex)
    console.log(`🔍 getWordRect: Selecting "${selectedText}" from "${fullText}" (${startIndex}-${endIndex})`)

    const range = document.createRange()
    range.setStart(textNode, startIndex)
    range.setEnd(textNode, endIndex)

    const rect = range.getBoundingClientRect()
    console.log(`🔍 getWordRect: Range rect for "${selectedText}":`, rect)

    // Also get the full element rect for comparison
    const elementRect = element.getBoundingClientRect()
    console.log(`🔍 getWordRect: Full element rect:`, elementRect)

    range.detach()

    return rect
  } catch (error) {
    console.warn('Failed to get word rect:', error)
    return null
  }
}
