import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getRoot, $isElementNode, type LexicalNode, $getSelection, $isRangeSelection, $getNodeByKey } from 'lexical'
import type { StressedTextNode } from '../nodes/StressedTextNode';
import { $isStressedTextNode } from '../nodes/StressedTextNode'
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
  debounceMs = 8000 // Increased to 8 seconds to reduce frequent analysis
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
          // Only log in debug mode to reduce noise
          if (process.env.NODE_ENV === 'development') {
            console.log('🚫 AUTO-DETECT: Deferring analysis - user is actively typing')
          }
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

            // Process each StressedTextNode - but only if it needs analysis
            let processedCount = 0
            nodesToProcess.forEach(node => {
              if (node.isAutoDetectionEnabled() && node.getTextContent().trim()) {
                try {
                  const existingPatterns = node.getAllStressPatterns()
                  const textContent = node.getTextContent()

                  // Check if ALL words have patterns (not just if ANY patterns exist)
                  const words = textContent.trim().split(/\s+/).filter(w => w.length > 0)
                  const wordsNeedingPatterns = words.filter(word => {
                    const cleanWord = word.replace(/[^\w']/g, '').toLowerCase()
                    return cleanWord.length > 2 && !existingPatterns.has(cleanWord)
                  })

                  // Skip if already fully analyzed (all words have patterns)
                  if (existingPatterns.size > 0 && wordsNeedingPatterns.length === 0) {
                    // Only log in debug mode to reduce noise
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`⏭️ AUTO-DETECT: Skipping "${textContent.substring(0, 15)}..." - all ${words.length} words already have patterns`)
                    }
                    return
                  } else if (existingPatterns.size > 0 && wordsNeedingPatterns.length > 0) {
                    console.log(`🔄 AUTO-DETECT: Processing "${textContent.substring(0, 15)}..." - has ${existingPatterns.size} patterns but missing ${wordsNeedingPatterns.length} words: ${wordsNeedingPatterns.join(', ')}`)
                  }

                  // Skip if text appears to already be accented (contains accent marks)
                  const hasAccentMarks = /[áàâäãåēéèêëīíìîïōóòôöõūúùûü]/i.test(textContent)
                  if (hasAccentMarks) {
                    console.log(`⏭️ AUTO-DETECT: Skipping "${textContent.substring(0, 15)}..." - already contains accent marks`)
                    return
                  }

                  // Check word count for timing optimization
                  const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length

                  // Only analyze if no existing patterns and no accent marks
                  const nodeKey = node.getKey()
                  processedCount++

                  // Use different delays based on content length
                  const analysisDelay = wordCount <= 2 ? 200 : 0 // Reduced from 2000ms to 200ms for better responsiveness

                  if (analysisDelay > 0) {
                    console.log(`⏰ AUTO-DETECT: Delaying analysis for short text: "${textContent.substring(0, 25)}..." (${wordCount} words, ${analysisDelay}ms delay)`)
                    setTimeout(() => {
                      // CRITICAL FIX: Perform autoDetectStress inside editor.update() context
                      editor.update(() => {
                        const currentNode = $getNodeByKey(nodeKey)
                        if ($isStressedTextNode(currentNode)) {
                          const writableNode = currentNode.getWritable()
                          writableNode.autoDetectStress().then(() => {
                            console.log(`🎯 AUTO-DETECT: Analyzed (delayed): "${textContent.substring(0, 25)}..."`)
                          }).catch(error => {
                            console.warn('Auto stress detection failed for node:', error)
                          })
                        }
                      }, { tag: 'delayed-auto-stress-detection' })
                    }, analysisDelay)
                  } else {
                    // CRITICAL FIX: Perform autoDetectStress within the same editor.update() context
                    const writableNode = node.getWritable()
                    writableNode.autoDetectStress().then(() => {
                      console.log(`🎯 AUTO-DETECT: Analyzed: "${textContent.substring(0, 25)}..."`)
                    }).catch(error => {
                      console.warn('Auto stress detection failed for node:', error)
                    })
                  }
                } catch (error) {
                  console.warn('Auto stress detection failed for node:', error)
                }
              }
            })

            if (processedCount === 0) {
              console.log('⏭️ AUTO-DETECT: No nodes needed analysis (all already processed)')
            } else {
              console.log(`📊 AUTO-DETECT: Analyzed ${processedCount} of ${nodesToProcess.length} nodes`)
            }
          }, { tag: 'auto-stress-detection' })

          // Restore selection after stress analysis to maintain cursor position
          if (selectionInfo) {
            setTimeout(() => {
              editor.update(() => {
                try {
                  const selection = $getSelection()
                  if ($isRangeSelection(selection)) {
                    // Use public APIs to check if nodes still exist
                    try {
                      const anchorNode = $getNodeByKey(selectionInfo!.anchorKey)
                      const focusNode = $getNodeByKey(selectionInfo!.focusKey)

                      // Only restore selection if the nodes are text nodes or elements that can contain text
                      if (anchorNode && focusNode &&
                          typeof anchorNode.getTextContent === 'function' &&
                          typeof focusNode.getTextContent === 'function') {
                        selection.anchor.set(selectionInfo!.anchorKey, selectionInfo!.anchorOffset, 'text')
                        selection.focus.set(selectionInfo!.focusKey, selectionInfo!.focusOffset, 'text')
                      }
                    } catch (error) {
                      // Node no longer exists, skip restoration
                      console.warn('Selection nodes no longer exist, skipping restoration:', error)
                    }
                  }
                } catch (error) {
                  console.warn('Failed to restore selection after stress analysis:', error)
                }
              }, { tag: 'restore-selection-after-stress-analysis' })
            }, 50)
          }
        })
      }, debounceMs)
    }

    // Register text content change listener
    const removeListener = editor.registerUpdateListener(({ editorState, dirtyLeaves, tags }) => {
      // Only ignore our own auto-stress-detection updates to prevent loops
      if (tags.has('auto-stress-detection')) {
        return
      }

      // Ignore selection-only changes to prevent triggering on cursor movement
      if (tags.has('selection-change-only')) {
        return
      }

      // IMPORTANT: Process stable-text-conversion updates - that's when new StressedTextNodes need analysis!
      if (tags.has('stable-text-conversion')) {
        console.log('🎯 AUTO-DETECT: Processing stable-text-conversion - analyzing newly converted StressedTextNodes')
        triggerAutoDetection()
        return
      }

      // Only trigger if we have actual text content changes, not just selection changes
      let hasTextContentChanges = false

      // Check dirty leaves using read() to access editor state properly
      editorState.read(() => {
        dirtyLeaves.forEach(nodeKey => {
          try {
            const node = $getNodeByKey(nodeKey)
            if ($isStressedTextNode(node)) {
              // Check if the node actually has text content that might need analysis
              const textContent = node.getTextContent()
              if (textContent && textContent.trim().length > 1) {
                hasTextContentChanges = true
              }
            }
          } catch (error) {
            // Node may no longer exist, skip it
            console.warn(`Node ${nodeKey} no longer exists during dirty check`, error)
          }
        })
      })

      if (hasTextContentChanges) {
        console.log('🎯 AUTO-DETECT: Text content changes detected, triggering analysis')
        triggerAutoDetection()
      }
    })

    // Also trigger on initial load if there's content
    const initialTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        // Check if editor has content using public APIs
        editor.getEditorState().read(() => {
          const root = $getRoot()
          const children = root.getChildren()
          if (children.length > 0) {
            // Has content, trigger auto detection
            triggerAutoDetection()
          }
        })
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
