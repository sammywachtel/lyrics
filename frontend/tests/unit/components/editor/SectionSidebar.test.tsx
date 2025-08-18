import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SectionSidebar from '../../../../src/components/editor/SectionSidebar'
import type { SongSection } from '../../../../src/utils/sectionUtils'

describe('SectionSidebar', () => {
  const mockOnJumpToSection = jest.fn()

  const sampleSections: SongSection[] = [
    {
      name: 'Verse 1',
      content: 'This is the first verse\nWith multiple lines',
      startLine: 0,
      endLine: 1
    },
    {
      name: 'Chorus',
      content: 'This is the chorus\nEveryone sings along',
      startLine: 3,
      endLine: 4
    },
    {
      name: 'Bridge',
      content: 'Bridge content here',
      startLine: 6,
      endLine: 6
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render empty state when no sections provided', () => {
    render(
      <SectionSidebar
        sections={[]}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    expect(screen.getByText('No Sections Yet')).toBeInTheDocument()
    expect(screen.getByText(/Add section tags like/)).toBeInTheDocument()
    expect(screen.getByText('[Verse 1]')).toBeInTheDocument()
    expect(screen.getByText('[Chorus]')).toBeInTheDocument()
  })

  it('should render section list when sections provided', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    expect(screen.getByText('Sections (3)')).toBeInTheDocument()
    expect(screen.getAllByText('Verse 1')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Chorus')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Bridge')[0]).toBeInTheDocument()
  })

  it('should display section statistics correctly', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    // Check that we have two sections with 2 lines each
    const twoLinesElements = screen.getAllByText('2 lines')
    expect(twoLinesElements).toHaveLength(2) // Verse 1 and Chorus both have 2 lines

    // Check specific line references
    expect(screen.getByText('Line 1')).toBeInTheDocument() // Verse 1 line reference
    expect(screen.getByText('Line 4')).toBeInTheDocument() // Chorus line reference
    expect(screen.getByText('1 line')).toBeInTheDocument() // Bridge line count (singular)
    expect(screen.getByText('Line 7')).toBeInTheDocument() // Bridge line reference
  })

  it('should handle singular line count correctly', () => {
    const singleLineSections: SongSection[] = [
      {
        name: 'Short Section',
        content: 'Just one line',
        startLine: 0,
        endLine: 0
      }
    ]

    render(
      <SectionSidebar
        sections={singleLineSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    expect(screen.getByText('1 line')).toBeInTheDocument()
    expect(screen.getByText('Line 1')).toBeInTheDocument()
  })

  it('should call onJumpToSection when section is clicked', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    const verseButton = screen.getByRole('button', { name: /Verse 1/ })
    fireEvent.click(verseButton)

    expect(mockOnJumpToSection).toHaveBeenCalledWith('Verse 1')
    expect(mockOnJumpToSection).toHaveBeenCalledTimes(1)
  })

  it('should highlight current section when provided', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
        currentSection="Chorus"
      />
    )

    // The current section should be highlighted with active styling
    const chorusSection = screen.getAllByText('Chorus')[0].closest('.group')
    expect(chorusSection).toHaveClass('border-l-4')
    expect(chorusSection).toHaveClass('from-green-100')
  })

  it('should not highlight any section when currentSection is not provided', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    // No sections should be highlighted when no current section is provided
    const sectionDivs = screen.getByText('Verse 1').closest('.group')
    expect(sectionDivs).not.toHaveClass('border-l-4')
  })

  it('should display appropriate icons for different section types', () => {
    const variedSections: SongSection[] = [
      { name: 'Verse 1', content: 'content', startLine: 0, endLine: 0 },
      { name: 'Chorus', content: 'content', startLine: 1, endLine: 1 },
      { name: 'Bridge', content: 'content', startLine: 2, endLine: 2 },
      { name: 'Pre-Chorus', content: 'content', startLine: 3, endLine: 3 },
      { name: 'Intro', content: 'content', startLine: 4, endLine: 4 },
      { name: 'Outro', content: 'content', startLine: 5, endLine: 5 }
    ]

    render(
      <SectionSidebar
        sections={variedSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    // Icons should be present (we can't easily test specific emoji content, but we can verify structure)
    expect(screen.getAllByText('Verse 1')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Chorus')).toHaveLength(2) // One in section list, one in legend
    expect(screen.getAllByText('Bridge')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Pre-Chorus')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Intro')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Outro')[0]).toBeInTheDocument()
  })

  it('should have proper accessibility and styling', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)

    buttons.forEach(button => {
      expect(button).toHaveClass('w-full', 'text-left')
    })
  })

  it('should display footer instruction', () => {
    render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    expect(screen.getByText('Quick Actions:')).toBeInTheDocument()
    expect(screen.getByText('Click to jump • Hover to edit')).toBeInTheDocument()
    expect(screen.getByText('Current section highlighted')).toBeInTheDocument()
  })

  it('should handle empty content sections correctly', () => {
    const emptySections: SongSection[] = [
      {
        name: 'Empty Section',
        content: '',
        startLine: 0,
        endLine: 0
      }
    ]

    render(
      <SectionSidebar
        sections={emptySections}
        onJumpToSection={mockOnJumpToSection}
      />
    )

    expect(screen.getByText('0 lines')).toBeInTheDocument()
    expect(screen.getByText('Line 1')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    const { container } = render(
      <SectionSidebar
        sections={sampleSections}
        onJumpToSection={mockOnJumpToSection}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
