import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState, useCallback } from 'react'
import { $getRoot, $isParagraphNode, type LexicalNode, $isElementNode } from 'lexical'
import { $isSectionParagraphNode } from '../nodes/SectionParagraphNode'
import { createPortal } from 'react-dom'
import { comprehensiveStressAnalysis, type WordAnalysis, type StressAnalysisResult } from '../../../services/stressAnalysis'

interface ComprehensiveStressPluginProps {
  enabled?: boolean
}

interface LineAnalysisWithStress {
  text: string
  lineNumber: number
  totalSyllables: number
  stressedSyllables: number
  element: HTMLElement
  words: WordAnalysis[]
  processingTime: number
}

/**
 * Plugin that displays comprehensive syllable counts using the backend stress analysis service.
 * This replaces the old frontend-only hardcoded approach with linguistically accurate
 * spaCy POS tagging + CMU dictionary + G2P fallback analysis.
 */
export function ComprehensiveStressPlugin({
  enabled = true
}: ComprehensiveStressPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [lineAnalyses, setLineAnalyses] = useState<LineAnalysisWithStress[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzerReady, setAnalyzerReady] = useState(false)

  console.log('🚀 COMPREHENSIVE-STRESS: Plugin initialized, enabled:', enabled)

  // Check if the comprehensive analyzer is ready
  useEffect(() => {
    const checkAnalyzerStatus = async () => {
      try {
        const isReady = await comprehensiveStressAnalysis.isReady()
        setAnalyzerReady(isReady)
        if (isReady) {
          console.log('✅ COMPREHENSIVE-STRESS: Backend analyzer is ready')
        } else {
          console.log('⚠️ COMPREHENSIVE-STRESS: Backend analyzer not ready')
        }
      } catch (error) {
        console.error('❌ COMPREHENSIVE-STRESS: Error checking analyzer status:', error)
        setAnalyzerReady(false)
      }
    }

    checkAnalyzerStatus()
  }, [])

  const analyzeStressComprehensively = useCallback(async (lines: string[]): Promise<StressAnalysisResult[]> => {
    if (!analyzerReady || lines.length === 0) {
      return []
    }

    setIsAnalyzing(true)
    try {
      console.log('🔍 COMPREHENSIVE-STRESS: Analyzing', lines.length, 'lines with backend service')

      // Use batch analysis for efficiency
      const batchResult = await comprehensiveStressAnalysis.analyzeBatch(lines, 'lyrical')

      console.log('✅ COMPREHENSIVE-STRESS: Batch analysis complete in', batchResult.total_processing_time_ms, 'ms')

      return batchResult.lines.map(line => ({
        text: line.text,
        total_syllables: line.total_syllables,
        stressed_syllables: line.stressed_syllables,
        processing_time_ms: line.processing_time_ms,
        words: line.words
      }))

    } catch (error) {
      console.error('❌ COMPREHENSIVE-STRESS: Analysis failed:', error)
      return []
    } finally {
      setIsAnalyzing(false)
    }
  }, [analyzerReady])

  useEffect(() => {
    if (!enabled || !analyzerReady) {
      setLineAnalyses([])
      return
    }

    const updateStressAnalysis = async () => {
      const rootElement = editor.getRootElement()
      console.log('📈 COMPREHENSIVE-STRESS: updateStressAnalysis called, rootElement:', !!rootElement)
      if (!rootElement) return

      editor.read(() => {
        const lines: Array<{ text: string; element: HTMLElement }> = []
        const root = $getRoot()
        console.log('📈 COMPREHENSIVE-STRESS: Reading editor content...')

        // Extract text lines and their DOM elements
        function processNode(node: LexicalNode) {
          console.log('📈 COMPREHENSIVE-STRESS: Processing node:', node.getType(), 'isParagraph:', $isParagraphNode(node), 'isSection:', $isSectionParagraphNode(node))
          if ($isSectionParagraphNode(node) || $isParagraphNode(node)) {
            const textContent = node.getTextContent().trim()
            console.log('📈 COMPREHENSIVE-STRESS: Node text content:', textContent)
            if (textContent) {
              // Find the DOM element for this paragraph
              const nodeKey = node.getKey()
              const domElement = editor.getElementByKey(nodeKey)

              if (domElement) {
                lines.push({
                  text: textContent,
                  element: domElement as HTMLElement
                })
              }
            }
          }

          // Recurse through children
          if ($isElementNode(node)) {
            const children = node.getChildren()
            children.forEach(processNode)
          }
        }

        console.log('📈 COMPREHENSIVE-STRESS: Starting to process root node')
        processNode(root)
        console.log('📈 COMPREHENSIVE-STRESS: Finished processing, found', lines.length, 'lines')

        // Perform comprehensive stress analysis
        if (lines.length > 0) {
          const textLines = lines.map(line => line.text)
          analyzeStressComprehensively(textLines).then(results => {
            const analysesWithElements: LineAnalysisWithStress[] = results.map((result, index) => ({
              text: result.text,
              lineNumber: index + 1,
              totalSyllables: result.total_syllables,
              stressedSyllables: result.stressed_syllables,
              element: lines[index]?.element,
              words: result.words,
              processingTime: result.processing_time_ms
            })).filter(analysis => analysis.element) // Only keep analyses with valid DOM elements

            console.log('🎯 COMPREHENSIVE-STRESS: Analysis complete for', analysesWithElements.length, 'lines')
            setLineAnalyses(analysesWithElements)
          }).catch(error => {
            console.error('❌ COMPREHENSIVE-STRESS: Failed to analyze stress:', error)
          })
        } else {
          setLineAnalyses([])
        }
      })
    }

    // Update on any editor changes with debouncing
    let timeoutId: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateStressAnalysis, 500) // 500ms debounce
    }

    const removeListener = editor.registerUpdateListener(() => {
      debouncedUpdate()
    })

    // Initial update
    updateStressAnalysis()

    return () => {
      removeListener()
      clearTimeout(timeoutId)
    }
  }, [editor, enabled, analyzerReady, analyzeStressComprehensively])

  // Render syllable counts and analysis info using React Portals
  const analysisElements = lineAnalyses.map((analysis) => {
    const rect = analysis.element.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    // Enhanced display with more detailed information
    const displayText = `(${analysis.totalSyllables}/${analysis.stressedSyllables})`
    const tooltipText = [
      `Line ${analysis.lineNumber}: "${analysis.text.substring(0, 30)}${analysis.text.length > 30 ? '...' : ''}"`,
      `Total syllables: ${analysis.totalSyllables}`,
      `Stressed syllables: ${analysis.stressedSyllables}`,
      `Processing time: ${analysis.processingTime.toFixed(1)}ms`,
      `Words analyzed: ${analysis.words.length}`,
      `Backend: spaCy POS + CMU dict + G2P fallback`
    ].join('\n')

    return createPortal(
      <div
        key={`comprehensive-stress-${analysis.lineNumber}`}
        className="comprehensive-stress-display"
        style={{
          position: 'absolute',
          left: rect.right + scrollX + 8, // 8px to the right of the line
          top: rect.top + scrollY,
          zIndex: 1000,
          backgroundColor: analyzerReady ? '#f3f4f6' : '#fef3cd',
          color: analyzerReady ? '#6b7280' : '#92400e',
          fontSize: '11px',
          fontFamily: 'monospace',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${analyzerReady ? '#d1d5db' : '#f59e0b'}`,
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          opacity: isAnalyzing ? 0.6 : 1
        }}
        title={tooltipText}
      >
        {isAnalyzing ? '...' : displayText}
        {!analyzerReady && ' ⚠️'}
      </div>,
      document.body
    )
  })

  // Show analyzer status indicator
  const statusElement = analyzerReady ? null : createPortal(
    <div
      className="comprehensive-stress-status"
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10000,
        backgroundColor: '#fef3cd',
        color: '#92400e',
        fontSize: '12px',
        fontFamily: 'monospace',
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #f59e0b',
        userSelect: 'none'
      }}
    >
      ⚠️ Comprehensive stress analyzer not ready - using fallback
    </div>,
    document.body
  )

  return (
    <>
      {analysisElements}
      {statusElement}
    </>
  )
}
