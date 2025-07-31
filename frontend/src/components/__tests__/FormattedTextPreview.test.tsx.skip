import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormattedTextPreview } from '../FormattedTextPreview'

describe('FormattedTextPreview', () => {
  it('should render plain text correctly', () => {
    render(<FormattedTextPreview text="Hello world" />)
    
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('should render bold text correctly', () => {
    render(<FormattedTextPreview text="**Hello** world" />)
    
    const boldElement = screen.getByText('Hello')
    expect(boldElement).toHaveClass('font-bold')
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('should render italic text correctly', () => {
    render(<FormattedTextPreview text="*Hello* world" />)
    
    const italicElement = screen.getByText('Hello')
    expect(italicElement).toHaveClass('italic')
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('should render underlined text correctly', () => {
    render(<FormattedTextPreview text="_Hello_ world" />)
    
    const underlineElement = screen.getByText('Hello')
    expect(underlineElement).toHaveClass('underline')
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('should render multiple formatting types correctly', () => {
    render(<FormattedTextPreview text="**Bold** *italic* _underline_" />)
    
    const boldElement = screen.getByText('Bold')
    expect(boldElement).toHaveClass('font-bold')
    
    const italicElement = screen.getByText('italic')
    expect(italicElement).toHaveClass('italic')
    
    const underlineElement = screen.getByText('underline')
    expect(underlineElement).toHaveClass('underline')
  })

  it('should handle multiline text', () => {
    render(<FormattedTextPreview text="Line 1\n**Bold line**\nLine 3" />)
    
    expect(screen.getByText('Line 1')).toBeInTheDocument()
    expect(screen.getByText('Bold line')).toHaveClass('font-bold')
    expect(screen.getByText('Line 3')).toBeInTheDocument()
  })

  it('should handle empty lines', () => {
    render(<FormattedTextPreview text="Line 1\n\nLine 3" />)
    
    expect(screen.getByText('Line 1')).toBeInTheDocument()
    expect(screen.getByText('Line 3')).toBeInTheDocument()
    
    // Check for empty line (non-breaking space)
    const emptyLines = screen.getAllByText('\u00a0')
    expect(emptyLines).toHaveLength(1)
  })

  it('should limit lines when maxLines is specified', () => {
    const longText = Array(15).fill(0).map((_, i) => `Line ${i + 1}`).join('\n')
    render(<FormattedTextPreview text={longText} maxLines={5} />)
    
    // Should show first 5 lines
    expect(screen.getByText('Line 1')).toBeInTheDocument()
    expect(screen.getByText('Line 5')).toBeInTheDocument()
    
    // Should not show line 6 or beyond
    expect(screen.queryByText('Line 6')).not.toBeInTheDocument()
    
    // Should show truncation message
    expect(screen.getByText('... and 10 more lines')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <FormattedTextPreview text="Hello" className="custom-class" />
    )
    
    const previewElement = container.firstChild
    expect(previewElement).toHaveClass('custom-class')
  })

  it('should handle empty text', () => {
    const { container } = render(<FormattedTextPreview text="" />)
    
    // Should render without crashing
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle text with only whitespace', () => {
    render(<FormattedTextPreview text="   \n  \n   " />)
    
    // Should render empty lines as non-breaking spaces
    const emptyLines = screen.getAllByText('\u00a0')
    expect(emptyLines.length).toBeGreaterThan(0)
  })

  describe('Formatting edge cases', () => {
    it('should handle malformed bold formatting', () => {
      render(<FormattedTextPreview text="**incomplete bold" />)
      
      // Should render as plain text since formatting is incomplete
      expect(screen.getByText('**incomplete bold')).toBeInTheDocument()
      expect(screen.getByText('**incomplete bold')).not.toHaveClass('font-bold')
    })

    it('should handle nested formatting markers', () => {
      render(<FormattedTextPreview text="**bold *and italic* text**" />)
      
      // The current implementation should handle this gracefully
      const textElement = screen.getByText('bold *and italic* text')
      expect(textElement).toHaveClass('font-bold')
    })

    it('should handle mixed formatting on same line', () => {
      render(<FormattedTextPreview text="Start **bold** middle *italic* end _underline_ finish" />)
      
      expect(screen.getByText('Start ')).toBeInTheDocument()
      expect(screen.getByText('bold')).toHaveClass('font-bold')
      expect(screen.getByText(' middle ')).toBeInTheDocument()
      expect(screen.getByText('italic')).toHaveClass('italic')
      expect(screen.getByText(' end ')).toBeInTheDocument()
      expect(screen.getByText('underline')).toHaveClass('underline')
      expect(screen.getByText(' finish')).toBeInTheDocument()
    })
  })
})