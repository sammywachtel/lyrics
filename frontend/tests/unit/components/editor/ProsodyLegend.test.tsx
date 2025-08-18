import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProsodyLegend } from '../../../../src/components/editor/ProsodyLegend';

describe('ProsodyLegend', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when show is false', () => {
    render(<ProsodyLegend show={false} onToggle={mockOnToggle} />);
    expect(screen.queryByText('Prosody Analysis')).not.toBeInTheDocument();
  });

  it('should render legend when show is true', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);
    expect(screen.getByText('Prosody Analysis')).toBeInTheDocument();
    expect(screen.getByText('Line Stability')).toBeInTheDocument();
  });

  it('should show stability indicators with correct labels', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    expect(screen.getByText('Stable endings')).toBeInTheDocument();
    expect(screen.getByText('Mixed endings')).toBeInTheDocument();
    expect(screen.getByText('Unstable endings')).toBeInTheDocument();
    expect(screen.getByText('No indicator')).toBeInTheDocument();
  });

  it('should show descriptions for each stability type', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    expect(screen.getByText(/Create resolution and closure/)).toBeInTheDocument();
    expect(screen.getByText(/Balance of stable and flowing/)).toBeInTheDocument();
    expect(screen.getByText(/Create movement and flow/)).toBeInTheDocument();
    expect(screen.getByText(/Neutral or unanalyzed lines/)).toBeInTheDocument();
  });

  it('should call onToggle when close button is clicked', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    const closeButton = screen.getByTitle('Hide legend');
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should expand and collapse detailed information', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    // Initially collapsed - detailed info should not be visible
    expect(screen.queryByText('Stability Examples')).not.toBeInTheDocument();

    // Click More button to expand
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // Should now show detailed information
    expect(screen.getByText('Stability Examples')).toBeInTheDocument();
    expect(screen.getByText('Usage Tips')).toBeInTheDocument();
    expect(screen.getByText('Analysis Features')).toBeInTheDocument();

    // Button should now say "Less"
    expect(screen.getByText('Less')).toBeInTheDocument();

    // Click Less button to collapse
    const lessButton = screen.getByText('Less');
    fireEvent.click(lessButton);

    // Detailed info should be hidden again
    expect(screen.queryByText('Stability Examples')).not.toBeInTheDocument();
  });

  it('should show detailed examples when expanded', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    // Expand the legend
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // Check for stability examples
    expect(screen.getByText(/Words ending in -ight, -ound, -eat, -ay/)).toBeInTheDocument();
    expect(screen.getByText(/Words ending in -ing, -er, -ly, -tion/)).toBeInTheDocument();
    expect(screen.getByText(/Example: "bright", "sound", "beat", "day"/)).toBeInTheDocument();
    expect(screen.getByText(/Example: "singing", "better", "slowly", "emotion"/)).toBeInTheDocument();
  });

  it('should show usage tips when expanded', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    // Expand the legend
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // Check for usage tips (text may be split across elements)
    expect(screen.getByText('stable endings')).toBeInTheDocument();
    expect(screen.getByText(/for choruses and song conclusions/)).toBeInTheDocument();
    expect(screen.getByText('unstable endings')).toBeInTheDocument();
    expect(screen.getByText(/for verses to maintain forward momentum/)).toBeInTheDocument();
    expect(screen.getByText('Mixed sections')).toBeInTheDocument();
    expect(screen.getByText(/provide balanced flow and interest/)).toBeInTheDocument();
  });

  it('should show analysis features when expanded', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    // Expand the legend
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // Check for analysis features (text may be split across elements)
    expect(screen.getByText('Rhyme Detection:')).toBeInTheDocument();
    expect(screen.getByText(/Identifies perfect and near rhymes/)).toBeInTheDocument();
    expect(screen.getByText('Syllable Counting:')).toBeInTheDocument();
    expect(screen.getByText(/Helps maintain consistent rhythm/)).toBeInTheDocument();
    expect(screen.getByText('Section Analysis:')).toBeInTheDocument();
    expect(screen.getByText(/Overall stability assessment per section/)).toBeInTheDocument();
    expect(screen.getByText('Real-time Updates:')).toBeInTheDocument();
    expect(screen.getByText(/Analysis updates as you type/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProsodyLegend show={true} onToggle={mockOnToggle} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show quick info at the bottom', () => {
    render(<ProsodyLegend show={true} onToggle={mockOnToggle} />);

    expect(screen.getByText(/Analysis updates automatically as you edit/)).toBeInTheDocument();
    expect(screen.getByText(/Green borders indicate stable line endings/)).toBeInTheDocument();
  });
});
