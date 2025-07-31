import React from 'react';
import type { LineAnalysis, RhymeConnection } from '../../utils/prosodyAnalysis';
import { getStabilityColor, getRhymeColor } from '../../utils/prosodyAnalysis';

interface ProsodyIndicatorsProps {
  lines: LineAnalysis[];
  rhymeConnections: RhymeConnection[];
  showStability: boolean;
  showRhymes: boolean;
  currentLineIndex?: number;
}

export const ProsodyIndicators: React.FC<ProsodyIndicatorsProps> = ({
  lines,
  rhymeConnections,
  showStability,
  showRhymes,
  currentLineIndex,
}) => {
  // Group lines by their rhyme scheme letter
  const getRhymeLetter = (lineIndex: number): string => {
    const connection = rhymeConnections.find(conn => 
      conn.lines.includes(lineIndex)
    );
    
    if (!connection) return '';
    
    // Assign letters based on connection groups
    const sortedConnections = [...rhymeConnections].sort((a, b) => 
      Math.min(...a.lines) - Math.min(...b.lines)
    );
    
    const connectionIndex = sortedConnections.indexOf(connection);
    return String.fromCharCode('A'.charCodeAt(0) + connectionIndex);
  };

  // Get tooltip content for stability
  const getStabilityTooltip = (line: LineAnalysis): string => {
    const tips = [`Line ${line.lineNumber}: ${line.endingType} ending`];
    tips.push(`Syllables: ${line.syllableCount}`);
    tips.push(`Ending: "${line.endingWord}"`);
    
    if (line.endingType === 'stable') {
      tips.push('Tip: Stable endings create resolution and closure');
    } else if (line.endingType === 'unstable') {
      tips.push('Tip: Unstable endings create movement and flow');
    }
    
    return tips.join('\n');
  };

  // Get tooltip content for rhymes
  const getRhymeTooltip = (lineIndex: number): string => {
    const connection = rhymeConnections.find(conn => 
      conn.lines.includes(lineIndex)
    );
    
    if (!connection) return 'No rhyme detected';
    
    const otherLines = connection.lines.filter(i => i !== lineIndex);
    const rhymeType = connection.type.charAt(0).toUpperCase() + connection.type.slice(1);
    
    return `${rhymeType} rhyme with line${otherLines.length > 1 ? 's' : ''} ${otherLines.map(i => i + 1).join(', ')}`;
  };

  return (
    <div className="prosody-indicators">
      {lines.map((line, index) => {
        const isCurrentLine = currentLineIndex === index;
        const rhymeLetter = getRhymeLetter(index);
        
        return (
          <div
            key={index}
            className={`prosody-line-wrapper ${isCurrentLine ? 'current-line' : ''}`}
          >
            {/* Line number with stability indicator */}
            {showStability && (
              <div
                className="line-number-indicator"
                style={{ 
                  borderLeftColor: getStabilityColor(line.endingType === 'neutral' ? 'mixed' : line.endingType),
                  backgroundColor: isCurrentLine ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                }}
                title={getStabilityTooltip(line)}
              >
                <span className="line-number">{line.lineNumber}</span>
              </div>
            )}
            
            {/* Rhyme scheme badge */}
            {showRhymes && rhymeLetter && (
              <div
                className="rhyme-badge"
                style={{ backgroundColor: getRhymeColor(rhymeLetter) }}
                title={getRhymeTooltip(index)}
              >
                {rhymeLetter}
              </div>
            )}
            
            {/* Line content with subtle indicators */}
            <div className="line-content">
              <span className={`line-text ${line.endingType}-ending`}>
                {line.text}
              </span>
              
              {/* Syllable count indicator */}
              <span className="syllable-count" title={`${line.syllableCount} syllables`}>
                {line.syllableCount}
              </span>
            </div>
          </div>
        );
      })}
      
      {/* Rhyme connection lines (optional advanced feature) */}
      {showRhymes && (
        <svg className="rhyme-connections" aria-hidden="true">
          {rhymeConnections.map((connection, index) => {
            if (connection.lines.length < 2) return null;
            
            // Draw subtle connection lines between rhyming lines
            const color = getRhymeColor(String.fromCharCode('A'.charCodeAt(0) + index));
            
            return connection.lines.slice(1).map((lineIndex, i) => {
              const fromLine = connection.lines[i];
              const toLine = lineIndex;
              
              // Simple bezier curve between lines
              const y1 = fromLine * 24 + 12;
              const y2 = toLine * 24 + 12;
              const x1 = 0;
              const x2 = 20;
              const midY = (y1 + y2) / 2;
              
              return (
                <path
                  key={`${index}-${i}`}
                  d={`M ${x1} ${y1} Q ${x2} ${midY} ${x1} ${y2}`}
                  stroke={color}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
              );
            });
          })}
        </svg>
      )}
    </div>
  );
};

// Section stability summary component
export const SectionStabilitySummary: React.FC<{
  sectionName: string;
  stability: 'stable' | 'mixed' | 'unstable';
  lineCount: number;
  rhymeScheme: string;
}> = ({ sectionName, stability, lineCount, rhymeScheme }) => {
  const getStabilityIcon = () => {
    switch (stability) {
      case 'stable':
        return '✓';
      case 'mixed':
        return '~';
      case 'unstable':
        return '!';
    }
  };

  const getStabilityDescription = () => {
    switch (stability) {
      case 'stable':
        return 'Well-balanced section with stable endings';
      case 'mixed':
        return 'Mix of stable and unstable endings';
      case 'unstable':
        return 'Dynamic section with flowing endings';
    }
  };

  return (
    <div className="section-stability-summary">
      <div className="section-header">
        <span className="section-name">{sectionName}</span>
        <span 
          className="stability-icon"
          style={{ color: getStabilityColor(stability) }}
          title={getStabilityDescription()}
        >
          {getStabilityIcon()}
        </span>
      </div>
      <div className="section-stats">
        <span className="stat">
          <span className="stat-label">Lines:</span>
          <span className="stat-value">{lineCount}</span>
        </span>
        <span className="stat">
          <span className="stat-label">Pattern:</span>
          <span className="stat-value">{rhymeScheme.slice(0, 4)}</span>
        </span>
        <span className="stat">
          <span className="stat-label">Stability:</span>
          <span 
            className="stat-value"
            style={{ color: getStabilityColor(stability) }}
          >
            {stability}
          </span>
        </span>
      </div>
    </div>
  );
};

// Cliché highlight component
export const ClicheHighlight: React.FC<{
  phrase: string;
  suggestion?: string;
  onReplace?: (suggestion: string) => void;
}> = ({ phrase, suggestion, onReplace }) => {
  return (
    <span className="cliche-highlight">
      <span className="cliche-text" title="Common cliché detected">
        {phrase}
      </span>
      {suggestion && (
        <span className="cliche-suggestion">
          <button
            className="suggestion-button"
            onClick={() => onReplace?.(suggestion)}
            title={`Replace with: ${suggestion}`}
          >
            💡
          </button>
        </span>
      )}
    </span>
  );
};