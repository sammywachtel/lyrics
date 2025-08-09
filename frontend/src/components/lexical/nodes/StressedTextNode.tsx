import {
  $applyNodeReplacement,
  $isTextNode,
  type DOMConversion,
  type DOMConversionMap,
  type DOMConversionOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from 'lexical'

/**
 * Represents a syllable within a word with stress marking
 */
export interface Syllable {
  text: string            // The syllable text (e.g., "walk", "ing")
  stressed: boolean       // Whether this syllable is stressed
  confidence: number      // AI confidence in automatic marking (0-1)
  position: number        // Position within the word (0-based)
  overridden: boolean     // User manually set this stress
}

/**
 * Represents the stress pattern for an entire word
 */
export interface StressPattern {
  syllables: Syllable[]
  overridden: boolean     // Any syllable in this word was manually overridden
}

/**
 * Serialized format for StressedTextNode
 */
export type SerializedStressedTextNode = Spread<
  {
    stressPatterns: Array<[string, StressPattern]> | Record<string, StressPattern>  // word -> stress pattern mapping (serialized as array or object)
    autoDetectionEnabled: boolean
  },
  SerializedTextNode
>

/**
 * A TextNode that can automatically detect and display stress patterns for prosody analysis
 */
export class StressedTextNode extends TextNode {
  __stressPatterns: Map<string, StressPattern>
  __autoDetectionEnabled: boolean

  constructor(
    text: string = '',
    stressPatterns: Map<string, StressPattern> = new Map(),
    autoDetectionEnabled: boolean = true,
    key?: NodeKey,
  ) {
    super(text, key)
    this.__stressPatterns = stressPatterns
    this.__autoDetectionEnabled = autoDetectionEnabled
  }

  static getType(): string {
    return 'stressed-text'
  }

  static clone(node: StressedTextNode): StressedTextNode {
    return new StressedTextNode(
      node.__text,
      new Map(node.__stressPatterns),
      node.__autoDetectionEnabled,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedStressedTextNode): StressedTextNode {
    const node = $createStressedTextNode()
    node.setTextContent(serializedNode.text || '')
    // Handle both Map and object formats for backwards compatibility
    if (serializedNode.stressPatterns) {
      if (serializedNode.stressPatterns instanceof Map) {
        node.__stressPatterns = new Map(serializedNode.stressPatterns)
      } else if (Array.isArray(serializedNode.stressPatterns)) {
        node.__stressPatterns = new Map(serializedNode.stressPatterns)
      } else {
        // Convert object to Map
        node.__stressPatterns = new Map(Object.entries(serializedNode.stressPatterns))
      }
    } else {
      node.__stressPatterns = new Map()
    }
    node.__autoDetectionEnabled = serializedNode.autoDetectionEnabled ?? true
    node.setFormat(serializedNode.format || 0)
    node.setDetail(serializedNode.detail || 0)
    if (serializedNode.mode !== undefined) {
      node.setMode(serializedNode.mode)
    }
    node.setStyle(serializedNode.style || '')
    return node
  }

  exportJSON(): SerializedStressedTextNode {
    // Only save patterns that have been manually overridden by the user
    // This prevents old auto-detected patterns from persisting across saves
    const overriddenPatterns: [string, StressPattern][] = []

    this.__stressPatterns.forEach((pattern, word) => {
      // Only save if the pattern or any of its syllables have been overridden
      if (pattern.overridden || pattern.syllables.some(s => s.overridden)) {
        overriddenPatterns.push([word, pattern])
      }
    })

    return {
      ...super.exportJSON(),
      stressPatterns: overriddenPatterns, // Only save user overrides
      autoDetectionEnabled: this.__autoDetectionEnabled,
      type: 'stressed-text',
      version: 1,
    }
  }

  static importDOM(): DOMConversionMap | null {
    const importers = TextNode.importDOM()
    return {
      ...importers,
      span: () => ({
        conversion: patchStressConversion(importers?.span),
        priority: 1,
      }),
    }
  }

  // Get stress pattern for a specific word
  getStressPattern(word: string): StressPattern | null {
    return this.__stressPatterns.get(word.toLowerCase()) || null
  }

  // Set stress pattern for a word (manual override)
  setStressPattern(word: string, pattern: StressPattern): this {
    const self = this.getWritable()
    self.__stressPatterns.set(word.toLowerCase(), {
      ...pattern,
      overridden: true
    })
    return self
  }

  // Toggle stress for a specific syllable in a word
  toggleSyllableStress(word: string, syllableIndex: number): this {
    const self = this.getWritable()
    const pattern = self.__stressPatterns.get(word.toLowerCase())

    if (pattern && pattern.syllables[syllableIndex]) {
      const newSyllables = [...pattern.syllables]
      newSyllables[syllableIndex] = {
        ...newSyllables[syllableIndex],
        stressed: !newSyllables[syllableIndex].stressed,
        overridden: true,
      }

      self.__stressPatterns.set(word.toLowerCase(), {
        ...pattern,
        syllables: newSyllables,
        overridden: true,
      })
    }

    return self
  }

  // Auto-detect stress patterns for all words in the text
  async autoDetectStress(): Promise<this> {
    if (!this.__autoDetectionEnabled) return this

    const self = this.getWritable()
    const words = this.__text.split(/\s+/).filter(word => word.length > 0)

    // Process words asynchronously to allow dictionary lookups
    const wordPromises = words.map(async (word) => {
      const cleanWord = word.replace(/[^\w']/g, '') // Remove punctuation but keep apostrophes
      const lowerWord = cleanWord.toLowerCase()

      if (cleanWord && !self.__stressPatterns.has(lowerWord)) {
        // Only analyze words that don't already have patterns
        const pattern = await analyzeWordStress(cleanWord)
        if (pattern) {
          self.__stressPatterns.set(lowerWord, pattern)
        }
      } else if (cleanWord && self.__stressPatterns.has(lowerWord)) {
        // Skip words that already have patterns (including user overrides)
        const existingPattern = self.__stressPatterns.get(lowerWord)
        if (existingPattern?.overridden) {
          // Don't re-analyze words with user overrides
          return
        }
      }
    })

    // Wait for all word analyses to complete
    await Promise.all(wordPromises)

    return self
  }

  // Enable/disable automatic stress detection
  setAutoDetectionEnabled(enabled: boolean): this {
    const self = this.getWritable()
    self.__autoDetectionEnabled = enabled
    return self
  }

  isAutoDetectionEnabled(): boolean {
    return this.__autoDetectionEnabled
  }

  // Get all stress patterns
  getAllStressPatterns(): Map<string, StressPattern> {
    return new Map(this.__stressPatterns)
  }

  // Clear stress pattern for a word
  clearStressPattern(word: string): this {
    const self = this.getWritable()
    self.__stressPatterns.delete(word.toLowerCase())
    return self
  }

  // Clear all stress patterns
  clearAllStressPatterns(): this {
    const self = this.getWritable()
    self.__stressPatterns.clear()
    return self
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.classList.add('stressed-text-node')
    // Note: No direct DOM manipulation - decorators handle visual representation
    return element
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const prevNeedsUpdate = super.updateDOM(prevNode, dom, config)

    // No need to handle stress pattern changes in DOM - decorators handle this
    // Just update text content if needed
    if (dom.textContent !== this.__text) {
      dom.textContent = this.__text
    }

    return prevNeedsUpdate
  }

}

/**
 * Create a new StressedTextNode
 */
export function $createStressedTextNode(text: string = ''): StressedTextNode {
  return $applyNodeReplacement(new StressedTextNode(text))
}

/**
 * Check if a node is a StressedTextNode
 */
export function $isStressedTextNode(
  node: LexicalNode | null | undefined,
): node is StressedTextNode {
  return node instanceof StressedTextNode
}

/**
 * Function-based stress detection for single-syllable words (from songwriting pedagogy)
 */
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
    return false;
  }

  // CONTEXTUAL WORDS that can be either stressed or unstressed
  const contextualWords = new Set(['there', 'here', 'where', 'when', 'how', 'why', 'what']);
  if (contextualWords.has(cleanWord)) {
    return true; // Default to stressed as demonstrative
  }

  // STRESSED - Meaning/Semantic function words (default)
  return true;
}

/**
 * Analyze a word and return its stress pattern
 * Uses function-based detection for single-syllable words (songwriting pedagogy)
 * Uses CMU dictionary lookup for multi-syllable words
 */
async function analyzeWordStress(word: string): Promise<StressPattern | null> {
  if (!word || word.length === 0) return null

  const syllables = syllabify(word)
  if (syllables.length === 0) return null

  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')

  // For multi-syllable words, try dictionary lookup first
  if (syllables.length > 1) {
    try {
      const response = await fetch(`http://localhost:8001/api/dictionary/stress/${encodeURIComponent(cleanWord)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.found && data.syllables && data.stress_pattern) {
          // Convert dictionary response to our StressPattern format
          const dictionarySyllables: Syllable[] = data.syllables.map((syllableText: string, index: number) => ({
            text: syllableText,
            stressed: data.stress_pattern[index] > 0, // CMU uses 0=unstressed, 1=primary, 2=secondary
            confidence: data.confidence || 1.0,
            position: index,
            overridden: false,
          }))

          return {
            syllables: dictionarySyllables,
            overridden: false,
          }
        }
      }
    } catch (error) {
      console.warn(`Dictionary lookup failed for '${cleanWord}':`, error)
      // Fall back to heuristic method below
    }
  }

  // Fallback: original heuristic-based stress detection
  const stressedSyllables: Syllable[] = syllables.map((syl, index) => {
    let stressed = false
    let confidence = 0.6 // Default confidence

    if (syllables.length === 1) {
      // Single-syllable words: use function-based detection
      stressed = isWordStressed(cleanWord)
      confidence = stressed ? 0.9 : 0.8 // High confidence for function-based detection
    } else if (syllables.length === 2) {
      // For two-syllable words, stress the first syllable by default
      stressed = index === 0
      confidence = 0.5 // Lower confidence for heuristic
    } else {
      // For longer words, stress typically falls on antepenultimate or penultimate
      const stressIndex = Math.max(0, syllables.length - 2)
      stressed = index === stressIndex
      confidence = 0.4 // Lower confidence for heuristic
    }

    return {
      text: syl,
      stressed,
      confidence,
      position: index,
      overridden: false,
    }
  })

  return {
    syllables: stressedSyllables,
    overridden: false,
  }
}

/**
 * Simple syllable detection algorithm
 * In practice, you'd use a more sophisticated phonetic algorithm
 */
function syllabify(word: string): string[] {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')

  if (cleanWord.length === 0) return []
  if (cleanWord.length <= 2) return [cleanWord] // Short words are usually one syllable

  // Special cases for common single-syllable words that might be mis-syllabified
  const singleSyllableWords = ['new', 'are', 'you', 'the', 'and', 'but', 'can', 'way', 'how', 'why', 'now', 'our', 'out', 'use', 'her', 'his', 'she', 'see', 'two', 'may', 'say', 'day', 'try', 'oil', 'eye', 'line', 'time', 'like', 'make', 'take', 'come', 'some', 'home', 'made', 'name', 'same', 'came', 'here', 'there', 'where']
  if (singleSyllableWords.includes(cleanWord)) {
    return [cleanWord]
  }

  const vowels = 'aeiouy'

  // Check for silent-e pattern first (CVCe pattern like "line", "time", "make")
  // This catches words with pattern: consonant + vowel + consonant + 'e'
  if (cleanWord.endsWith('e') && cleanWord.length >= 3) {
    const beforeE = cleanWord.slice(0, -1)
    const vowelCount = beforeE.split('').filter(c => vowels.includes(c)).length
    const lastChar = beforeE[beforeE.length - 1]

    // If there's only one vowel before the 'e' and the last char before 'e' is a consonant
    // then it's likely a silent-e word (like "line", "time", "make")
    if (vowelCount === 1 && !vowels.includes(lastChar)) {
      return [cleanWord]
    }
  }

  // Find vowel groups (consecutive vowels count as one sound)
  const vowelGroups: { start: number; end: number; text: string }[] = []
  let inVowelGroup = false
  let groupStart = -1

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i])

    if (isVowel && !inVowelGroup) {
      // Start of new vowel group
      inVowelGroup = true
      groupStart = i
    } else if (!isVowel && inVowelGroup) {
      // End of vowel group
      vowelGroups.push({
        start: groupStart,
        end: i - 1,
        text: cleanWord.slice(groupStart, i)
      })
      inVowelGroup = false
    }
  }

  // Handle final vowel group
  if (inVowelGroup && groupStart !== -1) {
    vowelGroups.push({
      start: groupStart,
      end: cleanWord.length - 1,
      text: cleanWord.slice(groupStart)
    })
  }

  // If no vowel groups found, treat as one syllable
  if (vowelGroups.length === 0) {
    return [cleanWord]
  }

  // If only one vowel group, check for silent e
  if (vowelGroups.length === 1) {
    // Check for silent e pattern (consonant + vowel + consonant + e)
    if (cleanWord.endsWith('e') && cleanWord.length > 3 && !vowels.includes(cleanWord[cleanWord.length - 2])) {
      return [cleanWord] // Silent e - still one syllable
    }
    return [cleanWord]
  }

  // Split word based on vowel groups
  const syllables: string[] = []

  for (let i = 0; i < vowelGroups.length; i++) {
    const currentGroup = vowelGroups[i]
    const nextGroup = vowelGroups[i + 1]

    if (i === 0) {
      // First syllable: from start to midpoint between first and second vowel group
      if (nextGroup) {
        const splitPoint = Math.floor((currentGroup.end + nextGroup.start) / 2) + 1
        syllables.push(cleanWord.slice(0, splitPoint))
      } else {
        syllables.push(cleanWord)
      }
    } else if (i === vowelGroups.length - 1) {
      // Last syllable: from previous split to end
      const prevSplit = Math.floor((vowelGroups[i - 1].end + currentGroup.start) / 2) + 1
      syllables.push(cleanWord.slice(prevSplit))
    } else {
      // Middle syllables
      const prevSplit = Math.floor((vowelGroups[i - 1].end + currentGroup.start) / 2) + 1
      const nextSplit = Math.floor((currentGroup.end + nextGroup.start) / 2) + 1
      syllables.push(cleanWord.slice(prevSplit, nextSplit))
    }
  }

  // Clean up empty syllables and ensure we have at least one
  const cleanSyllables = syllables.filter(s => s.length > 0)
  return cleanSyllables.length > 0 ? cleanSyllables : [cleanWord]
}

/**
 * Helper function to compare Maps for equality
 */
/* function mapsEqual<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
  if (map1.size !== map2.size) return false

  for (const [key, value] of map1) {
    if (!map2.has(key) || map2.get(key) !== value) {
      return false
    }
  }

  return true
} */

/**
 * DOM conversion helper for importing stress-marked HTML
 */
function patchStressConversion(
  originalDOMConverter?: (node: HTMLElement) => DOMConversion | null
): (node: HTMLElement) => DOMConversionOutput | null {
  return (node) => {
    const original = originalDOMConverter?.(node)
    if (!original) {
      return null
    }
    const originalOutput = original.conversion(node)

    if (!originalOutput) {
      return originalOutput
    }

    // Check if this span contains stress markup
    const hasStressMarkup = node.classList.contains('word-stress-container') ||
                           node.classList.contains('syllable')

    if (!hasStressMarkup) {
      return originalOutput
    }

    // Extract stress patterns from the DOM
    const stressPatterns = extractStressPatternsFromDOM(node)

    return {
      ...originalOutput,
      forChild: (lexicalNode, parent) => {
        const originalForChild = originalOutput?.forChild ?? ((x) => x)
        const result = originalForChild(lexicalNode, parent)

        if ($isTextNode(result) && stressPatterns.size > 0) {
          const stressedNode = new StressedTextNode(
            result.getTextContent(),
            stressPatterns,
            true
          )
          stressedNode.setFormat(result.getFormat())
          stressedNode.setDetail(result.getDetail())
          stressedNode.setMode(result.getMode())
          stressedNode.setStyle(result.getStyle())

          return stressedNode
        }
        return result
      }
    }
  }
}

/**
 * Extract stress patterns from DOM elements during import
 */
function extractStressPatternsFromDOM(element: HTMLElement): Map<string, StressPattern> {
  const patterns = new Map<string, StressPattern>()

  const wordContainers = element.querySelectorAll('.word-stress-container')

  wordContainers.forEach((container) => {
    const word = container.getAttribute('data-word')
    if (!word) return

    const syllableElements = container.querySelectorAll('.syllable')
    const syllables: Syllable[] = []

    syllableElements.forEach((syllableEl, index) => {
      const text = syllableEl.textContent || ''
      const stressed = syllableEl.classList.contains('stressed')
      const overridden = syllableEl.classList.contains('user-overridden')
      const confidence = parseFloat(syllableEl.getAttribute('data-confidence') || '0.6')

      syllables.push({
        text,
        stressed,
        confidence,
        position: index,
        overridden,
      })
    })

    if (syllables.length > 0) {
      patterns.set(word, {
        syllables,
        overridden: syllables.some(s => s.overridden),
      })
    }
  })

  return patterns
}
