import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProsodyIndicators, SectionStabilitySummary, ClicheHighlight } from '../ProsodyIndicators'
import { LineAnalysis, RhymeConnection } from '../../../utils/prosodyAnalysis'

describe('ProsodyIndicators', () => {
  const mockLines: LineAnalysis[] = [
    {
      text: 'Walking down the street',
      lineNumber: 1,
      syllableCount: 5,
      stressedSyllableCount: 3,
      endingType: 'neutral',
      endingWord: 'street',
      rhymeSound: 'eet',
    },
    {
      text: 'Feeling so complete',
      lineNumber: 2,
      syllableCount: 5,
      stressedSyllableCount: 3,
      endingType: 'neutral',
      endingWord: 'complete',
      rhymeSound: 'ete',
    },
    {
      text: 'The sun shines bright',
      lineNumber: 3,
      syllableCount: 4,
      stressedSyllableCount: 2,
      endingType: 'stable',
      endingWord: 'bright',
      rhymeSound: 'ight',
    },
  ]

  const mockRhymeConnections: RhymeConnection[] = [
    {
      type: 'perfect',
      lines: [0, 1],
      rhymeSound: 'eet',
    },
  ]

  describe('Line indicators', () => {
    it('should render line numbers with stability indicators', () => {
      render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={true}
          showRhymes={false}
        />
      )

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show syllable counts', () => {
      render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={true}
          showRhymes={false}
        />
      )

      expect(screen.getAllByText('5')).toHaveLength(2) // Two lines have 5 syllables
      expect(screen.getAllByText('4')).toHaveLength(1)
    })

    it('should highlight current line', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={true}
          showRhymes={false}
          currentLineIndex={1}
        />
      )

      const currentLine = container.querySelector('.current-line')
      expect(currentLine).toBeInTheDocument()
    })

    it('should not show stability when disabled', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={false}
          showRhymes={false}
        />
      )

      const lineNumbers = container.querySelectorAll('.line-number-indicator')
      expect(lineNumbers).toHaveLength(0)
    })
  })

  describe('Rhyme indicators', () => {
    it('should show rhyme badges when enabled', () => {
      render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={false}
          showRhymes={true}
        />
      )

      // Lines 0 and 1 rhyme, so should show badges
      const badges = screen.getAllByText('A')
      expect(badges).toHaveLength(2)
    })

    it('should not show rhyme badges when disabled', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={false}
          showRhymes={false}
        />
      )

      const badges = container.querySelectorAll('.rhyme-badge')
      expect(badges).toHaveLength(0)
    })

    it('should show rhyme connection visualization', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={false}
          showRhymes={true}
        />
      )

      const svg = container.querySelector('.rhyme-connections')
      expect(svg).toBeInTheDocument()
      
      const paths = svg?.querySelectorAll('path')
      expect(paths).toHaveLength(1) // One connection between lines 0 and 1
    })
  })

  describe('Tooltips', () => {
    it('should show stability tooltip on hover', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={true}
          showRhymes={false}
        />
      )

      const lineIndicator = container.querySelector('.line-number-indicator')
      expect(lineIndicator).toHaveAttribute('title')
      
      const title = lineIndicator?.getAttribute('title')
      expect(title).toContain('Line 1: neutral ending')
      expect(title).toContain('Syllables: 5')
    })

    it('should show rhyme tooltip on hover', () => {
      const { container } = render(
        <ProsodyIndicators
          lines={mockLines}
          rhymeConnections={mockRhymeConnections}
          showStability={false}
          showRhymes={true}
        />
      )

      const rhymeBadge = container.querySelector('.rhyme-badge')
      expect(rhymeBadge).toHaveAttribute('title')
      
      const title = rhymeBadge?.getAttribute('title')
      expect(title).toContain('Perfect rhyme with line')
    })
  })
})

describe('SectionStabilitySummary', () => {
  it('should render section information', () => {
    render(
      <SectionStabilitySummary
        sectionName="Verse 1"
        stability="stable"
        lineCount={4}
        rhymeScheme="AABB"
      />
    )

    expect(screen.getByText('Verse 1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('AABB')).toBeInTheDocument()
    expect(screen.getByText('stable')).toBeInTheDocument()
  })

  it('should show correct stability icon', () => {
    const { rerender } = render(
      <SectionStabilitySummary
        sectionName="Test"
        stability="stable"
        lineCount={2}
        rhymeScheme="AA"
      />
    )

    expect(screen.getByText('✓')).toBeInTheDocument()

    rerender(
      <SectionStabilitySummary
        sectionName="Test"
        stability="mixed"
        lineCount={2}
        rhymeScheme="AA"
      />
    )

    expect(screen.getByText('~')).toBeInTheDocument()

    rerender(
      <SectionStabilitySummary
        sectionName="Test"
        stability="unstable"
        lineCount={2}
        rhymeScheme="AA"
      />
    )

    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('should have stability description in tooltip', () => {
    const { container } = render(
      <SectionStabilitySummary
        sectionName="Chorus"
        stability="stable"
        lineCount={4}
        rhymeScheme="ABAB"
      />
    )

    const icon = container.querySelector('.stability-icon')
    expect(icon).toHaveAttribute('title', 'Well-balanced section with stable endings')
  })
})

describe('ClicheHighlight', () => {
  it('should render cliché text', () => {
    render(
      <ClicheHighlight
        phrase="heart on fire"
        suggestion="burning passion"
      />
    )

    expect(screen.getByText('heart on fire')).toBeInTheDocument()
  })

  it('should show suggestion button when suggestion provided', () => {
    render(
      <ClicheHighlight
        phrase="love is blind"
        suggestion="passion clouds vision"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Replace with: passion clouds vision')
  })

  it('should not show suggestion button without suggestion', () => {
    render(
      <ClicheHighlight
        phrase="some phrase"
      />
    )

    const button = screen.queryByRole('button')
    expect(button).not.toBeInTheDocument()
  })

  it('should call onReplace when suggestion clicked', () => {
    const mockReplace = jest.fn()
    
    render(
      <ClicheHighlight
        phrase="tears fall like rain"
        suggestion="weeping storms"
        onReplace={mockReplace}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(mockReplace).toHaveBeenCalledWith('weeping storms')
  })

  it('should have tooltip on cliché text', () => {
    render(
      <ClicheHighlight
        phrase="walk the line"
      />
    )

    const text = screen.getByText('walk the line')
    expect(text).toHaveAttribute('title', 'Common cliché detected')
  })
})