import { createEditor, type LexicalEditor } from 'lexical'
import { createEmptyHistoryState } from '@lexical/history'
import { SectionParagraphNode } from '../lexical/nodes/SectionParagraphNode'
import { SectionNode } from '../lexical/nodes/SectionNode'
import { SyllableNode } from '../lexical/nodes/SyllableNode'
import { RhymeNode } from '../lexical/nodes/RhymeNode'

export function createTestEditor(): LexicalEditor {
  const editor = createEditor({
    namespace: 'test',
    nodes: [
      SectionParagraphNode,
      SectionNode,
      SyllableNode,
      RhymeNode,
    ],
    onError: (error) => {
      throw error
    }
  })
  
  return editor
}

// Create initial config for test Lexical composer
export function createTestLexicalConfig() {
  return {
    namespace: 'test',
    nodes: [
      SectionParagraphNode,
      SectionNode,
      SyllableNode,
      RhymeNode,
    ],
    onError: (error: Error) => {
      throw error
    }
  }
}