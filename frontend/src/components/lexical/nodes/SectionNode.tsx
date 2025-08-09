import React from 'react'
import {
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type LexicalNode,
} from 'lexical'

export interface SerializedSectionNode extends Spread<
  {
    sectionName: string
    sectionType: string
  },
  SerializedLexicalNode
> {
  type: 'section'
  version: 1
}

export class SectionNode extends DecoratorNode<React.JSX.Element> {
  __sectionName: string
  __sectionType: string

  static getType(): string {
    return 'section'
  }

  static clone(node: SectionNode): SectionNode {
    return new SectionNode(node.__sectionName, node.__sectionType, node.__key)
  }

  constructor(sectionName: string, sectionType: string, key?: NodeKey) {
    super(key)
    this.__sectionName = sectionName
    this.__sectionType = sectionType
  }

  getSectionName(): string {
    return this.__sectionName
  }

  getSectionType(): string {
    return this.__sectionType
  }

  setSectionName(sectionName: string): void {
    const writableNode = this.getWritable()
    writableNode.__sectionName = sectionName
  }

  setSectionType(sectionType: string): void {
    const writableNode = this.getWritable()
    writableNode.__sectionType = sectionType
  }

  static importJSON(serializedNode: SerializedSectionNode): SectionNode {
    const { sectionName, sectionType } = serializedNode
    return new SectionNode(sectionName, sectionType)
  }

  exportJSON(): SerializedSectionNode {
    return {
      sectionName: this.__sectionName,
      sectionType: this.__sectionType,
      type: 'section',
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.classList.add('section-node')
    return div
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  decorate(): React.JSX.Element {
    return (
      <SectionComponent
        sectionName={this.__sectionName}
        sectionType={this.__sectionType}
        nodeKey={this.__key}
      />
    )
  }
}

// React component for rendering the section
interface SectionComponentProps {
  sectionName: string
  sectionType: string
  nodeKey: NodeKey
}

const SectionComponent: React.FC<SectionComponentProps> = ({
  sectionName,
  sectionType,
}) => {
  return (
    <div
      className="section-border flex items-center justify-between py-3 px-4 my-4 bg-gradient-to-r from-primary-50/50 to-creative-50/50 border border-primary-200/30 rounded-xl shadow-soft"
      data-section={sectionName}
      data-section-type={sectionType}
      contentEditable={false}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-creative-500" />
        <span className="text-sm font-semibold text-primary-800 uppercase tracking-wide">
          {sectionName}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="px-2 py-1 bg-white/60 rounded-md border border-neutral-200/50">
          {sectionType}
        </span>
      </div>
    </div>
  )
}

export function $createSectionNode(sectionName: string, sectionType: string): SectionNode {
  return new SectionNode(sectionName, sectionType)
}

export function $isSectionNode(node: LexicalNode | null | undefined): node is SectionNode {
  return node instanceof SectionNode
}
