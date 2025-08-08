import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTextNode, $isTextNode, TextNode } from 'lexical'
import { useEffect } from 'react'
import { 
  StressedTextNode, 
  type StressPattern,
} from '../nodes/StressedTextNode'
import { 
  $createStressMarkDecoratorNode, 
  StressMarkDecoratorNode 
} from '../nodes/StressMarkDecoratorNode'
import { mergeRegister } from '@lexical/utils'

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

/**
 * Plugin that converts StressedTextNodes into visual StressMarkDecoratorNodes
 * This provides proper separation between text editing and stress visualization
 */
export function StressMarkDecoratorPlugin({
  enabled = true,
  autoDetectionEnabled = true,
  onStressMarkInteraction
}: StressMarkDecoratorPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!enabled) {
      return
    }
    
    let removeTransform: (() => void) | null = null
    let handleStressMarkEvent: ((event: Event) => void) | null = null
    
    // Defer registration to avoid React scheduling conflicts
    const registrationTimeout = setTimeout(() => {
      removeTransform = mergeRegister(
      // Transform StressedTextNodes with stress patterns into decorators
      editor.registerNodeTransform(StressedTextNode, (node: StressedTextNode) => {
        if (!enabled) return

        // Check if this node has already been processed to prevent loops
        if ((node as any).__decoratorProcessed) {
          return
        }

        const stressPatterns = node.getAllStressPatterns()
        if (stressPatterns.size === 0) return

        const text = node.getTextContent()
        const words = extractWords(text)
        
        // If this text node contains words with stress patterns, convert to decorators
        const hasStressMarks = words.some(({ word }) => {
          const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase()
          return stressPatterns.has(cleanWord)
        })
        
        if (!hasStressMarks) {
          return
        }
        
        // console.log(`🎨 Creating decorators for: "${text.substring(0, 15)}..." with ${stressPatterns.size} patterns`);
        
        // Mark this node as processed
        (node as any).__decoratorProcessed = true;
        
        // Create a sequence of text nodes and decorator nodes
        const replacementNodes = createReplacementNodes(text, words, stressPatterns, node)
        
        if (replacementNodes.length > 0) {
          // Replace the stressed text node with the sequence
          // Use explicit types for TypeScript compatibility
          if (replacementNodes.length === 1) {
            node.replace(replacementNodes[0])
          } else {
            // For multiple nodes, insert them one by one
            let currentNode: typeof node | typeof replacementNodes[0] = node
            for (let i = 0; i < replacementNodes.length; i++) {
              if (i === 0) {
                currentNode = node.replace(replacementNodes[i])
              } else {
                currentNode = currentNode.insertAfter(replacementNodes[i])
              }
            }
          }
        }
      }),

      // Clean up orphaned decorator nodes when text changes
      editor.registerNodeTransform(StressMarkDecoratorNode, (node: StressMarkDecoratorNode) => {
        const parent = node.getParent()
        if (!parent) return

        // Check if the word still exists in nearby text
        const siblings = parent.getChildren()
        const textContent = siblings
          .filter((n): n is TextNode => $isTextNode(n))
          .map(n => n.getTextContent())
          .join('')

        const word = node.getWord().toLowerCase()
        if (!textContent.toLowerCase().includes(word)) {
          // Word no longer exists, remove the decorator
          node.remove()
        }
      })
    )

      // Listen for stress mark interactions
      handleStressMarkEvent = (event: Event) => {
        if (!onStressMarkInteraction) return

        const customEvent = event as CustomEvent
        const { word, syllableIndex, nodeKey, x, y } = customEvent.detail

        onStressMarkInteraction({ word, syllableIndex, nodeKey, x, y })
      }

      // Add event listeners for stress mark interactions
      const rootElement = editor.getRootElement()
      if (rootElement && onStressMarkInteraction) {
        rootElement.addEventListener('stressMarkClick', handleStressMarkEvent)
        rootElement.addEventListener('stressMarkContextMenu', handleStressMarkEvent)
      }
    }, 0) // Defer to next tick

    return () => {
      clearTimeout(registrationTimeout)
      if (removeTransform) {
        removeTransform()
      }
      const rootElement = editor.getRootElement()
      if (rootElement && handleStressMarkEvent) {
        rootElement.removeEventListener('stressMarkClick', handleStressMarkEvent)
        rootElement.removeEventListener('stressMarkContextMenu', handleStressMarkEvent)
      }
    }
  }, [editor, enabled, autoDetectionEnabled, onStressMarkInteraction])

  return null
}

/**
 * Extract words and their positions from text
 */
interface WordInfo {
  word: string
  startIndex: number
  endIndex: number
}

function extractWords(text: string): WordInfo[] {
  const words: WordInfo[] = []
  const wordRegex = /\b[\w']+\b/g
  let match

  while ((match = wordRegex.exec(text)) !== null) {
    // Clean the word for pattern matching (remove punctuation, convert to lowercase)
    const cleanWord = match[0].replace(/[^a-zA-Z']/g, '').toLowerCase()
    if (cleanWord.length > 0) {
      words.push({
        word: match[0], // Keep original word for display
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return words
}

/**
 * Create replacement nodes (mix of text and decorators) for a stressed text node
 */
function createReplacementNodes(
  originalText: string,
  words: WordInfo[],
  stressPatterns: Map<string, StressPattern>,
  originalNode: StressedTextNode
) {
  const replacementNodes = []
  let currentIndex = 0

  for (const wordInfo of words) {
    const { word, startIndex, endIndex } = wordInfo
    const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase()
    const pattern = stressPatterns.get(cleanWord)

    // Add any text before this word
    if (startIndex > currentIndex) {
      const beforeText = originalText.slice(currentIndex, startIndex)
      if (beforeText) {
        const textNode = $createTextNode(beforeText)
        // Copy formatting from original node
        textNode.setFormat(originalNode.getFormat())
        textNode.setDetail(originalNode.getDetail())
        textNode.setMode(originalNode.getMode())
        textNode.setStyle(originalNode.getStyle())
        replacementNodes.push(textNode)
      }
    }

    if (pattern) {
      // Create stress decorator for this word
      const decoratorNode = $createStressMarkDecoratorNode(word, pattern)
      replacementNodes.push(decoratorNode)
    } else {
      // Create regular text node for words without stress patterns
      const wordTextNode = $createTextNode(word)
      // Copy formatting from original node
      wordTextNode.setFormat(originalNode.getFormat())
      wordTextNode.setDetail(originalNode.getDetail())
      wordTextNode.setMode(originalNode.getMode())
      wordTextNode.setStyle(originalNode.getStyle())
      replacementNodes.push(wordTextNode)
    }

    currentIndex = endIndex
  }

  // Add any remaining text after the last word
  if (currentIndex < originalText.length) {
    const afterText = originalText.slice(currentIndex)
    if (afterText) {
      const textNode = $createTextNode(afterText)
      // Copy formatting from original node
      textNode.setFormat(originalNode.getFormat())
      textNode.setDetail(originalNode.getDetail())
      textNode.setMode(originalNode.getMode())
      textNode.setStyle(originalNode.getStyle())
      replacementNodes.push(textNode)
    }
  }

  return replacementNodes
}