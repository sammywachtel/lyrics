import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getRoot, 
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  $isTextNode
} from 'lexical'
import { useEffect } from 'react'
import { 
  $createSyllableMarkNode, 
  $isSyllableMarkNode, 
  breakIntoSyllables 
} from '../nodes/SyllableMarkNode'

// Command to toggle syllable marking for selected text
export const TOGGLE_SYLLABLE_MARKING_COMMAND = 'TOGGLE_SYLLABLE_MARKING_COMMAND'

// Command to mark syllables for a specific word
export const MARK_WORD_SYLLABLES_COMMAND = 'MARK_WORD_SYLLABLES_COMMAND'

export default function SyllableMarkingPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register command to toggle syllable marking
    const removeToggleCommand = editor.registerCommand(
      TOGGLE_SYLLABLE_MARKING_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            const selectedText = selection.getTextContent()
            
            // Check if selection contains syllable marked nodes
            const nodes = selection.getNodes()
            const hasSyllableMarks = nodes.some(node => $isSyllableMarkNode(node))
            
            if (hasSyllableMarks) {
              // Remove syllable marking - convert back to plain text
              nodes.forEach(node => {
                if ($isSyllableMarkNode(node)) {
                  const textNode = $createTextNode(node.getTextContent())
                  node.replace(textNode)
                }
              })
            } else {
              // Add syllable marking
              const words = selectedText.split(/(\s+)/)
              const syllableNodes: any[] = []
              
              words.forEach(word => {
                if (word.trim()) {
                  // Break word into syllables
                  const syllables = breakIntoSyllables(word.trim())
                  const syllableNode = $createSyllableMarkNode(syllables)
                  syllableNodes.push(syllableNode)
                } else {
                  // Preserve whitespace
                  syllableNodes.push($createTextNode(word))
                }
              })
              
              // Replace selection with syllable nodes
              selection.removeText()
              selection.insertNodes(syllableNodes)
            }
          }
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register command to mark syllables for a specific word
    const removeMarkWordCommand = editor.registerCommand(
      MARK_WORD_SYLLABLES_COMMAND,
      (word: string) => {
        editor.update(() => {
          const syllables = breakIntoSyllables(word)
          const syllableNode = $createSyllableMarkNode(syllables)
          
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertNodes([syllableNode])
          }
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Auto-detect words that could benefit from syllable marking
    const removeAutoDetect = editor.registerTextContentListener((textContent) => {
      // This could be enhanced to automatically suggest syllable marking
      // for complex words or when the user enables auto-syllable mode
    })

    // Register double-click handler for words to quick-mark syllables
    const removeDoubleClickHandler = editor.registerRootListener(
      (rootElement: HTMLElement | null) => {
        if (rootElement) {
          const handleDoubleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            
            // Check if double-clicked on a word (not already syllable-marked)
            if (target.textContent && !target.closest('.syllable-mark-node')) {
              const selection = window.getSelection()
              if (selection && selection.toString().trim()) {
                const selectedWord = selection.toString().trim()
                
                // Only proceed if it's a single word
                if (selectedWord && !selectedWord.includes(' ')) {
                  editor.update(() => {
                    const lexicalSelection = $getSelection()
                    if ($isRangeSelection(lexicalSelection)) {
                      const syllables = breakIntoSyllables(selectedWord)
                      if (syllables.length > 1) {
                        const syllableNode = $createSyllableMarkNode(syllables)
                        lexicalSelection.removeText()
                        lexicalSelection.insertNodes([syllableNode])
                      }
                    }
                  })
                }
              }
            }
          }
          
          rootElement.addEventListener('dblclick', handleDoubleClick)
          
          return () => {
            rootElement.removeEventListener('dblclick', handleDoubleClick)
          }
        }
      }
    )

    return () => {
      removeToggleCommand()
      removeMarkWordCommand()
      removeAutoDetect()
      removeDoubleClickHandler()
    }
  }, [editor])

  return null
}