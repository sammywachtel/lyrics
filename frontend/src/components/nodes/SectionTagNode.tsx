import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  LexicalEditor,
  EditorConfig,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import React from 'react'

export interface SerializedSectionTagNode extends Spread<{
  sectionName: string
  type: 'section-tag'
  version: 1
}, SerializedLexicalNode> {}

export class SectionTagNode extends DecoratorNode<React.ReactElement> {
  __sectionName: string

  static getType(): string {
    return 'section-tag'
  }

  static clone(node: SectionTagNode): SectionTagNode {
    return new SectionTagNode(node.__sectionName, node.__key)
  }

  constructor(sectionName: string, key?: NodeKey) {
    super(key)
    this.__sectionName = sectionName
  }

  getSectionName(): string {
    return this.__sectionName
  }

  setSectionName(sectionName: string): void {
    const writable = this.getWritable()
    writable.__sectionName = sectionName
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div')
    dom.className = 'section-tag-wrapper'
    return dom
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedSectionTagNode): SectionTagNode {
    const { sectionName } = serializedNode
    return $createSectionTagNode(sectionName)
  }

  exportJSON(): SerializedSectionTagNode {
    return {
      sectionName: this.__sectionName,
      type: 'section-tag',
      version: 1,
    }
  }

  getTextContent(): string {
    return `[${this.__sectionName}]`
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

  canInsertTextBefore(): false {
    return false
  }

  canInsertTextAfter(): false {
    return false
  }

  decorate(editor: LexicalEditor, config: EditorConfig): React.ReactElement {
    return <SectionTagComponent sectionName={this.__sectionName} nodeKey={this.__key} editor={editor} />
  }
}

interface SectionTagComponentProps {
  sectionName: string
  nodeKey: NodeKey
  editor: LexicalEditor
}

function SectionTagComponent({ sectionName, nodeKey, editor }: SectionTagComponentProps): React.ReactElement {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(sectionName)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(sectionName)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== sectionName) {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey) as SectionTagNode
        if (node) {
          node.setSectionName(editValue.trim())
        }
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(sectionName)
    }
  }

  const handleDelete = () => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey)
      if (node) {
        node.remove()
      }
    })
  }

  // Get section icon based on type
  const getSectionIcon = (name: string) => {
    const lowercaseName = name.toLowerCase()
    if (lowercaseName.includes('verse')) return '📝'
    if (lowercaseName.includes('chorus') && !lowercaseName.includes('pre')) return '🎵'
    if (lowercaseName.includes('pre-chorus') || lowercaseName.includes('prechorus')) return '✨'
    if (lowercaseName.includes('bridge')) return '🌉'
    if (lowercaseName.includes('intro')) return '🎧'
    if (lowercaseName.includes('outro')) return '🎼'
    if (lowercaseName.includes('hook')) return '🎣'
    return '🎶'
  }

  return (
    <div className="section-tag-node my-6 first:mt-0" data-section={sectionName}>
      {/* Visual Section Separator */}
      <div className="section-border" data-section={sectionName} aria-label={`Section: ${sectionName}`}></div>
      
      {/* Section Tag */}
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          {/* Section Label */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-creative-100 text-primary-800 rounded-lg border border-primary-200/50 shadow-soft backdrop-blur-sm">
            <span className="text-lg">{getSectionIcon(sectionName)}</span>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none font-semibold text-sm min-w-20 max-w-40"
                placeholder="Section name"
              />
            ) : (
              <span 
                className="font-semibold text-sm cursor-pointer hover:text-primary-900 transition-colors"
                onClick={handleEdit}
                title="Click to edit section name"
              >
                {sectionName}
              </span>
            )}
          </div>
          
          {/* Section Line */}
          <div className="flex-1 h-px bg-gradient-to-r from-primary-300/60 via-creative-300/60 to-transparent"></div>
        </div>
        
        {/* Section Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleEdit}
            className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-all duration-200"
            title="Edit section name"
          >
            <span className="text-sm">✏️</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
            title="Delete section"
          >
            <span className="text-sm">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function $createSectionTagNode(sectionName: string): SectionTagNode {
  return new SectionTagNode(sectionName)
}

export function $isSectionTagNode(node: LexicalNode | null | undefined): node is SectionTagNode {
  return node instanceof SectionTagNode
}