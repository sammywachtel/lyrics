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
      />
    )

    // Check for common section buttons
    expect(screen.getByRole('button', { name: 'Verse 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verse 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verse 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chorus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pre-Chorus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bridge' })).toBeInTheDocument()
  })

  it('should call onInsertSection when section button is clicked', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
      />
    )

    const verseButton = screen.getByRole('button', { name: 'Verse 1' })
    fireEvent.click(verseButton)

    expect(mockOnInsertSection).toHaveBeenCalledWith('[Verse 1]')
  })

  it('should call onInsertSection with correct section tags', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
      />
    )

    // Test multiple buttons
    fireEvent.click(screen.getByRole('button', { name: 'Chorus' }))
    expect(mockOnInsertSection).toHaveBeenCalledWith('[Chorus]')

    fireEvent.click(screen.getByRole('button', { name: 'Bridge' }))
    expect(mockOnInsertSection).toHaveBeenCalledWith('[Bridge]')

    fireEvent.click(screen.getByRole('button', { name: 'Pre-Chorus' }))
    expect(mockOnInsertSection).toHaveBeenCalledWith('[Pre-Chorus]')

    expect(mockOnInsertSection).toHaveBeenCalledTimes(3)
  })

  it('should not show sections button when no existing sections', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
      />
    )

    expect(screen.queryByText('📋 Sections')).not.toBeInTheDocument()
  })

  it('should show sections button when existing sections present', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
      />
    )

    const sectionsButton = screen.getByText('📋 Sections')
    expect(sectionsButton).toBeInTheDocument()
  })

  it('should call onShowSectionNav when sections button is clicked', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
      />
    )

    const sectionsButton = screen.getByText('📋 Sections')
    fireEvent.click(sectionsButton)

    expect(mockOnShowSectionNav).toHaveBeenCalledTimes(1)
  })

  it('should have proper button styles and hover states', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
      />
    )

    const verseButton = screen.getByRole('button', { name: 'Verse 1' })
    expect(verseButton).toHaveClass('px-2', 'py-1', 'text-xs', 'font-medium')

    const sectionsButton = screen.getByText('📋 Sections')
    expect(sectionsButton).toHaveClass('px-3', 'py-1', 'text-xs', 'font-medium', 'text-blue-600')
  })

  it('should have proper accessibility attributes', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={true}
      />
    )

    const verseButton = screen.getByRole('button', { name: 'Verse 1' })
    expect(verseButton).toHaveAttribute('title', 'Insert Verse 1 section')

    const sectionsButton = screen.getByText('📋 Sections')
    expect(sectionsButton).toHaveAttribute('title', 'Navigate between sections')
  })

  it('should display quick insert label', () => {
    render(
      <SectionToolbar
        onInsertSection={mockOnInsertSection}
        onShowSectionNav={mockOnShowSectionNav}
        hasExistingSections={false}
      />
    )

    expect(screen.getByText('Quick Insert:')).toBeInTheDocument()
  })
})