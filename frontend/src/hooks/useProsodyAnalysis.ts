import { useState, useEffect, useMemo, useCallback } from 'react';
import { analyzeProsody, type ProsodyAnalysis, type LineAnalysis } from '../utils/prosodyAnalysis';
import { debounce } from 'lodash';

interface ProsodySettings {
  enableStabilityAnalysis: boolean;
  enableRhymeDetection: boolean;
  enableClicheDetection: boolean;
  analysisDelay: number; // milliseconds
}

interface UseProsodyAnalysisOptions {
  text: string;
  settings?: Partial<ProsodySettings>;
  onAnalysisComplete?: (analysis: ProsodyAnalysis) => void;
}

interface UseProsodyAnalysisReturn {
  analysis: ProsodyAnalysis | null;
  isAnalyzing: boolean;
  currentLineAnalysis: LineAnalysis | null;
  refreshAnalysis: () => void;
}

const defaultSettings: ProsodySettings = {
  enableStabilityAnalysis: true,
  enableRhymeDetection: true,
  enableClicheDetection: true,
  analysisDelay: 1000, // 1000ms debounce for better UX
};

export function useProsodyAnalysis({
  text,
  settings = {},
  onAnalysisComplete,
}: UseProsodyAnalysisOptions): UseProsodyAnalysisReturn {
  const [analysis, setAnalysis] = useState<ProsodyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null); // Unused for now

  // Merge settings with defaults
  const mergedSettings = useMemo(
    () => ({ ...defaultSettings, ...settings }),
    [settings]
  );

  // Create debounced analysis function
  const debouncedAnalyze = useMemo(
    () =>
      debounce((textToAnalyze: string) => {
        setIsAnalyzing(true);

        try {
          // Perform analysis based on settings
          const result = analyzeProsody(textToAnalyze);

          // Filter results based on settings
          const filteredResult: ProsodyAnalysis = {
            ...result,
            lines: mergedSettings.enableStabilityAnalysis ? result.lines : [],
            sections: mergedSettings.enableStabilityAnalysis ? result.sections : [],
            clicheDetections: mergedSettings.enableClicheDetection ? result.clicheDetections : [],
          };

          setAnalysis(filteredResult);
          onAnalysisComplete?.(filteredResult);
        } catch (error) {
          console.error('Prosody analysis error:', error);
          setAnalysis(null);
        } finally {
          setIsAnalyzing(false);
        }
      }, mergedSettings.analysisDelay),
    [mergedSettings, onAnalysisComplete]
  );

  // Effect to trigger analysis when text changes
  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    debouncedAnalyze(text);

    // Cleanup
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [text, debouncedAnalyze]);

  // Calculate current line based on cursor position (to be integrated with editor)
  const currentLineAnalysis = useMemo(() => {
    // if (!analysis || currentLineIndex === null || !analysis.lines[currentLineIndex]) {
    //   return null;
    // }
    // return analysis.lines[currentLineIndex];
    return null; // Disabled for now
  }, []);

  // Manual refresh function
  const refreshAnalysis = useCallback(() => {
    if (text && text.trim().length > 0) {
      debouncedAnalyze.cancel();
      debouncedAnalyze(text);
    }
  }, [text, debouncedAnalyze]);

  return {
    analysis,
    isAnalyzing,
    currentLineAnalysis,
    refreshAnalysis,
  };
}

// Hook for section-specific analysis
export function useSectionAnalysis(sectionText: string, sectionName: string) {
  const { analysis } = useProsodyAnalysis({ text: sectionText });

  const sectionAnalysis = useMemo(() => {
    if (!analysis || !analysis.sections.length) return null;

    // Find the section or use the first one
    return analysis.sections.find(s => s.name === sectionName) || analysis.sections[0];
  }, [analysis, sectionName]);

  return sectionAnalysis;
}

// Hook for real-time line analysis (for current line being edited)
export function useLineAnalysis(line: string) {
  const [lineAnalysis, setLineAnalysis] = useState<LineAnalysis | null>(null);

  const analyzeLine = useMemo(
    () =>
      debounce((lineText: string) => {
        if (!lineText.trim()) {
          setLineAnalysis(null);
          return;
        }

        const analysis = analyzeProsody(lineText);
        if (analysis.lines.length > 0) {
          setLineAnalysis(analysis.lines[0]);
        }
      }, 300),
    []
  );

  useEffect(() => {
    analyzeLine(line);
    return () => {
      analyzeLine.cancel();
    };
  }, [line, analyzeLine]);

  return lineAnalysis;
}

// Hook to get prosody settings from global settings context
export function useProsodySettings() {
  // This would connect to your global settings context
  // For now, returning defaults
  const settings: ProsodySettings = {
    enableStabilityAnalysis: true,
    enableRhymeDetection: true,
    enableClicheDetection: true,
    analysisDelay: 500,
  };

  const updateSettings = useCallback((updates: Partial<ProsodySettings>) => {
    // Update settings in context
    console.log('Updating prosody settings:', updates);
  }, []);

  return { settings, updateSettings };
}
