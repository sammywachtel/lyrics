import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { type Syllable, type StressPattern } from './StressedTextNode'
import React, { type ReactElement } from 'react'

export type SerializedStressMarkDecoratorNode = Spread<
  {
    word: string
    pattern: StressPattern
    className?: string
  },
  SerializedLexicalNode
>

/**
 * A decorator node that renders stress marks for a word using React components
 * This provides clean separation between Lexical state and visual rendering
 */
export class StressMarkDecoratorNode extends DecoratorNode<ReactElement> {
  __word: string
  __pattern: StressPattern
  __className: string

  static getType(): string {
    return 'stress-mark-decorator'
  }

  constructor(
    word: string,
    pattern: StressPattern,
    className: string = '',
    key?: NodeKey,
  ) {
    super(key)
    this.__word = word
    this.__pattern = pattern
    this.__className = className
  }

  static clone(node: StressMarkDecoratorNode): StressMarkDecoratorNode {
    return new StressMarkDecoratorNode(
      node.__word,
      node.__pattern,
      node.__className,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedStressMarkDecoratorNode): StressMarkDecoratorNode {
    const { word, pattern, className = '' } = serializedNode
    return $createStressMarkDecoratorNode(word, pattern, className)
  }

  exportJSON(): SerializedStressMarkDecoratorNode {
    return {
      word: this.__word,
      pattern: this.__pattern,
      className: this.__className,
      type: 'stress-mark-decorator',
      version: 1,
    }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: Node) => {
        const span = node as HTMLElement
        if (span.classList.contains('stress-decorated-word')) {
          return {
            conversion: convertStressDecoratorElement,
            priority: 1,
          }
        }
        return null
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.className = `stress-decorated-word ${this.__className}`.trim()
    element.setAttribute('data-word', this.__word)
    element.setAttribute('data-pattern', JSON.stringify(this.__pattern))

    // Create syllable elements for export
    this.__pattern.syllables.forEach((syllable, index) => {
      const syllableEl = document.createElement('span')
      syllableEl.className = `syllable ${syllable.stressed ? 'stressed' : 'unstressed'} ${syllable.overridden ? 'user-overridden' : 'auto-detected'}`
      syllableEl.textContent = syllable.text
      syllableEl.setAttribute('data-word', this.__word)
      syllableEl.setAttribute('data-syllable-index', index.toString())
      syllableEl.setAttribute('data-confidence', syllable.confidence.toString())
      element.appendChild(syllableEl)
    })

    return { element }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    span.className = `stress-decorated-word ${this.__className}`.trim()
    span.setAttribute('data-word', this.__word)
    return span
  }

  updateDOM(): false {
    // Decorator nodes handle their own updates through React
    return false
  }

  getWord(): string {
    return this.__word
  }

  getPattern(): StressPattern {
    return this.__pattern
  }

  setWord(word: string): this {
    const writable = this.getWritable()
    writable.__word = word
    return writable
  }

  setPattern(pattern: StressPattern): this {
    const writable = this.getWritable()
    writable.__pattern = { ...pattern }
    return writable
  }

  setClassName(className: string): this {
    const writable = this.getWritable()
    writable.__className = className
    return writable
  }

  getClassName(): string {
    return this.__className
  }

  decorate(): ReactElement {
    return <StressMarkComponent
      word={this.__word}
      pattern={this.__pattern}
      className={this.__className}
      nodeKey={this.getKey()}
    />
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): boolean {
    return false
  }
}

/**
 * React component that renders the stress marks
 */
interface StressMarkComponentProps {
  word: string
  pattern: StressPattern
  className?: string
  nodeKey: string
}

function StressMarkComponent({ word, pattern, className = '', nodeKey }: StressMarkComponentProps) {
  // console.log(`🎭 Rendering stress marks for: "${word}" with ${pattern.syllables.length} syllables`)

  const handleSyllableClick = React.useCallback((event: React.MouseEvent, syllableIndex: number) => {
    event.preventDefault()

    // Dispatch custom event for stress context menu
    const customEvent = new CustomEvent('stressMarkClick', {
      detail: {
        word,
        syllableIndex,
        nodeKey,
        x: event.clientX,
        y: event.clientY,
      },
      bubbles: true,
    })

    event.currentTarget.dispatchEvent(customEvent)
  }, [word, nodeKey])

  const handleContextMenu = React.useCallback((event: React.MouseEvent, syllableIndex: number) => {
    event.preventDefault()

    // Dispatch custom event for stress context menu
    const customEvent = new CustomEvent('stressMarkContextMenu', {
      detail: {
        word,
        syllableIndex,
        nodeKey,
        x: event.clientX,
        y: event.clientY,
      },
      bubbles: true,
    })

    event.currentTarget.dispatchEvent(customEvent)
  }, [word, nodeKey])

  return (
    <span
      className={`word-stress-container ${className}`.trim()}
      data-word={word}
      data-node-key={nodeKey}
    >
      {pattern.syllables.map((syllable, index) => {
        const confidenceClass = syllable.confidence > 0.8 ? 'high-confidence' :
                               syllable.confidence < 0.5 ? 'low-confidence' : ''

        const stressClass = syllable.stressed ? 'stressed' : 'unstressed'
        const overrideClass = syllable.overridden ? 'user-overridden' : 'auto-detected'

        return (
          <span
            key={index}
            className={`syllable ${stressClass} ${overrideClass} ${confidenceClass}`.trim()}
            data-word={word}
            data-syllable-index={index}
            data-confidence={syllable.confidence}
            onClick={(e) => handleSyllableClick(e, index)}
            onContextMenu={(e) => handleContextMenu(e, index)}
            style={{ cursor: 'pointer' }}
          >
            {syllable.text}
          </span>
        )
      })}
    </span>
  )
}

/**
 * Create a new StressMarkDecoratorNode
 */
export function $createStressMarkDecoratorNode(
  word: string,
  pattern: StressPattern,
  className: string = ''
): StressMarkDecoratorNode {
  return $applyNodeReplacement(new StressMarkDecoratorNode(word, pattern, className))
}

/**
 * Check if a node is a StressMarkDecoratorNode
 */
export function $isStressMarkDecoratorNode(
  node: LexicalNode | null | undefined,
): node is StressMarkDecoratorNode {
  return node instanceof StressMarkDecoratorNode
}

/**
 * DOM conversion helper for importing stress decorator elements
 */
function convertStressDecoratorElement(domNode: Node): DOMConversionOutput | null {
  const element = domNode as HTMLElement
  const word = element.getAttribute('data-word')
  const patternData = element.getAttribute('data-pattern')

  if (!word) return null

  let pattern: StressPattern

  if (patternData) {
    try {
      pattern = JSON.parse(patternData)
    } catch {
      // Fallback: extract from DOM structure
      pattern = extractPatternFromDOM(element)
    }
  } else {
    pattern = extractPatternFromDOM(element)
  }

  const className = element.className
    .replace(/\bstress-decorated-word\b/, '')
    .trim()

  return {
    node: $createStressMarkDecoratorNode(word, pattern, className),
  }
}

/**
 * Extract stress pattern from DOM elements (for importing)
 */
function extractPatternFromDOM(element: HTMLElement): StressPattern {
  const syllableElements = element.querySelectorAll('.syllable')
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

  if (syllables.length === 0) {
    // Fallback: create single syllable from text content
    const text = element.textContent || ''
    syllables.push({
      text,
      stressed: true, // Default assumption
      confidence: 0.5,
      position: 0,
      overridden: false,
    })
  }

  return {
    syllables,
    overridden: syllables.some(s => s.overridden),
  }
}
