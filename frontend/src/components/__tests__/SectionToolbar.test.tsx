import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SectionToolbar from '../SectionToolbar'

describe('SectionToolbar', () => {
  const mockOnInsertSection = jest.fn()
  const mockOnShowSectionNav = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render quick insert buttons', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
        sections={[]}
      />
    )

    // Check for smart section buttons (now with simplified names)
    expect(screen.getByRole('button', { name: '📝 Verse' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🎵 Chorus' })).toBeInTheDocument()
    // Should show available section types based on smart logic
    expect(screen.getByText('📝')).toBeInTheDocument() // Verse icon
    expect(screen.getByText('🎵')).toBeInTheDocument() // Chorus icon
  })

  it('should call onInsertSection when section button is clicked', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
        sections={[]}
      />
    )

    const verseButton = screen.getByRole('button', { name: '📝 Verse' })
    fireEvent.click(verseButton)

    expect(mockOnInsertSection).toHaveBeenCalledWith('Verse')
  })

  it('should call onInsertSection with correct section tags', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
        sections={[]}
      />
    )

    // Test multiple buttons with new API
    fireEvent.click(screen.getByRole('button', { name: '🎵 Chorus' }))
    expect(mockOnInsertSection).toHaveBeenCalledWith('Chorus')

    // Should have exactly 1 call
    expect(mockOnInsertSection).toHaveBeenCalledTimes(1)
  })

  it('should not show sections button when no existing sections', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
        sections={[]}
      />
    )

    expect(screen.queryByText('Quick Nav')).not.toBeInTheDocument()
  })

  it('should show sections button when existing sections present', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
        sections={[]}
      />
    )

    const sectionsButton = screen.getByText('Quick Nav')
    expect(sectionsButton).toBeInTheDocument()
  })

  it('should call onShowSectionNav when sections button is clicked', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
        sections={[]}
      />
    )

    const sectionsButton = screen.getByText('Quick Nav')
    fireEvent.click(sectionsButton)

    expect(mockOnShowSectionNav).toHaveBeenCalledTimes(1)
  })

  it('should have proper button styles and hover states', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
        sections={[]}
      />
    )

    const verseButton = screen.getByRole('button', { name: '📝 Verse' })
    expect(verseButton).toHaveClass('px-3', 'py-2', 'text-xs', 'font-medium')

    const sectionsButton = screen.getByText('Quick Nav').closest('button')
    expect(sectionsButton).toHaveClass('px-4', 'py-2', 'text-sm', 'font-medium')
  })

  it('should have proper accessibility attributes', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
        sections={[]}
      />
    )

    const verseButton = screen.getByRole('button', { name: '📝 Verse' })
    expect(verseButton).toHaveAttribute('title', 'Insert Verse section at cursor')

    const sectionsButton = screen.getByText('Quick Nav').closest('button')
    expect(sectionsButton).toHaveAttribute('title', 'Navigate between sections (modal)')
  })

  it('should display quick insert label', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
        sections={[]}
      />
    )

    expect(screen.getByText('Quick Insert:')).toBeInTheDocument()
  })
})