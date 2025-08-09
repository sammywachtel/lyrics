import {
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  // type LexicalEditor unused,
  type LexicalNode,
} from 'lexical'
import React from 'react'

// Import our function-based stress detection
// Note: We need to create these functions in this file or import them properly
// For now, inline the logic to avoid circular imports

export interface ProsodyData {
  syllableCount: number
  stressedSyllableCount: number // NEW: Function-based stressed syllable count for songwriting
  stressPattern: ('stressed' | 'unstressed')[]
  meterType?: string // iambic, trochaic, anapestic, dactylic
  lineStability: 'stable' | 'mixed' | 'unstable'
}

export interface SerializedProsodyLineNode extends Spread<{
  lineText: string
  lineNumber: number
  prosodyData: ProsodyData
  type: 'prosody-line'
  version: 1
}, SerializedLexicalNode> {
  lineText: string
  lineNumber: number
  prosodyData: ProsodyData
  type: 'prosody-line'
  version: 1
}

export class ProsodyLineNode extends DecoratorNode<React.ReactElement> {
  __lineText: string
  __lineNumber: number
  __prosodyData: ProsodyData

  static getType(): string {
    return 'prosody-line'
  }

  static clone(node: ProsodyLineNode): ProsodyLineNode {
    return new ProsodyLineNode(node.__lineText, node.__lineNumber, node.__prosodyData, node.__key)
  }

  constructor(lineText: string, lineNumber: number, prosodyData: ProsodyData, key?: NodeKey) {
    super(key)
    this.__lineText = lineText
    this.__lineNumber = lineNumber
    this.__prosodyData = prosodyData
  }

  getLineText(): string {
    return this.__lineText
  }

  getLineNumber(): number {
    return this.__lineNumber
  }

  getProsodyData(): ProsodyData {
    return this.__prosodyData
  }

  setLineText(lineText: string): void {
    const writable = this.getWritable()
    writable.__lineText = lineText
  }

  setProsodyData(prosodyData: ProsodyData): void {
    const writable = this.getWritable()
    writable.__prosodyData = prosodyData
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div')
    dom.className = 'prosody-line-wrapper'
    dom.setAttribute('data-line', this.__lineNumber.toString())
    return dom
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedProsodyLineNode): ProsodyLineNode {
    const { lineText, lineNumber, prosodyData } = serializedNode
    return $createProsodyLineNode(lineText, lineNumber, prosodyData)
  }

  exportJSON(): SerializedProsodyLineNode {
    return {
      lineText: this.__lineText,
      lineNumber: this.__lineNumber,
      prosodyData: this.__prosodyData,
      type: 'prosody-line',
      version: 1,
    }
  }

  getTextContent(): string {
    return this.__lineText
  }

  isInline(): false {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }

  canBeEmpty(): false {
    return false
  }

  canInsertTextBefore(): boolean {
    return true
  }

  canInsertTextAfter(): boolean {
    return true
  }

  decorate(): React.ReactElement {
    return (
      <ProsodyLineComponent
        lineText={this.__lineText}
        lineNumber={this.__lineNumber}
        prosodyData={this.__prosodyData}
      />
    )
  }
}

// Removed unused interface

