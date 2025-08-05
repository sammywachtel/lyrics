import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getRoot, 
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  $isTextNode
} from 'lexical'
import { useEffect, useCallback } from 'react'
import { 
  $createProsodyLineNode, 
  $isProsodyLineNode, 
  analyzeProsody,
  type ProsodyData
} from '../nodes/ProsodyLineNode'

// Command to analyze prosody for the entire document
export const ANALYZE_PROSODY_COMMAND = 'ANALYZE_PROSODY_COMMAND'

// Command to analyze prosody for a specific line
export const ANALYZE_LINE_PROSODY_COMMAND = 'ANALYZE_LINE_PROSODY_COMMAND'

// Command to toggle prosody analysis mode
export const TOGGLE_PROSODY_ANALYSIS_COMMAND = 'TOGGLE_PROSODY_ANALYSIS_COMMAND'

export default function ProsodyAnalysisPlugin(): null {
  const [editor] = useLexicalComposerContext()

  const analyzeDocumentProsody = useCallback(() => {
    editor.update(() => {
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
          
          // Check if this line is already a prosody node
          const isProsodyLine = child.getChildren().some(node => $isProsodyLineNode(node))
          
          if (!isProsodyLine && textContent) {
            // Analyze the prosody of this line
            const prosodyData = analyzeProsody(textContent)
            
            // Create prosody line node
            const prosodyNode = $createProsodyLineNode(textContent, lineNumber, prosodyData)
            
            // Replace the paragraph content with the prosody node
            child.clear()
            child.append(prosodyNode)
            
            lineNumber++
          }
        }
      })
    })
  }, [editor])

  const removeProsodyAnalysis = useCallback(() => {
    editor.update(() => {
      const root = $getRoot()
      const children = root.getChildren()
      
      children.forEach((child) => {
        if (child.getType() === 'paragraph') {
          const prosodyNodes = child.getChildren().filter(node => $isProsodyLineNode(node))
          
          prosodyNodes.forEach((prosodyNode) => {
            if ($isProsodyLineNode(prosodyNode)) {
              // Replace prosody node with plain text
              const textContent = prosodyNode.getLineText()
              child.clear()
              
              // Add text nodes for the content
              const textParts = textContent.split(' ')
              textParts.forEach((part, index) => {
                child.append($createTextNode(part))
                if (index < textParts.length - 1) {
                  child.append($createTextNode(' '))
                }
              })
            }
          })
        }
      })
    })
  }, [editor])

  useEffect(() => {
    let prosodyAnalysisEnabled = false

    // Register command to analyze prosody for entire document
    const removeAnalyzeCommand = editor.registerCommand(
      ANALYZE_PROSODY_COMMAND,
      () => {
        analyzeDocumentProsody()
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register command to analyze prosody for a specific line
    const removeAnalyzeLineCommand = editor.registerCommand(
      ANALYZE_LINE_PROSODY_COMMAND,
      (lineText: string) => {
        editor.update(() => {
          const prosodyData = analyzeProsody(lineText)
          // This could be used to update a specific line's analysis
          console.log('Line prosody analysis:', prosodyData)
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register command to toggle prosody analysis mode
    const removeToggleCommand = editor.registerCommand(
      TOGGLE_PROSODY_ANALYSIS_COMMAND,
      () => {
        prosodyAnalysisEnabled = !prosodyAnalysisEnabled
        
        if (prosodyAnalysisEnabled) {
          analyzeDocumentProsody()
        } else {
          removeProsodyAnalysis()
        }
        
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Auto-analyze prosody when content changes (debounced)
    let analysisTimeout: NodeJS.Timeout | null = null
    
    const removeContentListener = editor.registerTextContentListener((textContent) => {
      if (prosodyAnalysisEnabled) {
        // Debounce analysis to avoid excessive computation
        if (analysisTimeout) {
          clearTimeout(analysisTimeout)
        }
        
        analysisTimeout = setTimeout(() => {
          analyzeDocumentProsody()
        }, 1000) // Wait 1 second after user stops typing
      }
    })

    // Register mutation listener to update line numbers when content changes
    const removeMutationListener = editor.registerMutationListener(
      (mutatedNodes) => {
        if (prosodyAnalysisEnabled) {
          let needsReNumbering = false
          
          // Check if any prosody nodes were added/removed
          for (const [nodeKey, mutation] of mutatedNodes) {
            if (mutation === 'created' || mutation === 'destroyed') {
              const node = editor.getEditorState()._nodeMap.get(nodeKey)
              if (node && $isProsodyLineNode(node)) {
                needsReNumbering = true
                break
              }
            }
          }
          
          if (needsReNumbering) {
            // Re-number all prosody lines
            setTimeout(() => {
              editor.update(() => {
                const root = $getRoot()
                const children = root.getChildren()
                let lineNumber = 1
                
                children.forEach((child) => {
                  if (child.getType() === 'paragraph') {
                    const prosodyNodes = child.getChildren().filter(node => $isProsodyLineNode(node))
                    
                    prosodyNodes.forEach((prosodyNode) => {
                      if ($isProsodyLineNode(prosodyNode)) {
                        prosodyNode.setLineNumber(lineNumber)
                        lineNumber++
                      }
                    })
                  }
                })
              })
            }, 100)
          }
        }
      }
    )

    return () => {
      removeAnalyzeCommand()
      removeAnalyzeLineCommand()
      removeToggleCommand()
      removeContentListener()
      removeMutationListener()
      
      if (analysisTimeout) {
        clearTimeout(analysisTimeout)
      }
    }
  }, [editor, analyzeDocumentProsody, removeProsodyAnalysis])

  return null
}