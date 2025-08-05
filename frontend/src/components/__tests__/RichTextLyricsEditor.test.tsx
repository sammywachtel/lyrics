import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import RichTextLyricsEditor from '../RichTextLyricsEditor'

// Mock Lexical components since they require complex setup
jest.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lexical-composer">{children}</div>
  ),
}))

jest.mock('@lexical/react/LexicalRichTextPlugin', () => ({
  RichTextPlugin: ({ contentEditable, placeholder }: { contentEditable: React.ReactNode; placeholder?: React.ReactNode }) => (
    <div data-testid="rich-text-plugin">
      {contentEditable}
      {placeholder}
    </div>
  ),
}))

jest.mock('@lexical/react/LexicalContentEditable', () => ({
  ContentEditable: ({ className, ...props }: { className?: string; placeholder?: string; [key: string]: unknown }) => (
    <div 
      data-testid="content-editable"
      className={className}
      {...props}
    >
      Content Editable
    </div>
  ),
}))

jest.mock('@lexical/react/LexicalHistoryPlugin', () => ({
  HistoryPlugin: () => <div data-testid="history-plugin" />,
}))

jest.mock('@lexical/react/LexicalOnChangePlugin', () => ({
  OnChangePlugin: () => <div data-testid="on-change-plugin" />,
}))

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [
    {
      registerCommand: jest.fn(),
      update: jest.fn(),
      focus: jest.fn(),
      dispatchCommand: jest.fn(),
      getEditorState: () => ({
        read: (fn: () => unknown) => fn(),
      }),
      getRootElement: () => document.createElement('div'),
    },
  ],
}))

// Mock the custom nodes and plugins
jest.mock('../lexical/nodes/SectionNode', () => ({
  SectionNode: class MockSectionNode {},
}))

jest.mock('../lexical/nodes/SyllableNode', () => ({
  SyllableNode: class MockSyllableNode {},
}))

jest.mock('../lexical/nodes/RhymeNode', () => ({
  RhymeNode: class MockRhymeNode {},
}))

jest.mock('../lexical/plugins/SectionDetectionPlugin', () => ({
  SectionDetectionPlugin: () => <div data-testid="section-detection-plugin" />,
}))

jest.mock('../lexical/plugins/ProsodyAnalysisPlugin', () => ({
  ProsodyAnalysisPlugin: () => <div data-testid="prosody-analysis-plugin" />,
}))

describe('RichTextLyricsEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Enter your lyrics...',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the rich text editor by default', () => {
    render(<RichTextLyricsEditor {...defaultProps} />)

    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument()
    expect(screen.getByTestId('rich-text-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('content-editable')).toBeInTheDocument()
  })

  it('should render the formatting toolbar', () => {
    render(<RichTextLyricsEditor {...defaultProps} />)

    // Check for formatting buttons
    expect(screen.getByTitle('Bold (Ctrl/Cmd + B)')).toBeInTheDocument()
    expect(screen.getByTitle('Italic (Ctrl/Cmd + I)')).toBeInTheDocument()
    expect(screen.getByTitle('Underline (Ctrl/Cmd + U)')).toBeInTheDocument()
    expect(screen.getByTitle('Strikethrough')).toBeInTheDocument()
  })

  it('should render plugins', () => {
    render(<RichTextLyricsEditor {...defaultProps} />)

    expect(screen.getByTestId('history-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('on-change-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('section-detection-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('prosody-analysis-plugin')).toBeInTheDocument()
  })

  it('should toggle between rich text and source mode', () => {
    render(<RichTextLyricsEditor {...defaultProps} />)

    // Should start in rich text mode
    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument()
    expect(screen.getByTitle('Switch to Source Mode')).toBeInTheDocument()

    // Click to switch to source mode
    fireEvent.click(screen.getByTitle('Switch to Source Mode'))

    // Should now show source mode
    expect(screen.getByTitle('Switch to Rich Text Mode')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // textarea
  })

  it('should render textarea in source mode', () => {
    const testValue = 'Test lyrics content'
    render(<RichTextLyricsEditor {...defaultProps} value={testValue} />)

    // Switch to source mode
    fireEvent.click(screen.getByTitle('Switch to Source Mode'))

    const textarea = screen.getByDisplayValue(testValue)
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveClass('font-mono')
  })

  it('should call onChange when textarea value changes in source mode', () => {
    const mockOnChange = jest.fn()
    render(<RichTextLyricsEditor {...defaultProps} onChange={mockOnChange} />)

    // Switch to source mode
    fireEvent.click(screen.getByTitle('Switch to Source Mode'))

    const textarea = screen.getByDisplayValue('')
    fireEvent.change(textarea, { target: { value: 'New lyrics content' } })

    expect(mockOnChange).toHaveBeenCalledWith('New lyrics content')
  })

  it('should apply custom CSS classes', () => {
    const customClass = 'custom-editor-class'
    render(<RichTextLyricsEditor {...defaultProps} className={customClass} />)

    const editorContainer = screen.getByTestId('lexical-composer').closest('.rich-text-lyrics-editor')
    expect(editorContainer).toHaveClass(customClass)
  })

  it('should show correct mode toggle button text and icons', () => {
    render(<RichTextLyricsEditor {...defaultProps} />)

    // Rich text mode initially
    const richTextModeButton = screen.getByTitle('Switch to Source Mode')
    expect(richTextModeButton).toHaveTextContent('⚡Source')

    // Switch to source mode
    fireEvent.click(richTextModeButton)

    const sourceModeButton = screen.getByTitle('Switch to Rich Text Mode')
    expect(sourceModeButton).toHaveTextContent('🎨Rich Text')
  })
})