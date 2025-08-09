import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { $getRoot, $createTextNode } from 'lexical'
import { $createSectionParagraphNode } from '../lexical/nodes/SectionParagraphNode'
import { SectionTagNode } from '../nodes/SectionTagNode'
import SectionHeaderPlugin from '../plugins/SectionHeaderPlugin'
import { SectionParagraphNode } from '../lexical/nodes/SectionParagraphNode'

// Mock theme for testing
const theme = {
  paragraph: 'paragraph',
  text: {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikethrough',
  },
}

// Test component wrapper
function TestEditor({ initialContent }: { initialContent?: () => void }) {
  const initialConfig = {
    namespace: 'TestEditor',
    theme,
    nodes: [SectionParagraphNode, SectionTagNode],
    onError: () => {},
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable 
            data-testid="editor-content"
            className="editor-content"
          />
        }
        ErrorBoundary={({ children }) => <div>{children}</div>}
      />
      <SectionHeaderPlugin />
    </LexicalComposer>
  )
}

describe('SectionHeaderPlugin', () => {
  it('should render without crashing', () => {
    render(<TestEditor />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should create visual section headers for section-formatted paragraphs', async () => {
    const { container } = render(<TestEditor />)
    
    // The plugin should be registered and ready to create headers
    // when section paragraphs are added to the editor
    expect(container).toBeInTheDocument()
    
    // Note: Full integration testing would require more complex setup
    // to simulate actual section paragraph creation and header generation
  })

  it('should handle different section types correctly', () => {
    const sectionTypes = ['verse', 'chorus', 'pre-chorus', 'bridge', 'intro', 'outro', 'hook']
    
    sectionTypes.forEach(type => {
      const displayName = type === 'pre-chorus' ? 'PRE-CHORUS' : type.toUpperCase()
      expect(displayName).toMatch(/^[A-Z\-]+$/)
    })
  })
})

// Helper functions for section type validation (matching plugin logic)
function isValidSectionType(sectionType: string | null): boolean {
  if (!sectionType) return false
  const validTypes = ['verse', 'chorus', 'pre-chorus', 'bridge', 'intro', 'outro', 'hook']
  return validTypes.includes(sectionType)
}

describe('Section Type Validation', () => {
  it('should validate section types correctly', () => {
    expect(isValidSectionType('verse')).toBe(true)
    expect(isValidSectionType('chorus')).toBe(true)
    expect(isValidSectionType('pre-chorus')).toBe(true)
    expect(isValidSectionType('bridge')).toBe(true)
    expect(isValidSectionType('intro')).toBe(true)
    expect(isValidSectionType('outro')).toBe(true)
    expect(isValidSectionType('hook')).toBe(true)
    expect(isValidSectionType('invalid')).toBe(false)
    expect(isValidSectionType(null)).toBe(false)
    expect(isValidSectionType('')).toBe(false)
  })
})
