import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SectionNavigation from '../SectionNavigation'
import type { SongSection } from '../../utils/sectionUtils'

describe('SectionNavigation', () => {
  const mockOnJumpToSection = jest.fn()
  const mockOnClose = jest.fn()

  const mockSections: SongSection[] = [
    {
      name: 'Verse 1',
      startLine: 0,
      endLine: 3,
      content: 'First verse content\nWith multiple lines'
    },
    {
      name: 'Chorus',
      startLine: 4,
      endLine: 6,
      content: 'Chorus content\nSing along'
    },
    {
      name: 'Bridge',
      startLine: 7,
      endLine: 8,
      content: 'Bridge content'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when no sections exist', () => {
    render(
      <SectionNavigation
        sections={[]}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Sections')).toBeInTheDocument()
    expect(screen.getByText('No sections found. Add section tags like [Verse 1] to your lyrics.')).toBeInTheDocument()
  })

  it('should render section list when sections exist', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Sections (3)')).toBeInTheDocument()
    expect(screen.getByText('Verse 1')).toBeInTheDocument()
    expect(screen.getByText('Chorus')).toBeInTheDocument()
    expect(screen.getByText('Bridge')).toBeInTheDocument()
  })

  it('should display section statistics correctly', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    // Check line counts and positions
    expect(screen.getByText('2 lines • Line 1')).toBeInTheDocument() // Verse 1
    expect(screen.getByText('2 lines • Line 5')).toBeInTheDocument() // Chorus  
    expect(screen.getByText('1 line • Line 8')).toBeInTheDocument() // Bridge
  })

  it('should handle singular line count correctly', () => {
    const singleLineSections: SongSection[] = [
      {
        name: 'Hook',
        startLine: 0,
        endLine: 1,
        content: 'Single line'
      }
    ]

    render(
      <SectionNavigation
        sections={singleLineSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('1 line • Line 1')).toBeInTheDocument()
  })

  it('should call onJumpToSection and onClose when section is clicked', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    const verseButton = screen.getByRole('button', { name: /verse 1/i })
    fireEvent.click(verseButton)

    expect(mockOnJumpToSection).toHaveBeenCalledWith('Verse 1')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: '✕' })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnJumpToSection).not.toHaveBeenCalled()
  })

  it('should highlight current section when provided', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
        currentSection="Chorus"
      />
    )

    const chorusButton = screen.getByRole('button', { name: /chorus/i })
    expect(chorusButton).toHaveClass('bg-blue-100', 'text-blue-900', 'border-l-2', 'border-blue-500')

    const verseButton = screen.getByRole('button', { name: /verse 1/i })
    expect(verseButton).not.toHaveClass('bg-blue-100')
    expect(verseButton).toHaveClass('hover:bg-gray-100', 'text-gray-700')
  })

  it('should not highlight any section when currentSection is not provided', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    const allButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Verse') || 
      button.textContent?.includes('Chorus') || 
      button.textContent?.includes('Bridge')
    )

    allButtons.forEach(button => {
      expect(button).not.toHaveClass('bg-blue-100')
      expect(button).toHaveClass('hover:bg-gray-100', 'text-gray-700')
    })
  })

  it('should have proper accessibility and styling', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    // Check container styling - get the root container, not the header div
    const container = screen.getByText('Sections (3)').closest('div')?.parentElement
    expect(container).toHaveClass('absolute', 'top-0', 'right-0', 'bg-white', 'border', 'rounded-lg', 'shadow-lg')

    // Check help text
    expect(screen.getByText('Click any section to jump to it in the editor')).toBeInTheDocument()
  })

  it('should handle empty content sections correctly', () => {
    const emptySections: SongSection[] = [
      {
        name: 'Empty Section',
        startLine: 0,
        endLine: 1,
        content: ''
      }
    ]

    render(
      <SectionNavigation
        sections={emptySections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('0 lines • Line 1')).toBeInTheDocument()
  })

  it('should be scrollable with max height constraint', () => {
    render(
      <SectionNavigation
        sections={mockSections}
        onJumpToSection={mockOnJumpToSection}
        onClose={mockOnClose}
      />
    )

    const container = screen.getByText('Sections (3)').closest('div')?.parentElement
    expect(container).toHaveClass('max-h-80', 'overflow-y-auto')
  })
})