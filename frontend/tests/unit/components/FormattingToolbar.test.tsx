import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FormattingToolbar from '../../../src/components/FormattingToolbar'

describe('FormattingToolbar', () => {
  const mockHandlers = {
    onBold: jest.fn(),
    onItalic: jest.fn(),
    onUnderline: jest.fn(),
    onStrikethrough: jest.fn(),
    onVerse: jest.fn(),
    onChorus: jest.fn(),
    onPreChorus: jest.fn(),
    onBridge: jest.fn(),
    onIntro: jest.fn(),
    onOutro: jest.fn(),
    onHook: jest.fn(),
    onClearSection: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all formatting buttons', () => {
    render(
      <FormattingToolbar
        isBold={false}
        isItalic={false}
        isUnderline={false}
        isStrikethrough={false}
        {...mockHandlers}
      />
    )

    expect(screen.getByTitle('Bold (Ctrl/Cmd + B)')).toBeInTheDocument()
    expect(screen.getByTitle('Italic (Ctrl/Cmd + I)')).toBeInTheDocument()
    expect(screen.getByTitle('Underline (Ctrl/Cmd + U)')).toBeInTheDocument()
    expect(screen.getByTitle('Strikethrough')).toBeInTheDocument()
  })

  it('should apply active styles when formatting is enabled', () => {
    render(
      <FormattingToolbar
        isBold={true}
        isItalic={true}
        isUnderline={false}
        isStrikethrough={false}
        {...mockHandlers}
      />
    )

    const boldButton = screen.getByTitle('Bold (Ctrl/Cmd + B)')
    const italicButton = screen.getByTitle('Italic (Ctrl/Cmd + I)')
    const underlineButton = screen.getByTitle('Underline (Ctrl/Cmd + U)')

    expect(boldButton).toHaveClass('bg-primary-100', 'text-primary-800')
    expect(italicButton).toHaveClass('bg-primary-100', 'text-primary-800')
    expect(underlineButton).not.toHaveClass('bg-primary-100', 'text-primary-800')
  })

  it('should call correct handlers when buttons are clicked', () => {
    render(
      <FormattingToolbar
        isBold={false}
        isItalic={false}
        isUnderline={false}
        isStrikethrough={false}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getByTitle('Bold (Ctrl/Cmd + B)'))
    expect(mockHandlers.onBold).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTitle('Italic (Ctrl/Cmd + I)'))
    expect(mockHandlers.onItalic).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTitle('Underline (Ctrl/Cmd + U)'))
    expect(mockHandlers.onUnderline).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTitle('Strikethrough'))
    expect(mockHandlers.onStrikethrough).toHaveBeenCalledTimes(1)
  })

  it('should show appropriate visual styles for different formatting types', () => {
    render(
      <FormattingToolbar
        isBold={true}
        isItalic={true}
        isUnderline={true}
        isStrikethrough={true}
        {...mockHandlers}
      />
    )

    const boldText = screen.getByText('B')
    const italicText = screen.getByText('I')
    const underlineText = screen.getByText('U')
    const strikethroughText = screen.getByText('S')

    expect(boldText).toHaveClass('font-bold')
    expect(italicText).toHaveClass('italic')
    expect(underlineText).toHaveClass('underline')
    expect(strikethroughText).toHaveClass('line-through')
  })

  it('should display help text when no section is active', () => {
    render(
      <FormattingToolbar
        isBold={false}
        isItalic={false}
        isUnderline={false}
        isStrikethrough={false}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Select text to format')).toBeInTheDocument()
  })

  describe('Section formatting', () => {
    it('should show appropriate tooltips when no section is active', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection={null}
          {...mockHandlers}
        />
      )

      expect(screen.getByTitle('Mark as Verse (click again to remove)')).toBeInTheDocument()
      expect(screen.getByTitle('Mark as Chorus (click again to remove)')).toBeInTheDocument()
    })

    it('should show remove tooltip when section is active', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection="verse"
          {...mockHandlers}
        />
      )

      expect(screen.getByTitle('Remove Verse formatting')).toBeInTheDocument()
    })

    it('should show clear section button when section is active', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection="chorus"
          {...mockHandlers}
        />
      )

      expect(screen.getByTitle('Clear Chorus formatting from current line/selection (Ctrl/Cmd + Shift + X)')).toBeInTheDocument()
      expect(screen.getByText('Clear Chorus')).toBeInTheDocument()
    })

    it('should not show clear section button when no section is active', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection={null}
          {...mockHandlers}
        />
      )

      expect(screen.queryByText(/Clear .* formatting from current line\/selection/)).not.toBeInTheDocument()
    })

    it('should call onClearSection when clear button is clicked', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection="bridge"
          {...mockHandlers}
        />
      )

      fireEvent.click(screen.getByTitle('Clear Bridge formatting from current line/selection (Ctrl/Cmd + Shift + X)'))
      expect(mockHandlers.onClearSection).toHaveBeenCalledTimes(1)
    })

    it('should display current section in info text when section is active', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection="pre-chorus"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Section: Pre Chorus')).toBeInTheDocument()
    })

    it('should call section handlers when section buttons are clicked', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection={null}
          {...mockHandlers}
        />
      )

      fireEvent.click(screen.getByTitle('Mark as Verse (click again to remove)'))
      expect(mockHandlers.onVerse).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByTitle('Mark as Chorus (click again to remove)'))
      expect(mockHandlers.onChorus).toHaveBeenCalledTimes(1)
    })

    it('should show contextual clear button text and tooltip for different section types', () => {
      const testCases = [
        { section: 'verse', expectedText: 'Clear Verse', expectedTooltip: 'Clear Verse formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'chorus', expectedText: 'Clear Chorus', expectedTooltip: 'Clear Chorus formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'pre-chorus', expectedText: 'Clear Pre Chorus', expectedTooltip: 'Clear Pre Chorus formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'bridge', expectedText: 'Clear Bridge', expectedTooltip: 'Clear Bridge formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'intro', expectedText: 'Clear Intro', expectedTooltip: 'Clear Intro formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'outro', expectedText: 'Clear Outro', expectedTooltip: 'Clear Outro formatting from current line/selection (Ctrl/Cmd + Shift + X)' },
        { section: 'hook', expectedText: 'Clear Hook', expectedTooltip: 'Clear Hook formatting from current line/selection (Ctrl/Cmd + Shift + X)' }
      ]

      testCases.forEach(({ section, expectedText, expectedTooltip }) => {
        const { unmount } = render(
          <FormattingToolbar
            isBold={false}
            isItalic={false}
            isUnderline={false}
            isStrikethrough={false}
            activeSection={section}
            {...mockHandlers}
          />
        )

        expect(screen.getByTitle(expectedTooltip)).toBeInTheDocument()
        expect(screen.getByText(expectedText)).toBeInTheDocument()

        unmount()
      })
    })

    it('should handle section names with proper capitalization', () => {
      render(
        <FormattingToolbar
          isBold={false}
          isItalic={false}
          isUnderline={false}
          isStrikethrough={false}
          activeSection="pre-chorus"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Clear Pre Chorus')).toBeInTheDocument()
      expect(screen.getByTitle('Clear Pre Chorus formatting from current line/selection (Ctrl/Cmd + Shift + X)')).toBeInTheDocument()
      expect(screen.getByText('Section: Pre Chorus')).toBeInTheDocument()
    })
  })
})