function ProsodyLineComponent({
  lineText,
  lineNumber,
  prosodyData
}: { lineText: string; lineNumber: number; prosodyData: ProsodyData }): React.ReactElement {
  const [isHovered, setIsHovered] = React.useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = React.useState(false)

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'stable': return 'border-success-500'
      case 'mixed': return 'border-warm-500'
      case 'unstable': return 'border-red-500'
      default: return 'border-neutral-300'
    }
  }

  const getStabilityIcon = (stability: string) => {
    switch (stability) {
      case 'stable': return '✓'
      case 'mixed': return '⚠'
      case 'unstable': return '✗'
      default: return '○'
    }
  }

  const getMeterDescription = (meterType?: string) => {
    switch (meterType) {
      case 'iambic': return 'Iambic (unstressed-stressed)'
      case 'trochaic': return 'Trochaic (stressed-unstressed)'
      case 'anapestic': return 'Anapestic (unstressed-unstressed-stressed)'
      case 'dactylic': return 'Dactylic (stressed-unstressed-unstressed)'
      default: return 'Mixed or irregular meter'
    }
  }

  const renderStressPattern = () => {
    return prosodyData.stressPattern.map((stress, index) => (
      <span
        key={index}
        className={`inline-block w-3 h-3 mx-0.5 rounded-full transition-all duration-200 ${
          stress === 'stressed'
            ? 'bg-primary-500 shadow-sm'
            : 'bg-neutral-300'
        }`}
        title={stress === 'stressed' ? 'Stressed syllable' : 'Unstressed syllable'}
      />
    ))
  }

  const handleLineClick = () => {
    setShowDetailedAnalysis(!showDetailedAnalysis)
  }

  return (
    <div
      className={`prosody-line-node relative transition-all duration-200 ${
        isHovered ? 'bg-primary-50/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-line={lineNumber}
    >
      <div className="flex items-center gap-4 py-2">
        {/* Line Number & Stability Indicator */}
        <div className={`line-number-indicator ${getStabilityColor(prosodyData.lineStability)}`}>
          <span className="line-number text-xs font-mono">
            {lineNumber.toString().padStart(2, '0')}
          </span>
          <span className={`ml-1 text-xs ${
            prosodyData.lineStability === 'stable' ? 'text-success-600' :
            prosodyData.lineStability === 'mixed' ? 'text-warm-600' :
            'text-red-600'
          }`}>
            {getStabilityIcon(prosodyData.lineStability)}
          </span>
        </div>

        {/* Line Content */}
        <div className="line-content flex-1">
          <div className="line-text font-mono text-lyrics leading-relaxed">
            {lineText}
          </div>

          {/* Prosody Indicators (shown on hover or when analysis is enabled) */}
          {(isHovered || showDetailedAnalysis) && (
            <div className="prosody-indicators mt-2 flex items-center gap-4">
              {/* Stress Pattern */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">Stress:</span>
                <div className="flex items-center">
                  {renderStressPattern()}
                </div>
              </div>

              {/* Syllable Count - Total/Stressed */}
              <div className="syllable-count px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
                   title={`${prosodyData.syllableCount} total syllables, ${prosodyData.stressedSyllableCount} stressed syllables. Stressed syllables determine line length in songwriting.`}>
                ({prosodyData.syllableCount}/{prosodyData.stressedSyllableCount})
              </div>

              {/* Meter Type */}
              {prosodyData.meterType && (
                <div className="meter-type px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                  {prosodyData.meterType}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analysis Toggle */}
        <button
          onClick={handleLineClick}
          className={`analysis-toggle p-2 rounded transition-all duration-200 ${
            showDetailedAnalysis
              ? 'bg-primary-100 text-primary-700'
              : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
          }`}
          title={showDetailedAnalysis ? 'Hide detailed analysis' : 'Show detailed analysis'}
        >
          <span className="text-sm">🔍</span>
        </button>
      </div>

      {/* Detailed Analysis Panel */}
      {showDetailedAnalysis && (
        <div className="detailed-analysis mt-3 p-4 bg-neutral-50/80 border border-neutral-200/50 rounded-lg backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="analysis-item">
              <span className="font-medium text-neutral-700">Syllables:</span>
              <span className="ml-2 text-neutral-600">{prosodyData.syllableCount}</span>
            </div>

            <div className="analysis-item">
              <span className="font-medium text-neutral-700">Meter:</span>
              <span className="ml-2 text-neutral-600">{getMeterDescription(prosodyData.meterType)}</span>
            </div>

            <div className="analysis-item">
              <span className="font-medium text-neutral-700">Stability:</span>
              <span className={`ml-2 font-medium ${
                prosodyData.lineStability === 'stable' ? 'text-success-600' :
                prosodyData.lineStability === 'mixed' ? 'text-warm-600' :
                'text-red-600'
              }`}>
                {prosodyData.lineStability}
              </span>
            </div>
          </div>

          {/* Stress Pattern Visualization */}
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <span className="text-xs font-medium text-neutral-600 block mb-2">Stress Pattern:</span>
            <div className="stress-pattern-visual flex items-center gap-1 text-xs font-mono">
              {prosodyData.stressPattern.map((stress, index) => (
                <span
                  key={index}
                  className={`px-1 py-0.5 rounded ${
                    stress === 'stressed'
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {stress === 'stressed' ? '/' : '⌣'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function $createProsodyLineNode(lineText: string, lineNumber: number, prosodyData: ProsodyData): ProsodyLineNode {
  return new ProsodyLineNode(lineText, lineNumber, prosodyData)
}

export function $isProsodyLineNode(node: LexicalNode | null | undefined): node is ProsodyLineNode {
  return node instanceof ProsodyLineNode
}

// Function-based stress detection for single-syllable words (from songwriting pedagogy)
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

function countStressedSyllablesInLine(line: string): number {
  const words = line.trim().split(/\s+/).filter(word => word.length > 0);
  let stressedCount = 0;

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) continue;

    const syllableCount = countSyllables(cleanWord);

    if (syllableCount === 1) {
      // Single-syllable: use function-based detection
      if (isWordStressed(cleanWord)) {
        stressedCount += 1;
      }
    } else {
      // Multi-syllable: approximate as 1 stressed syllable per word
      stressedCount += 1;
    }
  }

  return stressedCount;
}

// Utility functions for prosody analysis
export function analyzeProsody(text: string): ProsodyData {
  // Use function-based stress detection for songwriting pedagogy

  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  const syllables = words.flatMap(word => estimateSyllables(word))
  const stressPattern = estimateStressPattern(syllables)

  const syllableCount = syllables.length
  const stressedSyllableCount = countStressedSyllablesInLine(text) // NEW: Function-based counting
  const meterType = detectMeter(stressPattern)
  const lineStability = assessLineStability(stressPattern)

  return {
    syllableCount,
    stressedSyllableCount, // NEW: Include stressed syllable count
    stressPattern,
    meterType,
    lineStability
  }
}

function estimateSyllables(word: string): string[] {
  // Very basic syllable estimation
  const vowelGroups = word.match(/[aeiouy]+/gi) || []
  const estimatedCount = Math.max(1, vowelGroups.length)

  // Return array of syllable parts (simplified)
  const syllableLength = Math.ceil(word.length / estimatedCount)
  const syllables: string[] = []

  for (let i = 0; i < estimatedCount; i++) {
    const start = i * syllableLength
    const end = Math.min(start + syllableLength, word.length)
    syllables.push(word.slice(start, end))
  }

  return syllables
}

function estimateStressPattern(syllables: string[]): ('stressed' | 'unstressed')[] {
  // Very simplified stress estimation
  // In reality, this would require phonetic dictionaries and complex rules
  return syllables.map((_, index) => {
    // Simple alternating pattern starting with unstressed
    return index % 2 === 1 ? 'stressed' : 'unstressed'
  })
}

function detectMeter(stressPattern: ('stressed' | 'unstressed')[]): string | undefined {
  if (stressPattern.length < 4) return undefined

  // Look for common meter patterns
  const patternString = stressPattern.map(s => s === 'stressed' ? '/' : 'u').join('')

  if (/^(u\/)+/.test(patternString)) return 'iambic'
  if (/^(\/u)+/.test(patternString)) return 'trochaic'
  if (/^(uu\/)+/.test(patternString)) return 'anapestic'
  if (/^(\/uu)+/.test(patternString)) return 'dactylic'

  return undefined
}

function assessLineStability(stressPattern: ('stressed' | 'unstressed')[]): 'stable' | 'mixed' | 'unstable' {
  if (stressPattern.length < 4) return 'unstable'

  // Check for consistency in the pattern
  const chunks = []
  for (let i = 0; i < stressPattern.length - 1; i += 2) {
    chunks.push(stressPattern.slice(i, i + 2))
  }

  const firstPattern = chunks[0]?.join('')
  const consistentChunks = chunks.filter(chunk => chunk.join('') === firstPattern).length
  const consistency = consistentChunks / chunks.length

  if (consistency >= 0.8) return 'stable'
  if (consistency >= 0.5) return 'mixed'
  return 'unstable'
}
