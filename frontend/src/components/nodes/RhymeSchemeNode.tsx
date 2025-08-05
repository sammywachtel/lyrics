import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  LexicalEditor,
  EditorConfig,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import React from 'react'

export interface SerializedRhymeSchemeNode extends Spread<{
  rhymeLetter: string
  rhymeSound: string
  type: 'rhyme-scheme'
  version: 1
}, SerializedLexicalNode> {}

export class RhymeSchemeNode extends DecoratorNode<React.ReactElement> {
  __rhymeLetter: string
  __rhymeSound: string

  static getType(): string {
    return 'rhyme-scheme'
  }

  static clone(node: RhymeSchemeNode): RhymeSchemeNode {
    return new RhymeSchemeNode(node.__rhymeLetter, node.__rhymeSound, node.__key)
  }

  constructor(rhymeLetter: string, rhymeSound: string, key?: NodeKey) {
    super(key)
    this.__rhymeLetter = rhymeLetter
    this.__rhymeSound = rhymeSound
  }

  getRhymeLetter(): string {
    return this.__rhymeLetter
  }

  getRhymeSound(): string {
    return this.__rhymeSound
  }

  setRhymeLetter(rhymeLetter: string): void {
    const writable = this.getWritable()
    writable.__rhymeLetter = rhymeLetter
  }

  setRhymeSound(rhymeSound: string): void {
    const writable = this.getWritable()
    writable.__rhymeSound = rhymeSound
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span')
    dom.className = 'rhyme-scheme-wrapper'
    return dom
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedRhymeSchemeNode): RhymeSchemeNode {
    const { rhymeLetter, rhymeSound } = serializedNode
    return $createRhymeSchemeNode(rhymeLetter, rhymeSound)
  }

  exportJSON(): SerializedRhymeSchemeNode {
    return {
      rhymeLetter: this.__rhymeLetter,
      rhymeSound: this.__rhymeSound,
      type: 'rhyme-scheme',
      version: 1,
    }
  }

  getTextContent(): string {
    return '' // This node doesn't contribute to text content
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): boolean {
    return false
  }

  canBeEmpty(): true {
    return true
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }

  decorate(editor: LexicalEditor, config: EditorConfig): React.ReactElement {
    return <RhymeSchemeComponent rhymeLetter={this.__rhymeLetter} rhymeSound={this.__rhymeSound} nodeKey={this.__key} editor={editor} />
  }
}

interface RhymeSchemeComponentProps {
  rhymeLetter: string
  rhymeSound: string
  nodeKey: NodeKey
  editor: LexicalEditor
}

function RhymeSchemeComponent({ rhymeLetter, rhymeSound, nodeKey, editor }: RhymeSchemeComponentProps): React.ReactElement {
  const [isHovered, setIsHovered] = React.useState(false)

  // Get color for rhyme letter
  const getRhymeColor = (letter: string) => {
    const colors = {
      'a': 'bg-primary-500',
      'b': 'bg-success-500', 
      'c': 'bg-creative-500',
      'd': 'bg-warm-500',
      'e': 'bg-red-500',
      'f': 'bg-pink-500',
      'g': 'bg-teal-500',
      'h': 'bg-orange-500',
    }
    return colors[letter.toLowerCase() as keyof typeof colors] || 'bg-neutral-500'
  }

  const handleClick = () => {
    // Show rhyme connections or edit rhyme assignment
    editor.update(() => {
      console.log('Rhyme scheme clicked:', rhymeLetter, rhymeSound)
      // Could implement rhyme editing or highlighting of connected rhymes
    })
  }

  return (
    <span 
      className="rhyme-scheme-node absolute right-0 top-0 inline-flex items-center cursor-pointer z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={`Rhyme: ${rhymeLetter.toUpperCase()} (${rhymeSound})`}
    >
      {/* Rhyme Badge */}
      <span 
        className={`rhyme-badge ${getRhymeColor(rhymeLetter)} text-white font-bold text-xs w-5 h-5 rounded flex items-center justify-center transition-all duration-200 transform ${
          isHovered ? 'scale-110 shadow-md' : ''
        }`}
      >
        {rhymeLetter.toUpperCase()}
      </span>
      
      {/* Rhyme Sound Tooltip */}
      {isHovered && (
        <span className="absolute -top-8 right-0 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap shadow-lg">
          /{rhymeSound}/
        </span>
      )}
    </span>
  )
}

export function $createRhymeSchemeNode(rhymeLetter: string, rhymeSound: string): RhymeSchemeNode {
  return new RhymeSchemeNode(rhymeLetter, rhymeSound)
}

export function $isRhymeSchemeNode(node: LexicalNode | null | undefined): node is RhymeSchemeNode {
  return node instanceof RhymeSchemeNode
}

// Utility functions for rhyme analysis
export function detectRhymeSound(word: string): string {
  // This is a very simplified phonetic ending detector
  // In a real implementation, you'd use a proper phonetic dictionary
  const word_lower = word.toLowerCase().replace(/[^a-z]/g, '')
  
  // Simple patterns for common English rhyme sounds
  const rhymePatterns = [
    { pattern: /ight$/, sound: 'aɪt' },
    { pattern: /ation$/, sound: 'eɪʃən' },
    { pattern: /ing$/, sound: 'ɪŋ' },
    { pattern: /ed$/, sound: 'ɛd' },
    { pattern: /er$/, sound: 'ər' },
    { pattern: /ly$/, sound: 'li' },
    { pattern: /ness$/, sound: 'nəs' },
    { pattern: /ment$/, sound: 'mənt' },
    { pattern: /ful$/, sound: 'fəl' },
    { pattern: /less$/, sound: 'ləs' },
  ]
  
  for (const { pattern, sound } of rhymePatterns) {
    if (pattern.test(word_lower)) {
      return sound
    }
  }
  
  // Fallback: use last 2-3 characters as a simple approximation
  return word_lower.slice(-2) || word_lower
}

export function assignRhymeLetter(rhymeSound: string, existingRhymes: Map<string, string>): string {
  // Check if this rhyme sound already has a letter
  for (const [sound, letter] of existingRhymes.entries()) {
    if (sound === rhymeSound) {
      return letter
    }
  }
  
  // Assign next available letter
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const usedLetters = new Set(existingRhymes.values())
  
  for (const letter of letters) {
    if (!usedLetters.has(letter)) {
      return letter
    }
  }
  
  return 'x' // Fallback if we run out of letters
}