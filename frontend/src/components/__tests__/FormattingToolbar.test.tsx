import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FormattingToolbar from '../FormattingToolbar'

describe('FormattingToolbar', () => {
  const mockHandlers = {
    onBold: jest.fn(),
    onItalic: jest.fn(),
    onUnderline: jest.fn(),
    onStrikethrough: jest.fn(),
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

  it('should display help text', () => {
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
})