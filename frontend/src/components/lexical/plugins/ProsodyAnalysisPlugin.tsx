import { useEffect, useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createTextNode,
  TextNode,
  ParagraphNode,
} from 'lexical'
import { $createSyllableNode, SyllableNode } from '../nodes/SyllableNode'
import { $createRhymeNode, RhymeNode } from '../nodes/RhymeNode'

// Simple syllable counting heuristic
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0

  word = word.toLowerCase()

  // Remove punctuation and digits
  word = word.replace(/[^a-z]/g, '')

  if (word.length === 0) return 0
  if (word.length <= 3) return 1

  // Count vowel groups
  let syllables = 0
  let previousWasVowel = false
  const vowels = 'aeiouy'

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i])
    if (isVowel && !previousWasVowel) {
      syllables++
    }
    previousWasVowel = isVowel
  }

  // Handle silent e
  if (word.endsWith('e') && syllables > 1) {
    syllables--
  }

  // Ensure at least one syllable
  return Math.max(1, syllables)
}

// Extract rhyme sound from word (simplified)
function getRhymeSound(word: string): string {
  if (!word || word.length === 0) return ''

  word = word.toLowerCase().replace(/[^a-z]/g, '')

  // Very simple rhyme extraction - last vowel + consonants
  const vowels = 'aeiouy'
  let rhymeStart = -1

  for (let i = word.length - 1; i >= 0; i--) {
    if (vowels.includes(word[i])) {
      rhymeStart = i
      break
    }
  }

  if (rhymeStart === -1) return word.slice(-2) // fallback

  return word.slice(rhymeStart)
}

// Assign rhyme scheme letters
function assignRhymeScheme(rhymeSounds: string[]): string[] {
  const rhymeMap = new Map<string, string>()
  const schemes: string[] = []
  let currentLetter = 'A'

  for (const sound of rhymeSounds) {
    if (!sound) {
      schemes.push('')
      continue
    }

    if (!rhymeMap.has(sound)) {
      rhymeMap.set(sound, currentLetter)
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1)
    }

    schemes.push(rhymeMap.get(sound) || '')
  }

  return schemes
}

export function ProsodyAnalysisPlugin(): null {
  const [editor] = useLexicalComposerContext()

  const analyzeProsody = useCallback(() => {
    editor.update(() => {
      const root = $getRoot()
      const children = root.getChildren()
      const lineWords: string[][] = []
      const lineRhymeSounds: string[] = []

      // First pass: collect all words and extract rhyme sounds
      for (const child of children) {
        if (child instanceof ParagraphNode) {
          const textContent = child.getTextContent().trim()
          if (textContent && !textContent.match(/^\[.*\]$/)) { // Skip section tags
            const words = textContent.split(/\s+/).filter(word => word.length > 0)
            lineWords.push(words)

            // Get rhyme sound from last word
            const lastWord = words[words.length - 1]
            if (lastWord) {
              lineRhymeSounds.push(getRhymeSound(lastWord.replace(/[^\w]/g, '')))
            } else {
              lineRhymeSounds.push('')
            }
          }
        }
      }

      // Assign rhyme schemes
      const rhymeSchemes = assignRhymeScheme(lineRhymeSounds)

      // Second pass: update nodes with prosody information
      let lineIndex = 0
      for (const child of children) {
        if (child instanceof ParagraphNode) {
          const textContent = child.getTextContent().trim()
          if (textContent && !textContent.match(/^\[.*\]$/)) { // Skip section tags
            const words = lineWords[lineIndex]
            const rhymeScheme = rhymeSchemes[lineIndex]

            if (words && words.length > 0) {
              // Replace text nodes with syllable/rhyme nodes
              const textNodes = child.getChildren().filter(node => node instanceof TextNode)

              for (const textNode of textNodes) {
                if (textNode instanceof TextNode && !(textNode instanceof SyllableNode) && !(textNode instanceof RhymeNode)) {
                  const text = textNode.getTextContent()
                  const nodeWords = text.split(/(\s+)/)

                  // Create new nodes for each word/space
                  const newNodes = nodeWords.map((part, index) => {
                    if (part.trim()) {
                      // This is a word
                      const syllableCount = countSyllables(part)
                      const isLastWord = index === nodeWords.length - 1 ||
                        (index === nodeWords.length - 2 && !nodeWords[nodeWords.length - 1].trim())

                      if (isLastWord && rhymeScheme) {
                        // Last word gets rhyme highlighting
                        return $createRhymeNode(part, rhymeScheme, lineRhymeSounds[lineIndex])
                      } else {
                        // Regular word gets syllable analysis
                        return $createSyllableNode(part, syllableCount)
                      }
                    } else {
                      // This is whitespace
                      return $createTextNode(part)
                    }
                  })

                  // Replace the text node with the analyzed nodes
                  if (newNodes.length > 0) {
                    textNode.replace(newNodes[0])
                    for (let i = 1; i < newNodes.length; i++) {
                      newNodes[i - 1].insertAfter(newNodes[i])
                    }
                  }
                }
              }
            }

            lineIndex++
          }
        }
      }
    }, { tag: 'prosody-analysis' })
  }, [editor])

  useEffect(() => {
    // Debounce prosody analysis to avoid performance issues
    let timeoutId: NodeJS.Timeout

    const removeUpdateListener = editor.registerUpdateListener(() => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(analyzeProsody, 1000) // 1 second delay
    })

    return () => {
      clearTimeout(timeoutId)
      removeUpdateListener()
    }
  }, [editor, analyzeProsody])

  return null
}
