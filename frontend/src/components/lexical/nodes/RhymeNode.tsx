import {
  TextNode,
  NodeKey,
  LexicalNode,
  SerializedTextNode,
  Spread,
  EditorConfig,
  type LexicalEditor,
} from 'lexical'

export interface SerializedRhymeNode extends Spread<
  {
    rhymeScheme: string
    rhymeGroup: string
  },
  SerializedTextNode
> {
  type: 'rhyme'
  version: 1
}

export class RhymeNode extends TextNode {
  __rhymeScheme: string
  __rhymeGroup: string

  static getType(): string {
    return 'rhyme'
  }

  static clone(node: RhymeNode): RhymeNode {
    return new RhymeNode(
      node.__text,
      node.__rhymeScheme,
      node.__rhymeGroup,
      node.__key
    )
  }

  constructor(
    text: string,
    rhymeScheme: string = '',
    rhymeGroup: string = '',
    key?: NodeKey
  ) {
    super(text, key)
    this.__rhymeScheme = rhymeScheme
    this.__rhymeGroup = rhymeGroup
  }

  getRhymeScheme(): string {
    return this.__rhymeScheme
  }

  getRhymeGroup(): string {
    return this.__rhymeGroup
  }

  setRhymeScheme(rhymeScheme: string): void {
    const writableNode = this.getWritable()
    writableNode.__rhymeScheme = rhymeScheme
  }

  setRhymeGroup(rhymeGroup: string): void {
    const writableNode = this.getWritable()
    writableNode.__rhymeGroup = rhymeGroup
  }

  static importJSON(serializedNode: SerializedRhymeNode): RhymeNode {
    const { text, rhymeScheme, rhymeGroup } = serializedNode
    return new RhymeNode(text, rhymeScheme, rhymeGroup)
  }

  exportJSON(): SerializedRhymeNode {
    return {
      ...super.exportJSON(),
      rhymeScheme: this.__rhymeScheme,
      rhymeGroup: this.__rhymeGroup,
      type: 'rhyme',
      version: 1,
    }
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = super.createDOM(config, editor)
    element.classList.add('rhyme-node')
    
    // Add rhyme scheme class for coloring
    if (this.__rhymeScheme) {
      element.classList.add(`rhyme-${this.__rhymeScheme.toLowerCase()}`)
    }
    
    // Add data attributes
    element.setAttribute('data-rhyme-scheme', this.__rhymeScheme)
    element.setAttribute('data-rhyme-group', this.__rhymeGroup)
    
    return element
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (dom !== null) {
      // Update rhyme scheme class if it changed
      if (prevNode.__rhymeScheme !== this.__rhymeScheme) {
        // Remove old rhyme class
        if (prevNode.__rhymeScheme) {
          dom.classList.remove(`rhyme-${prevNode.__rhymeScheme.toLowerCase()}`)
        }
        // Add new rhyme class
        if (this.__rhymeScheme) {
          dom.classList.add(`rhyme-${this.__rhymeScheme.toLowerCase()}`)
        }
      }
      
      // Update data attributes
      dom.setAttribute('data-rhyme-scheme', this.__rhymeScheme)
      dom.setAttribute('data-rhyme-group', this.__rhymeGroup)
    }
    
    return super.updateDOM(prevNode as this, dom, config)
  }
}

export function $createRhymeNode(
  text: string,
  rhymeScheme: string = '',
  rhymeGroup: string = ''
): RhymeNode {
  return new RhymeNode(text, rhymeScheme, rhymeGroup)
}

export function $isRhymeNode(node: LexicalNode | null | undefined): node is RhymeNode {
  return node instanceof RhymeNode
}