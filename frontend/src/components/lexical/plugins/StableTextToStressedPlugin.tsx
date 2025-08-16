import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TextNode} from 'lexical';
import { $isTextNode, $isElementNode, type LexicalNode, $getNodeByKey, $getRoot } from 'lexical'
import { useEffect } from 'react'
import { $createStressedTextNode, $isStressedTextNode } from '../nodes/StressedTextNode'
import { $isSectionParagraphNode } from '../nodes/SectionParagraphNode'

interface StableTextToStressedPluginProps {
  enabled?: boolean
  debounceMs?: number
}

/**
 * Plugin that converts stable TextNodes to StressedTextNodes for analysis
 * Only transforms text nodes that haven't changed for a while to avoid disrupting typing
 */
export function StableTextToStressedPlugin({
  enabled = true,
  debounceMs = 500 // Reduced from 2000ms for better responsiveness
}: StableTextToStressedPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) console.log('🚀 STABLE-PLUGIN: Plugin mounted, enabled:', enabled, 'debounceMs:', debounceMs)
    if (!enabled) {
      if (isDev) console.log('🚫 STABLE-PLUGIN: Plugin disabled')
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isConverting = false // Prevent overlapping conversions
    const convertedNodeKeys = new Set<string>() // Track converted nodes by key

    const convertStableTextNodes = () => {
      console.log('🔄 STABLE-PLUGIN: Starting analysis and conversion process...')
      if (isConverting) {
        console.log('🔄 STABLE-PLUGIN: Conversion already in progress, will reschedule after current conversion')
        // Schedule another conversion after current one finishes instead of skipping
        setTimeout(() => {
          console.log('🔄 STABLE-PLUGIN: Rescheduling conversion after current one finished')
          scheduleConversion()
        }, 1100) // Wait slightly longer than the isConverting reset (1000ms)
        return
      }

      isConverting = true

      editor.update(() => {
        // Find text nodes in section paragraphs that should be converted
        const nodesToConvert: TextNode[] = []
        let stressedNodesNeedingAnalysis = 0

        function collectTextNodes(node: LexicalNode) {
          // Look inside section paragraphs AND regular paragraphs
          if ($isSectionParagraphNode(node)) {
            const children = node.getChildren()
            console.log('🔍 STABLE-PLUGIN: Section paragraph children:', children.map((c: LexicalNode) => ({
              type: c.getType(),
              isText: $isTextNode(c),
              isStressed: $isStressedTextNode(c),
              content: c.getTextContent?.()?.substring(0, 15) + '...'
            })))
            processChildren(children)
          } else if (node.getType?.() === 'paragraph' && $isElementNode(node)) {
            // Also process regular Lexical paragraphs (unsectioned text)
            const children = node.getChildren()
            console.log('🔍 STABLE-PLUGIN: Regular paragraph children:', children.map((c: LexicalNode) => ({
              type: c.getType(),
              isText: $isTextNode(c),
              isStressed: $isStressedTextNode(c),
              content: c.getTextContent?.()?.substring(0, 15) + '...'
            })))
            processChildren(children)
          } else if ($isElementNode(node)) {
            // Continue traversing other node types
            const children = node.getChildren()
            children.forEach(collectTextNodes)
          }
        }

        function processChildren(children: LexicalNode[]) {
          children.forEach((child: LexicalNode) => {
            if ($isTextNode(child) && !$isStressedTextNode(child)) {
                const text = child.getTextContent()
                const nodeKey = child.getKey()

                // Only convert nodes with substantial text content and not already converted
                if (text.trim().length > 2 && !convertedNodeKeys.has(nodeKey)) {
                  nodesToConvert.push(child)
                }
              } else if ($isStressedTextNode(child)) {
                // Check StressedTextNodes that might need stress pattern analysis
                const text = child.getTextContent()
                const patterns = child.getAllStressPatterns()
                const nodeKey = child.getKey()

                // Analyze StressedTextNodes that:
                // 1. Have substantial content (>2 chars)
                // 2. Have 0 stress patterns OR patterns for words that don't match current content
                const words = text.split(/\s+/).filter(w => w.trim().length > 0)
                const wordsNeedingPatterns = words.filter(word => {
                  const cleanWord = word.replace(/[^\w']/g, '').toLowerCase()
                  return cleanWord.length > 2 && !patterns.has(cleanWord)
                })

                if (text.trim().length > 2 && (patterns.size === 0 || wordsNeedingPatterns.length > 0)) {
                  console.log(`🔍 STABLE-PLUGIN: Found StressedTextNode "${text.substring(0, 15)}..." needing analysis (${wordsNeedingPatterns.length} words without patterns)`)
                  // Mark as processed to trigger auto-detection
                  convertedNodeKeys.add(nodeKey)
                  stressedNodesNeedingAnalysis++
                }
              }
          })
        }

        // Start from root and collect text nodes
        const root = $getRoot()
        console.log('🌳 STABLE-PLUGIN: Root node found:', !!root)
        if (root) {
          collectTextNodes(root)
        }

        console.log('📊 STABLE-PLUGIN: Found', nodesToConvert.length, 'text nodes to convert')
        console.log('🔍 STABLE-PLUGIN: Found', stressedNodesNeedingAnalysis, 'StressedTextNodes needing analysis')

        // Convert each text node to a stressed text node
        let conversionCount = 0
        nodesToConvert.forEach(textNode => {
          try {
            const text = textNode.getTextContent()
            const nodeKey = textNode.getKey()

            // Skip if text is too short or already converted
            if (text.trim().length < 3) {
              return
            }

            const stressedNode = $createStressedTextNode(text)

            // Copy all formatting
            stressedNode.setFormat(textNode.getFormat())
            stressedNode.setDetail(textNode.getDetail())
            stressedNode.setMode(textNode.getMode())
            stressedNode.setStyle(textNode.getStyle())

            // Mark as converted BEFORE replacement to prevent re-processing
            convertedNodeKeys.add(nodeKey)

            // Replace the text node
            textNode.replace(stressedNode)

            conversionCount++
            console.log(`🔄 STABLE-PLUGIN: Converted (${conversionCount}): "${text.substring(0, 15)}..."`);
          } catch (error) {
            console.warn('Failed to convert TextNode to StressedTextNode:', error)
          }
        })

        console.log(`✅ STABLE-PLUGIN: Process complete: ${conversionCount} nodes converted, ${stressedNodesNeedingAnalysis} nodes marked for analysis`)

        // If we found any nodes needing work, trigger the update
        if (stressedNodesNeedingAnalysis > 0 || conversionCount > 0) {
          console.log(`🎯 STABLE-PLUGIN: Triggering analysis for ${conversionCount} new + ${stressedNodesNeedingAnalysis} existing StressedTextNodes`)
        }
      }, { tag: 'stable-text-conversion' })

      // Reset conversion flag after a delay
      setTimeout(() => {
        isConverting = false
      }, 1000)
    }

    const scheduleConversion = () => {
      console.log('⏱️ STABLE-PLUGIN: Scheduling conversion in', debounceMs, 'ms')
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Use requestAnimationFrame to avoid React scheduling conflicts
      timeoutId = setTimeout(() => {
        console.log('⏰ STABLE-PLUGIN: Timeout fired, starting conversion')
        requestAnimationFrame(() => {
          convertStableTextNodes()
        })
      }, debounceMs)
    }

    // Listen for editor changes and schedule conversion after stable period
    const removeListener = editor.registerUpdateListener(({ dirtyLeaves, tags }) => {
      // Ignore our own conversion updates
      if (tags.has('stable-text-conversion')) {
        console.log('🏷️ STABLE-PLUGIN: Ignoring our own conversion update')
        return
      }

      // React to ANY content changes (not just TextNodes)
      // This includes typing within existing StressedTextNodes
      let hasContentChanges = false

      if (dirtyLeaves.size > 0) {
        // CRITICAL FIX: Wrap $getNodeByKey in editor.read() to comply with Lexical state management
        hasContentChanges = editor.getEditorState().read(() => {
          let changes = false
          dirtyLeaves.forEach(nodeKey => {
            const node = $getNodeByKey(nodeKey)
            // Check for any text-containing nodes (TextNode or StressedTextNode)
            if ($isTextNode(node) || $isStressedTextNode(node)) {
              changes = true
            }
          })
          return changes
        })
      }

      if (hasContentChanges) {
        console.log('📝 STABLE-PLUGIN: Content changes detected, scheduling analysis')
        scheduleConversion()
      }
    })

    // Also run an initial conversion after a delay
    console.log('🏁 STABLE-PLUGIN: Setting up initial conversion in 100ms')
    const initialTimeout = setTimeout(() => {
      console.log('🏁 STABLE-PLUGIN: Initial timeout fired')
      requestAnimationFrame(() => {
        convertStableTextNodes()
      })
    }, 100)

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
