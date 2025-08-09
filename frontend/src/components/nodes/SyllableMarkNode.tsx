import {
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type LexicalNode,
} from 'lexical'
import React from 'react'

export interface SerializedSyllableMarkNode extends Spread<{
  syllables: string[]
  type: 'syllable-mark'
  version: 1
}, SerializedLexicalNode> {
  syllables: string[]
  type: 'syllable-mark'
  version: 1
}

export class SyllableMarkNode extends DecoratorNode<React.ReactElement> {
  __syllables: string[]

  static getType(): string {
    return 'syllable-mark'
  }

  static clone(node: SyllableMarkNode): SyllableMarkNode {
    return new SyllableMarkNode(node.__syllables, node.__key)
  }

  constructor(syllables: string[], key?: NodeKey) {
    super(key)
    this.__syllables = syllables
  }

  getSyllables(): string[] {
    return this.__syllables
  }

  setSyllables(syllables: string[]): void {
    const writable = this.getWritable()
    writable.__syllables = syllables
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('span')
    dom.className = 'syllable-mark-wrapper'
    return dom
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedSyllableMarkNode): SyllableMarkNode {
    const { syllables } = serializedNode
    return $createSyllableMarkNode(syllables)
  }

  exportJSON(): SerializedSyllableMarkNode {
    return {
      syllables: this.__syllables,
      type: 'syllable-mark',
      version: 1,
    }
  }

  getTextContent(): string {
    return this.__syllables.join('')
  }

  isInline(): true {
    return true
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
    return <SyllableMarkComponent syllables={this.__syllables} />
  }
}

interface SyllableMarkComponentProps {
  syllables: string[]
}

function SyllableMarkComponent({ syllables }: SyllableMarkComponentProps): React.ReactElement {
  const [isHovered, setIsHovered] = React.useState(false)

  const handleClick = () => {
    // Toggle syllable visibility or edit mode
    console.log('Syllable node clicked:', syllables)
  }

  // Calculate syllable stress pattern (simplified)
  const getStressPattern = (syllables: string[]) => {
    return syllables.map((_syllable, index) => {
      // Simple heuristic: alternating stress pattern starting with unstressed
      // In a real implementation, this would use phonetic analysis
      return index % 2 === 1 ? 'stressed' : 'unstressed'
    })
  }

  const stressPattern = getStressPattern(syllables)

  return (
    <span
      className="syllable-mark-node inline-flex items-baseline relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={`Syllables: ${syllables.join('•')} (${syllables.length})`}
    >
      {syllables.map((syllable, index) => (
        <React.Fragment key={index}>
          <span
            className={`syllable relative transition-all duration-200 ${
              stressPattern[index] === 'stressed'
                ? 'font-semibold text-primary-700'
                : 'text-neutral-700'
            }`}
          >
            {syllable}

            {/* Stress indicator */}
            {isHovered && (
              <span
                className={`absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs transition-opacity duration-200 ${
                  stressPattern[index] === 'stressed'
                    ? 'text-primary-500'
                    : 'text-neutral-400'
                }`}
              >
                {stressPattern[index] === 'stressed' ? '●' : '○'}
              </span>
            )}
          </span>

          {/* Syllable separator */}
          {index < syllables.length - 1 && (
            <span className={`syllable-separator mx-0.5 text-xs transition-all duration-200 ${
              isHovered
                ? 'text-creative-500 opacity-100'
                : 'text-neutral-300 opacity-60'
            }`}>
              •
            </span>
          )}
        </React.Fragment>
      ))}

      {/* Syllable count badge */}
      {isHovered && (
        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-creative-100 text-creative-700 text-xs rounded border border-creative-200 shadow-soft whitespace-nowrap">
          {syllables.length} syllable{syllables.length !== 1 ? 's' : ''}
        </span>
      )}
    </span>
  )
}

export function $createSyllableMarkNode(syllables: string[]): SyllableMarkNode {
  return new SyllableMarkNode(syllables)
}

export function $isSyllableMarkNode(node: LexicalNode | null | undefined): node is SyllableMarkNode {
  return node instanceof SyllableMarkNode
}

// Utility function to break text into syllables (simplified)
export function breakIntoSyllables(text: string): string[] {
  // This is a very basic syllable breaking algorithm
  // In a real implementation, you'd use a proper syllabification library
  const vowels = 'aeiouyAEIOUY'
  const syllables: string[] = []
  let currentSyllable = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    currentSyllable += char

    // Very basic rule: break after a vowel if the next character is a consonant
    if (vowels.includes(char) && i < text.length - 1 && !vowels.includes(text[i + 1])) {
      // Look ahead to see if we should break here
      if (i < text.length - 2 && vowels.includes(text[i + 2])) {
        syllables.push(currentSyllable)
        currentSyllable = ''
      }
    }
  }

  if (currentSyllable) {
    syllables.push(currentSyllable)
  }

  return syllables.length > 0 ? syllables : [text]
}
