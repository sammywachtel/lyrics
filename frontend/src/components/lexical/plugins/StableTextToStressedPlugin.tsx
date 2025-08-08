import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isTextNode, TextNode } from 'lexical'
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
  debounceMs = 2000 // Wait 2 seconds after changes stop
}: StableTextToStressedPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!enabled) {
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isConverting = false // Prevent overlapping conversions
    const convertedNodeKeys = new Set<string>() // Track converted nodes by key

    const convertStableTextNodes = () => {
      if (isConverting) {
        console.log('🚫 Conversion already in progress, skipping')
        return
      }
      
      isConverting = true
      
      editor.update(() => {
        // Find text nodes in section paragraphs that should be converted
        const nodesToConvert: TextNode[] = []

        function collectTextNodes(node: any) {
          // Only look inside section paragraphs
          if ($isSectionParagraphNode(node)) {
            const children = node.getChildren()
            children.forEach((child: any) => {
              if ($isTextNode(child) && !$isStressedTextNode(child)) {
                const text = child.getTextContent()
                const nodeKey = child.getKey()
                
                // Only convert nodes with substantial text content and not already converted
                if (text.trim().length > 2 && !convertedNodeKeys.has(nodeKey)) {
                  nodesToConvert.push(child)
                }
              }
            })
          } else {
            // Continue traversing other node types
            const children = node.getChildren?.() || []
            children.forEach(collectTextNodes)
          }
        }

        // Start from root and collect text nodes
        const root = editor.getEditorState()._nodeMap.get('root')
        if (root) {
          collectTextNodes(root)
        }

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
            // console.log(`🔄 Converted (${conversionCount}): "${text.substring(0, 15)}..."`);
          } catch (error) {
            console.warn('Failed to convert TextNode to StressedTextNode:', error)
          }
        })
        
        // console.log(`✅ Conversion batch complete: ${conversionCount} nodes`)
      }, { tag: 'stable-text-conversion' })
      
      // Reset conversion flag after a delay
      setTimeout(() => {
        isConverting = false
      }, 1000)
    }

    const scheduleConversion = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // Use requestAnimationFrame to avoid React scheduling conflicts
      timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          convertStableTextNodes()
        })
      }, debounceMs)
    }

    // Listen for editor changes and schedule conversion after stable period
    const removeListener = editor.registerUpdateListener(({ dirtyLeaves }) => {
      // Only react to changes that involve text nodes
      let hasTextChanges = false
      dirtyLeaves.forEach(nodeKey => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey)
        if ($isTextNode(node)) {
          hasTextChanges = true
        }
      })

      if (hasTextChanges) {
        scheduleConversion()
      }
    })

    // Also run an initial conversion after a delay
    const initialTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        convertStableTextNodes()
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