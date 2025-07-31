import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SimpleWysiwygEditor from '../SimpleWysiwygEditor'

// Mock the prosody analysis hook
jest.mock('../../hooks/useProsodyAnalysis', () => ({
  useProsodyAnalysis: () => ({
    analysis: {
      lines: [],
      overallStability: 'neutral',
      dominantRhymeScheme: '',
      sections: [],
      clicheDetections: []
    },
    isAnalyzing: false
  })
}))

describe('SimpleWysiwygEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Start typing...',
    showProsodyAnalysis: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Content Rendering', () => {
    it('should render lyrics content in WYSIWYG mode when value is provided', async () => {
      const testLyrics = '[Verse 1]\nThis is a test line\nAnother line\n\n[Chorus]\nChorus content here'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      // Should be in WYSIWYG mode by default
      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      expect(wysiwygDiv).toBeTruthy()
      
      // Wait for content to be rendered
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('This is a test line')
      })
      
      // Check that section headers are rendered
      expect(wysiwygDiv?.innerHTML).toContain('Verse 1')
      expect(wysiwygDiv?.innerHTML).toContain('Chorus')
      expect(wysiwygDiv?.innerHTML).toContain('Chorus content here')
    })

    it('should show empty content when value is empty', () => {
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value=""
        />
      )

      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      expect(wysiwygDiv).toBeTruthy()
      expect(wysiwygDiv?.innerHTML).toBe('')
    })

    it('should update content when value changes', async () => {
      const { rerender } = render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value="Initial content"
        />
      )

      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      
      // Wait for initial content
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('Initial content')
      })

      // Update with new content
      rerender(
        <SimpleWysiwygEditor
          {...defaultProps}
          value="Updated content"
        />
      )

      // Wait for updated content
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('Updated content')
      })
    })

    it('should render section headers with proper styling', async () => {
      const testLyrics = '[Verse 1]\nContent\n[Chorus]\nMore content'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('section-header')
      })
      
      // Should contain section styling classes
      expect(wysiwygDiv?.innerHTML).toContain('bg-gradient-to-r')
      expect(wysiwygDiv?.innerHTML).toContain('Verse 1')
      expect(wysiwygDiv?.innerHTML).toContain('Chorus')
    })
  })

  describe('Mode Switching', () => {
    it('should show content in source mode', () => {
      const testLyrics = '[Verse 1]\nTest content'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      // Click source mode button
      const sourceModeButton = screen.getByText('Source')
      fireEvent.click(sourceModeButton)

      // Should show textarea with raw content
      const textarea = document.querySelector('textarea')
      expect(textarea).toBeTruthy()
      expect(textarea?.value).toBe(testLyrics)
    })

    it('should toggle between WYSIWYG and source modes', async () => {
      const testLyrics = '[Verse 1]\nTest content'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      // Should start in WYSIWYG mode
      expect(document.querySelector('.wysiwyg-editor')).toBeTruthy()
      expect(document.querySelector('textarea')).toBeFalsy()

      // Switch to source mode
      const sourceModeButton = screen.getByText('Source')
      fireEvent.click(sourceModeButton)

      expect(document.querySelector('textarea')).toBeTruthy()
      expect(document.querySelector('.wysiwyg-editor')).toBeFalsy()

      // Switch back to WYSIWYG mode
      const wysiwygModeButton = screen.getByText('WYSIWYG')
      fireEvent.click(wysiwygModeButton)

      expect(document.querySelector('.wysiwyg-editor')).toBeTruthy()
      expect(document.querySelector('textarea')).toBeFalsy()

      // Content should still be visible after switching back
      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('Test content')
      })
    })
  })

  describe('Content Conversion', () => {
    it('should convert markdown to HTML in WYSIWYG mode', async () => {
      const testLyrics = '**Bold text** and *italic text* and _underlined text_'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('<strong>Bold text</strong>')
        expect(wysiwygDiv?.innerHTML).toContain('<em>italic text</em>')
        expect(wysiwygDiv?.innerHTML).toContain('<u>underlined text</u>')
      })
    })

    it('should handle empty lines properly', async () => {
      const testLyrics = 'Line 1\n\nLine 3'
      
      render(
        <SimpleWysiwygEditor
          {...defaultProps}
          value={testLyrics}
        />
      )

      const wysiwygDiv = document.querySelector('.wysiwyg-editor')
      
      await waitFor(() => {
        expect(wysiwygDiv?.innerHTML).toContain('Line 1')
        expect(wysiwygDiv?.innerHTML).toContain('Line 3')
        // Should have proper spacing for empty lines
        expect(wysiwygDiv?.innerHTML).toContain('&nbsp;')
      })
    })
  })
})