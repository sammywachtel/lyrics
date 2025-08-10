import {
  ParagraphNode,
  type NodeKey,
  type SerializedParagraphNode,
  type Spread,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type EditorConfig,
  type LexicalEditor
} from 'lexical'

export interface SerializedSectionParagraphNode extends Spread<
  {
    sectionType: string | null
  },
  SerializedParagraphNode
> {
  type: 'section-paragraph'
  version: 1
}

export class SectionParagraphNode extends ParagraphNode {
  __sectionType: string | null

  static getType(): string {
    return 'section-paragraph'
  }

  static clone(node: SectionParagraphNode): SectionParagraphNode {
    return new SectionParagraphNode(
      node.__sectionType,
      node.getFormat(),
      node.getIndent(),
      node.getDirection(),
      node.__key
    )
  }

  constructor(
    sectionType: string | null = null,
    format?: number,
    indent?: number,
    direction?: 'ltr' | 'rtl' | null,
    key?: NodeKey
  ) {
    super(key)
    this.__sectionType = sectionType

    // Set properties directly during construction to avoid read-only mode issues
    if (format !== undefined) {
      this.__format = format
    }
    if (indent !== undefined) {
      this.__indent = indent
    }
    if (direction !== undefined) {
      this.__dir = direction
    }
  }

  getSectionType(): string | null {
    return this.__sectionType
  }

  setSectionType(sectionType: string | null): void {
    const writableNode = this.getWritable()
    writableNode.__sectionType = sectionType
  }

  static importJSON(serializedNode: SerializedSectionParagraphNode): SectionParagraphNode {
    const { sectionType } = serializedNode
    const node = new SectionParagraphNode(sectionType)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedSectionParagraphNode {
    return {
      ...super.exportJSON(),
      sectionType: this.__sectionType,
      type: 'section-paragraph',
      version: 1,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)

    if (this.__sectionType) {
      element.classList.add(`lexical-text-${this.__sectionType}`)
    }

    return element
  }

  updateDOM(prevNode: SectionParagraphNode, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config)

    // Handle section type changes
    if (prevNode.__sectionType !== this.__sectionType) {
      // Remove previous section class
      if (prevNode.__sectionType) {
        dom.classList.remove(`lexical-text-${prevNode.__sectionType}`)
      }

      // Add new section class
      if (this.__sectionType) {
        dom.classList.add(`lexical-text-${this.__sectionType}`)
      }

      return true
    }

    return isUpdated
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: () => ({
        conversion: convertParagraphElement,
        priority: 1,
      }),
    }
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor)

    if (this.__sectionType && element && element instanceof HTMLElement) {
      element.classList.add(`lexical-text-${this.__sectionType}`)
    }

    return { element }
  }

}

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
  let sectionType: string | null = null

  // Check for section formatting classes
  const sectionFormats = ['verse', 'chorus', 'pre-chorus', 'bridge', 'intro', 'outro', 'hook']
  for (const format of sectionFormats) {
    if (element.classList && element.classList.contains(`lexical-text-${format}`)) {
      sectionType = format
      break
    }
  }

  return {
    node: new SectionParagraphNode(sectionType),
  }
}

export function $createSectionParagraphNode(sectionType: string | null = null): SectionParagraphNode {
  return new SectionParagraphNode(sectionType)
}

export function $isSectionParagraphNode(node: LexicalNode | null | undefined): node is SectionParagraphNode {
  return node instanceof SectionParagraphNode
}

// Helper function to convert a regular paragraph to a section paragraph
export function $convertToSectionParagraph(node: ParagraphNode, sectionType: string | null): SectionParagraphNode {
  // Extract properties from the original paragraph
  const format = node.getFormat()
  const indent = node.getIndent()
  const direction = node.getDirection()

  // Create section paragraph with all properties passed to constructor
  const sectionParagraph = new SectionParagraphNode(
    sectionType,
    format,
    indent,
    direction
  )

  // Move all children
  const children = node.getChildren()
  for (const child of children) {
    sectionParagraph.append(child)
  }

  return sectionParagraph
}
