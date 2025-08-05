import {
  TextNode,
  NodeKey,
  LexicalNode,
  SerializedTextNode,
  Spread,
  EditorConfig,
  type LexicalEditor,
} from 'lexical'

export interface SerializedSyllableNode extends Spread<
  {
    syllableCount: number
    stress: 'stressed' | 'unstressed' | 'secondary'
  },
  SerializedTextNode
> {
  type: 'syllable'
  version: 1
}

export class SyllableNode extends TextNode {
  __syllableCount: number
  __stress: 'stressed' | 'unstressed' | 'secondary'

  static getType(): string {
    return 'syllable'
  }

  static clone(node: SyllableNode): SyllableNode {
    return new SyllableNode(
      node.__text,
      node.__syllableCount,
      node.__stress,
      node.__key
    )
  }

  constructor(
    text: string,
    syllableCount: number = 1,
    stress: 'stressed' | 'unstressed' | 'secondary' = 'unstressed',
    key?: NodeKey
  ) {
    super(text, key)
    this.__syllableCount = syllableCount
    this.__stress = stress
  }

  getSyllableCount(): number {
    return this.__syllableCount
  }

  getStress(): 'stressed' | 'unstressed' | 'secondary' {
    return this.__stress
  }

  setSyllableCount(syllableCount: number): void {
    const writableNode = this.getWritable()
    writableNode.__syllableCount = syllableCount
  }

  setStress(stress: 'stressed' | 'unstressed' | 'secondary'): void {
    const writableNode = this.getWritable()
    writableNode.__stress = stress
  }

  static importJSON(serializedNode: SerializedSyllableNode): SyllableNode {
    const { text, syllableCount, stress } = serializedNode
    return new SyllableNode(text, syllableCount, stress)
  }

  exportJSON(): SerializedSyllableNode {
    return {
      ...super.exportJSON(),
      syllableCount: this.__syllableCount,
      stress: this.__stress,
      type: 'syllable',
      version: 1,
    }
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = super.createDOM(config, editor)
    element.classList.add('syllable-node')
    
    // Add stress class for styling
    switch (this.__stress) {
      case 'stressed':
        element.classList.add('syllable-stressed')
        break
      case 'secondary':
        element.classList.add('syllable-secondary')
        break
      case 'unstressed':
        element.classList.add('syllable-unstressed')
        break
    }
    
    // Add data attributes
    element.setAttribute('data-syllable-count', this.__syllableCount.toString())
    element.setAttribute('data-stress', this.__stress)
    
    return element
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (dom !== null) {
      // Update classes if stress changed
      if (prevNode.__stress !== this.__stress) {
        dom.classList.remove('syllable-stressed', 'syllable-secondary', 'syllable-unstressed')
        switch (this.__stress) {
          case 'stressed':
            dom.classList.add('syllable-stressed')
            break
          case 'secondary':
            dom.classList.add('syllable-secondary')
            break
          case 'unstressed':
            dom.classList.add('syllable-unstressed')
            break
        }
      }
      
      // Update data attributes
      dom.setAttribute('data-syllable-count', this.__syllableCount.toString())
      dom.setAttribute('data-stress', this.__stress)
    }
    
    return super.updateDOM(prevNode as this, dom, config)
  }
}

export function $createSyllableNode(
  text: string,
  syllableCount: number = 1,
  stress: 'stressed' | 'unstressed' | 'secondary' = 'unstressed'
): SyllableNode {
  return new SyllableNode(text, syllableCount, stress)
}

export function $isSyllableNode(node: LexicalNode | null | undefined): node is SyllableNode {
  return node instanceof SyllableNode
}