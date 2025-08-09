import React, { useState } from 'react';

interface ProsodyLegendProps {
  show: boolean;
  onToggle: () => void;
  className?: string;
}

export const ProsodyLegend: React.FC<ProsodyLegendProps> = ({
  show,
  onToggle,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!show) return null;

  return (
    <div className={`prosody-legend bg-white/90 backdrop-blur-sm border border-neutral-200/50 rounded-lg shadow-soft p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <span>🎵</span>
          <span>Prosody Analysis</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-neutral-600 hover:text-neutral-800 px-2 py-1 rounded-md hover:bg-neutral-100/50"
            title={isExpanded ? 'Show less' : 'Show more details'}
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
          <button
            onClick={onToggle}
            className="text-neutral-400 hover:text-neutral-600 w-5 h-5 flex items-center justify-center"
            title="Hide legend"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Line Stability Indicators */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-neutral-700 mb-2">Line Stability</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-l-3 border-green-500 bg-neutral-50"></div>
              <div className="text-xs">
                <span className="font-medium text-green-700">Stable endings</span>
                <span className="text-neutral-600 ml-1">- Create resolution and closure</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-l-3 border-amber-500 bg-neutral-50"></div>
              <div className="text-xs">
                <span className="font-medium text-amber-700">Mixed endings</span>
                <span className="text-neutral-600 ml-1">- Balance of stable and flowing</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-l-3 border-red-500 bg-neutral-50"></div>
              <div className="text-xs">
                <span className="font-medium text-red-700">Unstable endings</span>
                <span className="text-neutral-600 ml-1">- Create movement and flow</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-l-3 border-transparent bg-neutral-50"></div>
              <div className="text-xs">
                <span className="font-medium text-neutral-700">No indicator</span>
                <span className="text-neutral-600 ml-1">- Neutral or unanalyzed lines</span>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Detailed Explanations */}
            <div className="border-t border-neutral-200/50 pt-3">
              <h4 className="text-xs font-medium text-neutral-700 mb-2">Stability Examples</h4>
              <div className="space-y-2 text-xs text-neutral-600">
                <div>
                  <span className="font-medium text-green-700">Stable:</span> Words ending in -ight, -ound, -eat, -ay
                  <br />
                  <span className="italic">Example: "bright", "sound", "beat", "day"</span>
                </div>
                <div>
                  <span className="font-medium text-red-700">Unstable:</span> Words ending in -ing, -er, -ly, -tion
                  <br />
                  <span className="italic">Example: "singing", "better", "slowly", "emotion"</span>
                </div>
              </div>
            </div>

            {/* Usage Tips */}
            <div className="border-t border-neutral-200/50 pt-3">
              <h4 className="text-xs font-medium text-neutral-700 mb-2">Usage Tips</h4>
              <ul className="space-y-1 text-xs text-neutral-600">
                <li>• Use <span className="text-green-700 font-medium">stable endings</span> for choruses and song conclusions</li>
                <li>• Use <span className="text-red-700 font-medium">unstable endings</span> for verses to maintain forward momentum</li>
                <li>• <span className="text-amber-700 font-medium">Mixed sections</span> provide balanced flow and interest</li>
                <li>• Empty lines and section headers don't affect prosody analysis</li>
              </ul>
            </div>

            {/* Rhyme Scheme Info */}
            <div className="border-t border-neutral-200/50 pt-3">
              <h4 className="text-xs font-medium text-neutral-700 mb-2">Analysis Features</h4>
              <div className="text-xs text-neutral-600 space-y-1">
                <div>• <span className="font-medium">Rhyme Detection:</span> Identifies perfect and near rhymes</div>
                <div>• <span className="font-medium">Syllable Counting:</span> Helps maintain consistent rhythm</div>
                <div>• <span className="font-medium">Section Analysis:</span> Overall stability assessment per section</div>
                <div>• <span className="font-medium">Real-time Updates:</span> Analysis updates as you type</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-neutral-200/50">
        <div className="text-xs text-neutral-500">
          Analysis updates automatically as you edit. Green borders indicate stable line endings.
        </div>
      </div>
    </div>
  );
};

export default ProsodyLegend;
