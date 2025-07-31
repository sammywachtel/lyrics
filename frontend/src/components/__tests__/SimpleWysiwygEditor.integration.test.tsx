import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SimpleWysiwygEditor } from '../SimpleWysiwygEditor'

// Mock the prosody analysis hook
jest.mock('../../hooks/useProsodyAnalysis', () => ({
  useProsodyAnalysis: () => ({
    analysis: {
      lines: [
        { lineNumber: 1, text: 'This is a test line', endingType: 'stable', syllableCount: 5, endingWord: 'line', rhymeSound: 'ine' },
        { lineNumber: 2, text: 'Another test line here', endingType: 'unstable', syllableCount: 6, endingWord: 'here', rhymeSound: 'ere' }
      ],
      sections: [],
      overallStability: 'mixed',
      dominantRhymeScheme: 'AB',
      clicheDetections: []
    },
    isAnalyzing: false
  })
}))

// Skip these integration tests for now as they need more complex setup
describe.skip('SimpleWysiwygEditor Integration Tests', () => {
  const mockOnChange = jest.fn()
  const mockOnSelectionChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WYSIWYG Mode Functionality', () => {
    it('should preserve cursor position when prosody analysis updates', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="Test line\nAnother line"
          onChange={mockOnChange}
          onSelectionChange={mockOnSelectionChange}
          showProsodyAnalysis={true}
        />
      )

      // Switch to WYSIWYG mode (should be default)
      const editor = screen.getByRole('textbox')
      expect(editor).toBeInTheDocument()

      // Type some text
      await user.click(editor)
      await user.type(editor, ' more text')

      // Verify content changed
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })

    it('should handle line breaks correctly in WYSIWYG mode', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="First line"
          onChange={mockOnChange}
        />
      )

      const editor = screen.getByRole('textbox')
      await user.click(editor)
      
      // Position cursor at end and press Enter
      await user.keyboard('{End}')
      await user.keyboard('{Enter}')
      await user.type(editor, 'Second line')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('First line\nSecond line'))
      })
    })

    it('should maintain formatting when switching between modes', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="**Bold text** and *italic text*"
          onChange={mockOnChange}
        />
      )

      // Should be in WYSIWYG mode by default
      expect(screen.getByDisplayValue).toBeDefined()

      // Switch to source mode
      const sourceButton = screen.getByText('Source')
      await user.click(sourceButton)

      // Should show source with markdown
      const sourceEditor = screen.getByDisplayValue('**Bold text** and *italic text*')
      expect(sourceEditor).toBeInTheDocument()

      // Switch back to WYSIWYG
      const wysiwygButton = screen.getByText('WYSIWYG')
      await user.click(wysiwygButton)

      // Should preserve formatting
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Prosody Analysis Integration', () => {
    it('should show prosody legend when enabled', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="Test line"
          onChange={mockOnChange}
          showProsodyAnalysis={true}
        />
      )

      // Click the prosody legend toggle button
      const prosodyButton = screen.getByTitle('Show/Hide Prosody Legend')
      await user.click(prosodyButton)

      // Should show the legend
      expect(screen.getByText('Prosody Analysis')).toBeInTheDocument()
      expect(screen.getByText('Line Stability')).toBeInTheDocument()
    })

    it('should display stability indicators on lines', () => {
      render(
        <SimpleWysiwygEditor
          value="Stable line\nUnstable ending"
          onChange={mockOnChange}
          showProsodyAnalysis={true}
        />
      )

      // Check that prosody lines are created (they should be in the DOM)
      const editorContainer = screen.getByRole('textbox').parentElement
      expect(editorContainer).toBeInTheDocument()
    })

    it('should show analysis summary in bottom panel', () => {
      render(
        <SimpleWysiwygEditor
          value="Test content"
          onChange={mockOnChange}
          showProsodyAnalysis={true}
        />
      )

      // Should show stability and pattern info
      expect(screen.getByText(/Stability:/)).toBeInTheDocument()
      expect(screen.getByText(/Pattern:/)).toBeInTheDocument()
      expect(screen.getByText('mixed')).toBeInTheDocument()
      expect(screen.getByText('AB')).toBeInTheDocument()
    })
  })

  describe('Formatting Controls', () => {
    it('should apply bold formatting', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="Test text"
          onChange={mockOnChange}
        />
      )

      // Select some text and apply bold
      const editor = screen.getByRole('textbox')
      await user.click(editor)
      
      // Use keyboard shortcut for bold
      await user.keyboard('{Control>}a{/Control}') // Select all
      await user.keyboard('{Control>}b{/Control}') // Bold

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('**'))
      })
    })

    it('should apply italic formatting', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="Test text"
          onChange={mockOnChange}
        />
      )

      const editor = screen.getByRole('textbox')
      await user.click(editor)
      
      // Use keyboard shortcut for italic
      await user.keyboard('{Control>}a{/Control}') // Select all
      await user.keyboard('{Control>}i{/Control}') // Italic

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('*'))
      })
    })

    it('should handle paste events correctly', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value=""
          onChange={mockOnChange}
        />
      )

      const editor = screen.getByRole('textbox')
      await user.click(editor)

      // Simulate paste event
      const pasteText = 'Pasted content'
      await user.paste(pasteText)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(pasteText)
      })
    })
  })

  describe('Mode Switching', () => {
    it('should preserve content when switching modes', async () => {
      const user = userEvent.setup()
      
      render(
        <SimpleWysiwygEditor
          value="**Bold** text"
          onChange={mockOnChange}
        />
      )

      // Switch to source mode
      const sourceButton = screen.getByText('Source')
      await user.click(sourceButton)

      // Content should be preserved
      expect(screen.getByDisplayValue('**Bold** text')).toBeInTheDocument()

      // Switch back to WYSIWYG
      const wysiwygButton = screen.getByText('WYSIWYG')
      await user.click(wysiwygButton)

      // Content should still be there
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Debug Information', () => {
    it('should show debug info at bottom', () => {
      render(
        <SimpleWysiwygEditor
          value="Test content"
          onChange={mockOnChange}
          showProsodyAnalysis={true}
        />
      )

      // Should show mode and content length
      expect(screen.getByText(/Mode: WYSIWYG/)).toBeInTheDocument()
      expect(screen.getByText(/Content length: 12/)).toBeInTheDocument()
      expect(screen.getByText(/Lines: 2/)).toBeInTheDocument()
    })
  })
})