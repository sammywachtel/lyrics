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
    return {
      ...super.exportJSON(),
      stressPatterns: Array.from(this.__stressPatterns.entries()),
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
  autoDetectStress(): this {
    if (!this.__autoDetectionEnabled) return this

    const self = this.getWritable()
    const words = this.__text.split(/\s+/).filter(word => word.length > 0)

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w']/g, '') // Remove punctuation but keep apostrophes
      if (cleanWord && !self.__stressPatterns.has(cleanWord.toLowerCase())) {
        const pattern = analyzeWordStress(cleanWord)
        if (pattern) {
          self.__stressPatterns.set(cleanWord.toLowerCase(), pattern)
        }
      }
    })

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
 * Analyze a word and return its stress pattern
 * This is a simplified implementation - in production you'd use a more sophisticated algorithm
 */
function analyzeWordStress(word: string): StressPattern | null {
  if (!word || word.length === 0) return null

  const syllables = syllabify(word)
  if (syllables.length === 0) return null

  // Simple stress detection rules (this would be much more sophisticated in practice)
  const stressedSyllables: Syllable[] = syllables.map((syl, index) => {
    let stressed = false
    let confidence = 0.6 // Default confidence

    // Simple heuristics for stress detection
    if (syllables.length === 1) {
      // Monosyllabic words are usually stressed
      stressed = true
      confidence = 0.9
    } else if (syllables.length === 2) {
      // For two-syllable words, stress the first syllable by default
      stressed = index === 0
      confidence = 0.7
    } else {
      // For longer words, stress typically falls on antepenultimate or penultimate
      const stressIndex = Math.max(0, syllables.length - 2)
      stressed = index === stressIndex
      confidence = 0.6
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
  const cleanWord = word.toLowerCase()
  
  // Very basic syllable detection based on vowel clusters
  const vowels = 'aeiouy'
  const syllables: string[] = []
  let currentSyllable = ''
  let lastWasVowel = false
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i]
    const isVowel = vowels.includes(char)
    
    if (isVowel && !lastWasVowel && currentSyllable.length > 0) {
      // Start of new syllable
      syllables.push(currentSyllable)
      currentSyllable = char
    } else {
      currentSyllable += char
    }
    
    lastWasVowel = isVowel
  }
  
  if (currentSyllable) {
    syllables.push(currentSyllable)
  }
  
  // Handle edge cases (e.g., silent e)
  if (syllables.length === 0) {
    return [word]
  }
  
  return syllables
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