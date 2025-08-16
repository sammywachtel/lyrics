import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'
import { $getRoot, $isParagraphNode, type LexicalNode, $isElementNode } from 'lexical'
import { $isSectionParagraphNode } from '../nodes/SectionParagraphNode'
import { $isStressedTextNode } from '../nodes/StressedTextNode'
import { createPortal } from 'react-dom'

interface ComprehensiveStressPluginProps {
  enabled?: boolean
}

interface LineAnalysisFromNodes {
  text: string
  lineNumber: number
  totalSyllables: number
  stressedSyllables: number
  element: HTMLElement
  hasData: boolean
}

/**
 * Plugin that displays comprehensive syllable counts by reading from existing StressedTextNodes.
 * This avoids duplicate API calls by reusing the stress patterns already detected by AutoStressDetectionPlugin.
 * It simply reads the syllable data from the nodes and displays it as overlays.
 */
export function ComprehensiveStressPlugin({
  enabled = true
}: ComprehensiveStressPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [lineAnalyses, setLineAnalyses] = useState<LineAnalysisFromNodes[]>([])

  // Only log initialization once in debug mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 COMPREHENSIVE-STRESS: Plugin initialized, enabled:', enabled)
  }

  useEffect(() => {
    if (!enabled) {
      setLineAnalyses([])
      return
    }

    const updateStressAnalysis = () => {
      const rootElement = editor.getRootElement()
      if (!rootElement) return

      editor.read(() => {
        const lines: LineAnalysisFromNodes[] = []
        const root = $getRoot()
        let lineNumber = 0

        // Extract syllable counts from existing StressedTextNodes
        function processNode(node: LexicalNode) {
          if ($isSectionParagraphNode(node) || $isParagraphNode(node)) {
            const textContent = node.getTextContent().trim()
            if (textContent) {
              lineNumber++

              // Count syllables from StressedTextNodes within this paragraph
              let totalSyllables = 0
              let stressedSyllables = 0
              let hasData = false

              // Check children for StressedTextNodes
              const children = node.getChildren()
              children.forEach(child => {
                if ($isStressedTextNode(child)) {
                  const stressPatterns = child.getAllStressPatterns()

                  // Count syllables from all words in this node
                  stressPatterns.forEach((pattern) => {
                    if (pattern.syllables && pattern.syllables.length > 0) {
                      hasData = true
                      pattern.syllables.forEach(syllable => {
                        totalSyllables++
                        if (syllable.stressed) {
                          stressedSyllables++
                        }
                      })
                    }
                  })
                }
              })

              // Only add lines that have stress data
              if (hasData) {
                const nodeKey = node.getKey()
                const domElement = editor.getElementByKey(nodeKey)

                if (domElement) {
                  lines.push({
                    text: textContent,
                    lineNumber,
                    totalSyllables,
                    stressedSyllables,
                    element: domElement as HTMLElement,
                    hasData
                  })
                  // Only log in debug mode to reduce noise
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`📊 Line ${lineNumber}: "${textContent.substring(0, 25)}..." - ${stressedSyllables}/${totalSyllables} syllables`)
                  }
                }
              }
            }
          }

          // Recurse through children
          if ($isElementNode(node)) {
            const children = node.getChildren()
            children.forEach(processNode)
          }
        }

        processNode(root)

        // Only log when the count changes to reduce noise
        if (lines.length !== lineAnalyses.length) {
          console.log(`📈 COMPREHENSIVE-STRESS: Found ${lines.length} lines with stress data (was ${lineAnalyses.length})`)
        }

        setLineAnalyses(lines)
      })
    }

    // Initial update
    updateStressAnalysis()

    // Update on any editor changes with debouncing
    let timeoutId: NodeJS.Timeout | null = null
    const debouncedUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        updateStressAnalysis()
      }, 500) // Shorter debounce since we're just reading data, not making API calls
    }

    const removeListener = editor.registerUpdateListener(({ tags }) => {
      // Trigger update on various changes, especially after stress detection
      if (tags.has('auto-stress-detection') || tags.has('history-push') || tags.has('collaboration')) {
        // Only log in debug mode to reduce noise
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 COMPREHENSIVE-STRESS: Updating syllable counts after stress detection')
        }
        debouncedUpdate()
      }
    })

    return () => {
      removeListener()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [editor, enabled])

  // Render syllable counts using React Portals
  const analysisElements = lineAnalyses.map((analysis) => {
    const rect = analysis.element.getBoundingClientRect()
    const editorRect = editor.getRootElement()?.getBoundingClientRect()

    if (!editorRect) return null

    // Position the analysis to the left of the line
    const top = rect.top - editorRect.top + editor.getRootElement()!.scrollTop
    const left = -60 // Position to the left of the editor

    const syllableRatio = analysis.totalSyllables > 0
      ? (analysis.stressedSyllables / analysis.totalSyllables).toFixed(2)
      : '0.00'

    return createPortal(
      <div
        key={`${analysis.lineNumber}-${analysis.text.substring(0, 10)}`}
        className="absolute text-xs text-gray-500 font-mono"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: '50px',
          textAlign: 'right'
        }}
      >
        <span title={`${analysis.stressedSyllables} stressed / ${analysis.totalSyllables} total (ratio: ${syllableRatio})`}>
          {analysis.stressedSyllables}/{analysis.totalSyllables}
        </span>
      </div>,
      editor.getRootElement()!.parentElement!
    )
  }).filter(el => el !== null)

  return <>{analysisElements}</>
}
