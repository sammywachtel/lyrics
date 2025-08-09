import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState, useCallback } from 'react'
import { $getRoot, $isParagraphNode, type LexicalNode, $isElementNode } from 'lexical'
import { $isSectionParagraphNode } from '../nodes/SectionParagraphNode'
import { createPortal } from 'react-dom'

interface SyllableCountDecoratorPluginProps {
  enabled?: boolean
}

interface LineAnalysis {
  text: string
  lineNumber: number
  totalSyllables: number
  stressedSyllables: number
  element: HTMLElement
}

/**
 * Plugin that displays syllable counts next to each line using React Portals
 * Integrates with Lexical's decorator system for proper framework integration
 */
export function SyllableCountDecoratorPlugin({
  enabled = true
}: SyllableCountDecoratorPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [lineAnalyses, setLineAnalyses] = useState<LineAnalysis[]>([])

  console.log('🚀 SYLLABLE-DECORATOR: Plugin initialized, enabled:', enabled)

  // Function-based stress detection for single-syllable words
  function isWordStressed(word: string): boolean {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

    // UNSTRESSED - Grammatical function words
    const unstressedWords = new Set([
      // Articles
      'the', 'a', 'an',
      // Conjunctions
      'and', 'but', 'or', 'yet', 'if', 'so', 'nor', 'for',
      // Personal Pronouns
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'us', 'them', 'me', 'him', 'her',
      // Common Prepositions
      'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'from', 'up', 'about', 'into',
      'over', 'after', 'before', 'under', 'through', 'during', 'between', 'among',
      'against', 'without', 'within', 'upon', 'beneath', 'beside', 'beyond', 'across',
      // Modal verbs and auxiliaries
      'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might', 'must', 'shall', 'should'
    ]);

    if (unstressedWords.has(cleanWord)) {
      console.log(`    🚫 "${cleanWord}" found in unstressed words → FALSE`);
      return false;
    }

    // CONTEXTUAL WORDS that can be either stressed or unstressed
    const contextualWords = new Set(['there', 'here', 'where', 'when', 'how', 'why', 'what']);
    if (contextualWords.has(cleanWord)) {
      console.log(`    ⚡ "${cleanWord}" is contextual word → TRUE (default stressed)`);
      return true; // Default to stressed as demonstrative
    }

    // STRESSED - Meaning/Semantic function words (default)
    console.log(`    ✅ "${cleanWord}" is semantic word → TRUE`);
    return true;
  }

  function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length === 0) return 0;

    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e') && count > 1 && !word.match(/[^aeiou]le$/)) {
      count--;
    }

    return Math.max(1, count);
  }

  const countStressedSyllablesInLine = useCallback((line: string): number => {
    const words = line.trim().split(/\s+/).filter(word => word.length > 0);
    let stressedCount = 0;

    console.log(`🔍 STRESS-DEBUG: Analyzing line: "${line}"`);

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length === 0) continue;

      const syllableCount = countSyllables(cleanWord);

      if (syllableCount === 1) {
        // Single-syllable: use function-based detection
        const isStressed = isWordStressed(cleanWord);
        if (isStressed) {
          stressedCount += 1;
        }
        console.log(`  • "${word}" (${cleanWord}) → ${syllableCount} syllable, ${isStressed ? 'STRESSED' : 'unstressed'} → ${isStressed ? '+1' : '+0'}`);
      } else {
        // Multi-syllable: approximate as 1 stressed syllable per word
        // TODO: Use actual stress pattern data when available
        stressedCount += 1;
        console.log(`  • "${word}" (${cleanWord}) → ${syllableCount} syllables, multi-syllable approximation → +1`);
      }
    }

    console.log(`🎯 STRESS-RESULT: Total stressed syllables = ${stressedCount}`);
    return stressedCount;
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLineAnalyses([])
      return
    }

    const updateSyllableCounts = () => {
      const rootElement = editor.getRootElement()
      console.log('📈 SYLLABLE-DECORATOR: updateSyllableCounts called, rootElement:', !!rootElement)
      if (!rootElement) return

      editor.read(() => {
        const analyses: LineAnalysis[] = []
        const root = $getRoot()
        let lineNumber = 1
        console.log('📈 SYLLABLE-DECORATOR: Reading editor content...')

        // Process all paragraph nodes (both section and regular paragraphs)
        function processNode(node: LexicalNode) {
          console.log('📈 SYLLABLE-DECORATOR: Processing node:', node.getType(), 'isParagraph:', $isParagraphNode(node), 'isSection:', $isSectionParagraphNode(node))
          if ($isSectionParagraphNode(node) || $isParagraphNode(node)) {
            const textContent = node.getTextContent().trim()
            console.log('📈 SYLLABLE-DECORATOR: Node text content:', textContent)
            if (textContent) {
              // Find the DOM element for this paragraph
              const nodeKey = node.getKey()
              const domElement = editor.getElementByKey(nodeKey)

              if (domElement) {
                const totalSyllables = textContent.split(/\s+/)
                  .filter(word => word.length > 0)
                  .reduce((sum, word) => sum + countSyllables(word), 0)

                const stressedSyllables = countStressedSyllablesInLine(textContent)

                console.log(`📊 SYLLABLE-COUNT: Line ${lineNumber}: "${textContent.substring(0, 30)}..."`)
                console.log(`   → Total syllables: ${totalSyllables}`)
                console.log(`   → Stressed syllables: ${stressedSyllables}`)
                console.log(`   → Display: (${totalSyllables}/${stressedSyllables})`)

                analyses.push({
                  text: textContent,
                  lineNumber,
                  totalSyllables,
                  stressedSyllables,
                  element: domElement as HTMLElement
                })
                lineNumber++
              }
            }
          }

          // Recurse through children
          if ($isElementNode(node)) {
            const children = node.getChildren()
            children.forEach(processNode)
          }
        }

        console.log('📈 SYLLABLE-DECORATOR: Starting to process root node')
        processNode(root)
        console.log('📈 SYLLABLE-DECORATOR: Finished processing, found', analyses.length, 'lines')
        setLineAnalyses(analyses)
      })
    }

    // Update on any editor changes
    const removeListener = editor.registerUpdateListener(() => {
      updateSyllableCounts()
    })

    // Initial update
    updateSyllableCounts()

    return removeListener
  }, [editor, enabled, countStressedSyllablesInLine])

  // Render syllable counts using React Portals
  const syllableCountElements = lineAnalyses.map((analysis) => {
    const rect = analysis.element.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    return createPortal(
      <div
        key={`syllable-count-${analysis.lineNumber}`}
        className="syllable-count-display"
        style={{
          position: 'absolute',
          left: rect.right + scrollX + 8, // 8px to the right of the line
          top: rect.top + scrollY,
          zIndex: 1000,
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          fontSize: '11px',
          fontFamily: 'monospace',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}
        title={`Line ${analysis.lineNumber}: ${analysis.totalSyllables} total syllables, ${analysis.stressedSyllables} stressed. Stressed syllables determine line length in songwriting.`}
      >
        ({analysis.totalSyllables}/{analysis.stressedSyllables})
      </div>,
      document.body
    )
  })

  return <>{syllableCountElements}</>
}
