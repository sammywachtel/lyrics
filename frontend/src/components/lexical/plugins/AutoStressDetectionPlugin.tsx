import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $getRoot } from 'lexical'
import { $isStressedTextNode, StressedTextNode } from '../nodes/StressedTextNode'
// import { mergeRegister } from '@lexical/utils'

interface AutoStressDetectionPluginProps {
  enabled?: boolean
  debounceMs?: number
}

/**
 * Plugin that automatically detects stress patterns in StressedTextNodes
 * This runs after text changes and populates stress patterns for visualization
 */
export function AutoStressDetectionPlugin({
  enabled = true,
  debounceMs = 500
}: AutoStressDetectionPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!enabled) {
      return
    }

    let timeoutId: NodeJS.Timeout | null = null

    const triggerAutoDetection = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          editor.update(() => {
          // Find all StressedTextNodes and trigger auto-detection
          const nodesToProcess: StressedTextNode[] = []

          function collectStressedTextNodes(node: any) {
            if ($isStressedTextNode(node)) {
              nodesToProcess.push(node)
            }

            const children = node.getChildren?.() || []
            children.forEach(collectStressedTextNodes)
          }

          // Get the root node and traverse from the current editor state
          const root = $getRoot()
          collectStressedTextNodes(root)

          // Process each StressedTextNode
          nodesToProcess.forEach(node => {
            if (node.isAutoDetectionEnabled() && node.getTextContent().trim()) {
              try {
                const writableNode = node.getWritable()
                writableNode.autoDetectStress()
                // console.log(`🎯 Detected stress for: "${node.getTextContent().substring(0, 15)}..."`)
                // console.log(`📊 Patterns:`, writableNode.getAllStressPatterns().size)
              } catch (error) {
                console.warn('Auto stress detection failed for node:', error)
              }
            }
          })
          }, { tag: 'auto-stress-detection' })
        })
      }, debounceMs)
    }

    // Register text content change listener
    const removeListener = editor.registerUpdateListener(({ editorState, dirtyLeaves }) => {
      // Check if any StressedTextNodes were modified
      let hasStressedTextChanges = false

      dirtyLeaves.forEach(nodeKey => {
        const node = editorState._nodeMap.get(nodeKey)
        if ($isStressedTextNode(node)) {
          hasStressedTextChanges = true
        }
      })

      if (hasStressedTextChanges) {
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
      if (initialTimeout) {
        clearTimeout(initialTimeout)
      }
    }
  }, [editor, enabled, debounceMs])

  return null
}