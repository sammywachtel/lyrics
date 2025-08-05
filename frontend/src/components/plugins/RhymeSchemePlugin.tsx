import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getRoot, 
  COMMAND_PRIORITY_EDITOR,
  $isTextNode
} from 'lexical'
import { useEffect, useCallback, useState } from 'react'
import { 
  $createRhymeSchemeNode, 
  $isRhymeSchemeNode, 
  detectRhymeSound,
  assignRhymeLetter
} from '../nodes/RhymeSchemeNode'
import { $isProsodyLineNode } from '../nodes/ProsodyLineNode'

// Command to analyze rhyme scheme for the entire document
export const ANALYZE_RHYME_SCHEME_COMMAND = 'ANALYZE_RHYME_SCHEME_COMMAND'

// Command to toggle rhyme scheme analysis
export const TOGGLE_RHYME_SCHEME_COMMAND = 'TOGGLE_RHYME_SCHEME_COMMAND'

// Command to manually assign rhyme letter to a line
export const ASSIGN_RHYME_LETTER_COMMAND = 'ASSIGN_RHYME_LETTER_COMMAND'

interface LineEndingData {
  lineNumber: number
  word: string
  rhymeSound: string
  paragraph: any
}

export default function RhymeSchemePlugin(): null {
  const [editor] = useLexicalComposerContext()
  const [rhymeMap, setRhymeMap] = useState<Map<string, string>>(new Map())
  const [rhymeSchemeEnabled, setRhymeSchemeEnabled] = useState(false)

  const extractLineEndings = useCallback((): LineEndingData[] => {
    const lineEndings: LineEndingData[] = []
    
    editor.getEditorState().read(() => {
      const root = $getRoot()
      const children = root.getChildren()
      let lineNumber = 1
      
      children.forEach((child) => {
        if (child.getType() === 'paragraph') {
          const textContent = child.getTextContent().trim()
          
          // Skip empty lines and section tags
          if (!textContent || textContent.match(/^\[.*\]$/)) {
            return
          }
          
          // Extract the last word of the line
          const words = textContent.split(/\s+/)
          const lastWord = words[words.length - 1]?.replace(/[.,!?;:]$/, '') // Remove punctuation
          
          if (lastWord) {
            const rhymeSound = detectRhymeSound(lastWord)
            lineEndings.push({
              lineNumber,
              word: lastWord,
              rhymeSound,
              paragraph: child
            })
          }
          
          lineNumber++
        }
      })
    })
    
    return lineEndings
  }, [editor])

  const analyzeRhymeScheme = useCallback(() => {
    const lineEndings = extractLineEndings()
    const newRhymeMap = new Map<string, string>()
    
    // Group lines by rhyme sound and assign letters
    const rhymeSoundGroups = new Map<string, LineEndingData[]>()
    
    lineEndings.forEach(line => {
      if (!rhymeSoundGroups.has(line.rhymeSound)) {
        rhymeSoundGroups.set(line.rhymeSound, [])
      }
      rhymeSoundGroups.get(line.rhymeSound)!.push(line)
    })
    
    // Assign rhyme letters based on first appearance
    const sortedGroups = Array.from(rhymeSoundGroups.entries()).sort(
      ([, a], [, b]) => a[0].lineNumber - b[0].lineNumber
    )
    
    sortedGroups.forEach(([rhymeSound, lines]) => {
      // Only assign letters to sounds that appear in multiple lines
      if (lines.length > 1) {
        const rhymeLetter = assignRhymeLetter(rhymeSound, newRhymeMap)
        newRhymeMap.set(rhymeSound, rhymeLetter)
      }
    })
    
    setRhymeMap(newRhymeMap)
    
    // Update the editor with rhyme scheme nodes
    editor.update(() => {
      lineEndings.forEach((line) => {
        const rhymeLetter = newRhymeMap.get(line.rhymeSound)
        
        if (rhymeLetter) {
          // Check if this paragraph already has a rhyme scheme node
          const hasRhymeNode = line.paragraph.getChildren().some((node: any) => $isRhymeSchemeNode(node))
          
          if (!hasRhymeNode) {
            // Add rhyme scheme node to the end of the paragraph
            const rhymeNode = $createRhymeSchemeNode(rhymeLetter, line.rhymeSound)
            line.paragraph.append(rhymeNode)
          }
        }
      })
    })
  }, [editor, extractLineEndings])

  const removeRhymeScheme = useCallback(() => {
    editor.update(() => {
      const root = $getRoot()
      const children = root.getChildren()
      
      children.forEach((child) => {
        if (child.getType() === 'paragraph') {
          const rhymeNodes = child.getChildren().filter((node: any) => $isRhymeSchemeNode(node))
          rhymeNodes.forEach((rhymeNode: any) => {
            rhymeNode.remove()
          })
        }
      })
    })
    
    setRhymeMap(new Map())
  }, [editor])

  useEffect(() => {
    // Register command to analyze rhyme scheme
    const removeAnalyzeCommand = editor.registerCommand(
      ANALYZE_RHYME_SCHEME_COMMAND,
      () => {
        analyzeRhymeScheme()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register command to toggle rhyme scheme analysis
    const removeToggleCommand = editor.registerCommand(
      TOGGLE_RHYME_SCHEME_COMMAND,
      () => {
        const newEnabled = !rhymeSchemeEnabled
        setRhymeSchemeEnabled(newEnabled)
        
        if (newEnabled) {
          analyzeRhymeScheme()
        } else {
          removeRhymeScheme()
        }
        
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register command to manually assign rhyme letter
    const removeAssignCommand = editor.registerCommand(
      ASSIGN_RHYME_LETTER_COMMAND,
      ({ lineNumber, rhymeLetter }: { lineNumber: number; rhymeLetter: string }) => {
        // This could be used for manual rhyme scheme correction
        console.log(`Manually assigning rhyme letter ${rhymeLetter} to line ${lineNumber}`)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Auto-analyze rhyme scheme when content changes (debounced)
    let rhymeAnalysisTimeout: NodeJS.Timeout | null = null
    
    const removeContentListener = editor.registerTextContentListener((textContent) => {
      if (rhymeSchemeEnabled) {
        // Debounce analysis to avoid excessive computation
        if (rhymeAnalysisTimeout) {
          clearTimeout(rhymeAnalysisTimeout)
        }
        
        rhymeAnalysisTimeout = setTimeout(() => {
          // Remove existing rhyme nodes first
          removeRhymeScheme()
          // Then re-analyze
          setTimeout(() => {
            analyzeRhymeScheme()
          }, 100)
        }, 1500) // Wait 1.5 seconds after user stops typing
      }
    })

    return () => {
      removeAnalyzeCommand()
      removeToggleCommand()
      removeAssignCommand()
      removeContentListener()
      
      if (rhymeAnalysisTimeout) {
        clearTimeout(rhymeAnalysisTimeout)
      }
    }
  }, [editor, rhymeSchemeEnabled, analyzeRhymeScheme, removeRhymeScheme])

  // Provide rhyme scheme data to other components
  useEffect(() => {
    // This could be used to update a rhyme scheme visualization panel
    if (rhymeMap.size > 0) {
      console.log('Current rhyme scheme:', Object.fromEntries(rhymeMap))
    }
  }, [rhymeMap])

  return null
}