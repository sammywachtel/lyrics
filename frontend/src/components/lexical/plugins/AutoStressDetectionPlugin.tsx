import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getRoot, $isElementNode, type LexicalNode, $getSelection, $isRangeSelection } from 'lexical'
import { $isStressedTextNode, StressedTextNode } from '../nodes/StressedTextNode'
// import { mergeRegister } from '@lexical/utils'

interface AutoStressDetectionPluginProps {
  enabled?: boolean
  debounceMs?: number
}

/**
 * Plugin that automatically detects stress patterns in StressedTextNodes
 * This runs after text changes and populates stress patterns for visualization
 * Enhanced with focus preservation to avoid cursor interruption during typing
 */
export function AutoStressDetectionPlugin({
  enabled = true,
  debounceMs = 2000 // Increased debounce to be less aggressive
}: AutoStressDetectionPluginProps) {
  const [editor] = useLexicalComposerContext()
  const lastUserActivityRef = useRef<number>(0)
  const isUserTypingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let userActivityTimeout: NodeJS.Timeout | null = null

    // Track user typing activity to avoid interrupting focus
    const trackUserActivity = () => {
      lastUserActivityRef.current = Date.now()
      isUserTypingRef.current = true

      // Clear previous timeout
      if (userActivityTimeout) {
        clearTimeout(userActivityTimeout)
      }

      // Mark as not typing after a short period of inactivity
      userActivityTimeout = setTimeout(() => {
        isUserTypingRef.current = false
      }, 1000)
    }

    // Listen for keyboard events to detect active typing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track actual character input, not navigation keys
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        trackUserActivity()
      }
    }

    const editorElement = editor.getRootElement()
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown)
    }

    const triggerAutoDetection = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        // Check if user is currently typing - if so, defer the update
        const timeSinceLastActivity = Date.now() - lastUserActivityRef.current
        if (isUserTypingRef.current || timeSinceLastActivity < 1500) {
          console.log('🚫 AUTO-DETECT: Deferring analysis - user is actively typing')
          // Retry after user stops typing
          triggerAutoDetection()
          return
        }

        requestAnimationFrame(() => {
          // Preserve current selection before stress analysis
          let selectionInfo: {
            anchorKey: string
            anchorOffset: number
            focusKey: string
            focusOffset: number
          } | null = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selectionInfo = {
                anchorKey: selection.anchor.key,
                anchorOffset: selection.anchor.offset,
                focusKey: selection.focus.key,
                focusOffset: selection.focus.offset
              }
            }
          })

          editor.update(() => {
            // Find all StressedTextNodes and trigger auto-detection
            const nodesToProcess: StressedTextNode[] = []

            function collectStressedTextNodes(node: LexicalNode) {
              if ($isStressedTextNode(node)) {
                nodesToProcess.push(node)
              }

              if ($isElementNode(node)) {
                const children = node.getChildren()
                children.forEach(collectStressedTextNodes)
              }
            }

            // Get the root node and traverse from the current editor state
            const root = $getRoot()
            collectStressedTextNodes(root)

            console.log(`📊 AUTO-DETECT: Starting analysis of ${nodesToProcess.length} StressedTextNodes`)

            // Process each StressedTextNode
            nodesToProcess.forEach(node => {
              if (node.isAutoDetectionEnabled() && node.getTextContent().trim()) {
                try {
                  const existingPatterns = node.getAllStressPatterns()

                  // Capture text content now while we're in editor context
                  const textContent = node.getTextContent()

                  // Check if any existing patterns have user overrides
                  const hasOverrides = Array.from(existingPatterns.values()).some(pattern => pattern.overridden)

                  if (hasOverrides) {
                    console.log(`🛡️ AUTO-DETECT: Skipping "${textContent.substring(0, 15)}..." - contains user overrides`)
                    return
                  }

                  // Only analyze if no user overrides exist
                  const writableNode = node.getWritable()
                  const patternCount = writableNode.getAllStressPatterns().size

                  writableNode.autoDetectStress().then(() => {
                    console.log(`🎯 AUTO-DETECT: Detected stress for: "${textContent.substring(0, 15)}..."`)
                    console.log(`📊 AUTO-DETECT: Patterns:`, patternCount)
                  }).catch(error => {
                    console.warn('Auto stress detection failed for node:', error)
                  })
                } catch (error) {
                  console.warn('Auto stress detection failed for node:', error)
                }
              }
            })
          }, { tag: 'auto-stress-detection' })

          // Restore selection after stress analysis to maintain cursor position
          if (selectionInfo) {
            setTimeout(() => {
              editor.update(() => {
                try {
                  const selection = $getSelection()
                  if ($isRangeSelection(selection)) {
                    // Check if the nodes still exist and are valid for text selection
                    const anchorNode = editor.getEditorState()._nodeMap.get(selectionInfo!.anchorKey)
                    const focusNode = editor.getEditorState()._nodeMap.get(selectionInfo!.focusKey)

                    // Only restore selection if the nodes are text nodes or elements that can contain text
                    if (anchorNode && focusNode &&
                        typeof anchorNode.getTextContent === 'function' &&
                        typeof focusNode.getTextContent === 'function') {
                      selection.anchor.set(selectionInfo!.anchorKey, selectionInfo!.anchorOffset, 'text')
                      selection.focus.set(selectionInfo!.focusKey, selectionInfo!.focusOffset, 'text')
                    }
                  }
                } catch (error) {
                  console.warn('Failed to restore selection after stress analysis:', error)
                }
              })
            }, 50)
          }
        })
      }, debounceMs)
    }

    // Register text content change listener
    const removeListener = editor.registerUpdateListener(({ editorState, dirtyLeaves, tags }) => {
      // Only ignore our own auto-stress-detection updates to prevent loops
      if (tags.has('auto-stress-detection')) {
        console.log('🏷️ AUTO-DETECT: Ignoring own update to prevent loop')
        return
      }

      // IMPORTANT: Process stable-text-conversion updates - that's when new StressedTextNodes need analysis!
      if (tags.has('stable-text-conversion')) {
        console.log('🎯 AUTO-DETECT: Processing stable-text-conversion - analyzing newly converted StressedTextNodes')
        triggerAutoDetection()
        return
      }

      // Check if any StressedTextNodes were modified
      let hasStressedTextChanges = false

      dirtyLeaves.forEach(nodeKey => {
        const node = editorState._nodeMap.get(nodeKey)
        if ($isStressedTextNode(node)) {
          hasStressedTextChanges = true
        }
      })

      if (hasStressedTextChanges) {
        console.log('🎯 AUTO-DETECT: StressedTextNode changes detected, triggering analysis')
        triggerAutoDetection()
      }
    })

    // Also trigger on initial load if there's content
    const initialTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        const editorState = editor.getEditorState()
        if (editorState._nodeMap.size > 1) { // More than just root node
          triggerAutoDetection()
        }
      })
    }, 1000)

    return () => {
      removeListener()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (userActivityTimeout) {
        clearTimeout(userActivityTimeout)
      }
      if (initialTimeout) {
        clearTimeout(initialTimeout)
      }

      // Clean up keyboard event listener
      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor, enabled, debounceMs])

  return null
}
