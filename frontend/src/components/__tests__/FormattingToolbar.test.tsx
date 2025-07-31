import React, { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormattingToolbar } from '../FormattingToolbar'

// Mock textarea ref
const createMockTextarea = (value: string, selectionStart: number, selectionEnd: number) => {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.selectionStart = selectionStart
  textarea.selectionEnd = selectionEnd
  
  // Mock focus and setSelectionRange methods
  textarea.focus = jest.fn()
  textarea.setSelectionRange = jest.fn()
  
  return textarea
}

describe('FormattingToolbar', () => {
  let textareaRef: React.RefObject<HTMLTextAreaElement>
  let mockOnTextChange: jest.Mock

  beforeEach(() => {
    textareaRef = createRef<HTMLTextAreaElement>()
    mockOnTextChange = jest.fn()
  })

  const renderToolbar = () => {
    return render(
      <FormattingToolbar
        textareaRef={textareaRef}
        onTextChange={mockOnTextChange}
      />
    )
  }

  it('should render formatting buttons', () => {
    renderToolbar()
    
    expect(screen.getByTitle('Bold (Cmd+B)')).toBeInTheDocument()
    expect(screen.getByTitle('Italic (Cmd+I)')).toBeInTheDocument()
    expect(screen.getByTitle('Underline (Cmd+U)')).toBeInTheDocument()
  })

  it('should render formatting syntax examples', () => {
    renderToolbar()
    
    expect(screen.getByText('**bold**')).toBeInTheDocument()
    expect(screen.getByText('*italic*')).toBeInTheDocument()
    expect(screen.getByText('_underline_')).toBeInTheDocument()
  })

  it('should render keyboard shortcut help text', () => {
    renderToolbar()
    
    expect(screen.getByText('Use Cmd+B/I/U for shortcuts')).toBeInTheDocument()
  })

  describe('Bold formatting', () => {
    it('should add bold formatting to selected text', () => {
      const textarea = createMockTextarea('Hello world', 0, 5)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const boldButton = screen.getByTitle('Bold (Cmd+B)')
      fireEvent.click(boldButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('**Hello** world')
    })

    it('should remove bold formatting from selected bold text', () => {
      const textarea = createMockTextarea('**Hello** world', 0, 9)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const boldButton = screen.getByTitle('Bold (Cmd+B)')
      fireEvent.click(boldButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('Hello world')
    })

    it('should insert bold markers at cursor position when no text selected', () => {
      const textarea = createMockTextarea('Hello world', 5, 5)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const boldButton = screen.getByTitle('Bold (Cmd+B)')
      fireEvent.click(boldButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('Hello**** world')
    })
  })

  describe('Italic formatting', () => {
    it('should add italic formatting to selected text', () => {
      const textarea = createMockTextarea('Hello world', 0, 5)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const italicButton = screen.getByTitle('Italic (Cmd+I)')
      fireEvent.click(italicButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('*Hello* world')
    })

    it('should remove italic formatting from selected italic text', () => {
      const textarea = createMockTextarea('*Hello* world', 0, 7)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const italicButton = screen.getByTitle('Italic (Cmd+I)')
      fireEvent.click(italicButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('Hello world')
    })

    it('should not remove bold formatting when text is bold', () => {
      const textarea = createMockTextarea('**Hello** world', 0, 9)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const italicButton = screen.getByTitle('Italic (Cmd+I)')
      fireEvent.click(italicButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('***Hello*** world')
    })
  })

  describe('Underline formatting', () => {
    it('should add underline formatting to selected text', () => {
      const textarea = createMockTextarea('Hello world', 0, 5)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const underlineButton = screen.getByTitle('Underline (Cmd+U)')
      fireEvent.click(underlineButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('_Hello_ world')
    })

    it('should remove underline formatting from selected underlined text', () => {
      const textarea = createMockTextarea('_Hello_ world', 0, 7)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const underlineButton = screen.getByTitle('Underline (Cmd+U)')
      fireEvent.click(underlineButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('Hello world')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty textarea ref', () => {
      textareaRef.current = null
      
      renderToolbar()
      
      const boldButton = screen.getByTitle('Bold (Cmd+B)')
      fireEvent.click(boldButton)
      
      // Should not crash and should not call onTextChange
      expect(mockOnTextChange).not.toHaveBeenCalled()
    })

    it('should handle empty text selection', () => {
      const textarea = createMockTextarea('', 0, 0)
      textareaRef.current = textarea
      
      renderToolbar()
      
      const boldButton = screen.getByTitle('Bold (Cmd+B)')
      fireEvent.click(boldButton)
      
      expect(mockOnTextChange).toHaveBeenCalledWith('****')
    })
  })

  describe('Keyboard shortcuts', () => {
    beforeEach(() => {
      // Mock addEventListener and removeEventListener
      const originalAddEventListener = HTMLTextAreaElement.prototype.addEventListener
      const originalRemoveEventListener = HTMLTextAreaElement.prototype.removeEventListener
      
      HTMLTextAreaElement.prototype.addEventListener = jest.fn((type, listener) => {
        if (type === 'keydown') {
          // Store the keydown listener for testing
          (HTMLTextAreaElement.prototype as HTMLTextAreaElement & { keydownListener?: EventListener }).keydownListener = listener
        }
      })
      
      HTMLTextAreaElement.prototype.removeEventListener = jest.fn()
      
      // Restore after test
      afterEach(() => {
        HTMLTextAreaElement.prototype.addEventListener = originalAddEventListener
        HTMLTextAreaElement.prototype.removeEventListener = originalRemoveEventListener
      })
    })

    it('should handle Cmd+B keyboard shortcut for bold', () => {
      const textarea = createMockTextarea('Hello world', 0, 5)
      textareaRef.current = textarea
      
      renderToolbar()
      
      // Simulate Cmd+B keydown event
      const mockPreventDefault = jest.fn()
      const keydownEvent = {
        key: 'b',
        metaKey: true,
        preventDefault: mockPreventDefault
      } as KeyboardEvent
      
      // Call the stored keydown listener
      const listener = (HTMLTextAreaElement.prototype as HTMLTextAreaElement & { keydownListener?: EventListener }).keydownListener
      if (listener) {
        listener(keydownEvent)
      }
      
      expect(mockPreventDefault).toHaveBeenCalled()
      expect(mockOnTextChange).toHaveBeenCalledWith('**Hello** world')
    })
  })
})