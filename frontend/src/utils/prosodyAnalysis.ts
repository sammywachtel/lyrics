// Prosody Analysis Utilities for Songwriting
// Provides real-time analysis of line stability, rhyme schemes, and structure

export interface LineAnalysis {
  text: string;
  lineNumber: number;
  syllableCount: number;
  stressedSyllableCount: number; // NEW: Count of stressed syllables (what determines line length in songwriting)
  endingType: 'stable' | 'unstable' | 'neutral';
  endingWord: string;
  rhymeSound: string;
  stressPattern?: string[];
}

export interface RhymeConnection {
  type: 'perfect' | 'family' | 'assonance' | 'consonance' | 'none';
  lines: number[];
  rhymeSound: string;
}

export interface SectionAnalysis {
  name: string;
  lineCount: number;
  stability: 'stable' | 'mixed' | 'unstable';
  rhymeScheme: string;
  rhymeConnections: RhymeConnection[];
  averageSyllables: number;
  lineVariance: number;
}

export interface ProsodyAnalysis {
  lines: LineAnalysis[];
  sections: SectionAnalysis[];
  overallStability: 'stable' | 'mixed' | 'unstable';
  dominantRhymeScheme: string;
  clicheDetections: ClicheDetection[];
}

export interface ClicheDetection {
  phrase: string;
  lineNumber: number;
  startIndex: number;
  endIndex: number;
  suggestion?: string;
}

// Common clichés in songwriting (basic set, to be expanded)
const COMMON_CLICHES = [
  { phrase: 'heart on fire', suggestion: 'burning passion' },
  { phrase: 'tears fall like rain', suggestion: 'weeping storms' },
  { phrase: 'love is blind', suggestion: 'passion clouds vision' },
  { phrase: 'time heals all wounds', suggestion: 'scars fade slowly' },
  { phrase: 'diamond in the rough', suggestion: 'hidden treasure' },
  { phrase: 'every cloud has a silver lining', suggestion: 'light breaks through darkness' },
  { phrase: 'walk the line', suggestion: 'balance the edge' },
  { phrase: 'against all odds', suggestion: 'defying probability' },
];

// Stable word endings (masculine rhymes)
const STABLE_ENDINGS = [
  /ight$/i, // -ight (night, fight, light, bright)
  /ound$/i, // -ound (sound, found, ground)
  /eak$/i, // -eak (speak, break, weak)
  /eet$/i, // -eet (street, meet, sweet)
  /eat$/i, // -eat (beat, heat, neat)
  /ine$/i, // -ine (fine, mine, line)
  /ay$/i, // -ay (say, day, way)
  /ow$/i, // -ow (know, show, grow)
  /ade$/i, // -ade (made, fade, trade)
  /ame$/i, // -ame (name, game, same)
  /ace$/i, // -ace (place, space, face)
  /ide$/i, // -ide (side, wide, ride)
  /y$/i, // -y endings (sky, fly, cry)
];

// Unstable word endings (feminine rhymes)
const UNSTABLE_ENDINGS = [
  /ing$/i, // -ing (singing, bringing)
  /er$/i, // -er (better, never)
  /le$/i, // -le (little, middle)
  /ly$/i, // -ly (quickly, slowly)
  /tion$/i, // -tion (motion, emotion)
  /ness$/i, // -ness (kindness, darkness)
  /ment$/i, // -ment (moment, movement)
  /ful$/i, // -ful (beautiful, wonderful)
];

// Get rhyme sound from word ending
function getRhymeSound(word: string): string {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 2) return cleaned;
  return cleaned.slice(-2); // Last 2 characters for basic rhyme matching
}

// Count syllables in a word (improved approximation)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;

  // Special cases for common words
  const specialCases: Record<string, number> = {
    'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'but': 1,
    'simple': 2, 'people': 2, 'little': 2, 'middle': 2, 'apple': 2,
  };

  if (specialCases[word]) {
    return specialCases[word];
  }

  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = /[aeiou]/.test(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e') && count > 1 && !word.match(/[^aeiou]le$/)) {
    count--;
  }

  return Math.max(1, count);
}

// Function-based stress detection for single-syllable words
// Based on songwriting pedagogy: grammatical function determines stress
function isWordStressed(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

  // UNSTRESSED - Grammatical function words
  const unstressedWords = new Set([
    // Articles
    'the', 'a', 'an',
    // Conjunctions
    'and', 'but', 'or', 'yet', 'if', 'so', 'nor', 'for',
    // Personal Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'us', 'them', 'me', 'him', 'her',
    // Common Prepositions (most common subset of 181)
    'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'from', 'up', 'about', 'into',
    'over', 'after', 'before', 'under', 'through', 'during', 'between', 'among',
    'against', 'without', 'within', 'upon', 'beneath', 'beside', 'beyond', 'across',
    // Modal verbs and auxiliaries (often unstressed)
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might', 'must', 'shall', 'should'
  ]);

  if (unstressedWords.has(cleanWord)) {
    return false;
  }

  // CONTEXTUAL WORDS that can be either stressed or unstressed
  // For now, default to stressed (can be enhanced with context analysis later)
  const contextualWords = new Set(['there', 'here', 'where', 'when', 'how', 'why', 'what']);
  if (contextualWords.has(cleanWord)) {
    // TODO: Add contextual analysis - for now assume stressed as demonstrative
    return true;
  }

  // STRESSED - Meaning/Semantic function words (default for single-syllable)
  // Nouns, Verbs, Adjectives, Adverbs that carry meaning
  return true;
}

// Count stressed syllables in a line using function-based approach
function countStressedSyllables(line: string): number {
  const words = line.trim().split(/\s+/).filter(word => word.length > 0);
  let stressedCount = 0;

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) continue;

    const syllableCount = countSyllables(cleanWord);

    if (syllableCount === 1) {
      // Single-syllable: use function-based detection
      if (isWordStressed(cleanWord)) {
        stressedCount += 1;
      }
      // Unstressed single-syllable words contribute 0
    } else {
      // Multi-syllable: use dictionary-based detection (existing approach)
      // For now, approximate as 1 stressed syllable per multi-syllable word
      // TODO: Integrate with existing StressedTextNode patterns for accurate count
      stressedCount += 1; // Rough approximation until we integrate with stress pattern data
    }
  }

  return stressedCount;
}

// Analyze line ending stability
function analyzeLineEnding(line: string): 'stable' | 'unstable' | 'neutral' {
  const words = line.trim().split(/\s+/);
  if (words.length === 0) return 'neutral';

  const lastWord = words[words.length - 1].toLowerCase();

  // Check for stable endings first
  if (STABLE_ENDINGS.some(pattern => pattern.test(lastWord))) {
    return 'stable';
  }

  // Check for unstable endings
  if (UNSTABLE_ENDINGS.some(pattern => pattern.test(lastWord))) {
    return 'unstable';
  }

  return 'neutral';
}

// Detect if two words rhyme
function detectRhyme(word1: string, word2: string): 'perfect' | 'family' | 'assonance' | 'consonance' | 'none' {
  const cleaned1 = word1.toLowerCase().replace(/[^a-z]/g, '');
  const cleaned2 = word2.toLowerCase().replace(/[^a-z]/g, '');

  if (cleaned1 === cleaned2) return 'perfect';

  const sound1 = getRhymeSound(cleaned1);
  const sound2 = getRhymeSound(cleaned2);

  if (sound1 === sound2 && sound1.length >= 2) return 'perfect';

  // Check last character for near rhymes
  if (cleaned1.slice(-1) === cleaned2.slice(-1)) {
    const lastChar = cleaned1.slice(-1);
    if (/[aeiou]/.test(lastChar)) return 'assonance';
    return 'consonance';
  }

  return 'none';
}

// Analyze individual lines
export function analyzeLines(text: string): LineAnalysis[] {
  const lines = text.split('\n');
  const analyses: LineAnalysis[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const words = trimmedLine.split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const stressedSyllableCount = countStressedSyllables(trimmedLine); // NEW: Function-based stressed count

    analyses.push({
      text: trimmedLine,
      lineNumber: index + 1,
      syllableCount,
      stressedSyllableCount, // NEW: Critical metric for songwriting line length
      endingType: analyzeLineEnding(trimmedLine),
      endingWord: lastWord,
      rhymeSound: getRhymeSound(lastWord),
    });
  });

  return analyses;
}

// Detect rhyme scheme pattern
export function detectRhymeScheme(lines: LineAnalysis[]): { scheme: string; connections: RhymeConnection[] } {
  const connections: RhymeConnection[] = [];
  const schemeLetters: string[] = [];
  // const rhymeMap: Map<string, { letter: string; indices: number[] }> = new Map(); // Unused for now
  let nextLetter = 'A';

  lines.forEach((line, index) => {
    let assigned = false;

    // Check if this word rhymes with any previous word
    for (let i = 0; i < index; i++) {
      const rhymeType = detectRhyme(line.endingWord, lines[i].endingWord);

      if (rhymeType !== 'none') {
        // Use the same letter as the rhyming line
        const rhymingLetter = schemeLetters[i];
        schemeLetters[index] = rhymingLetter;
        assigned = true;

        // Add to connections
        const connection = connections.find(c => c.lines.includes(i));
        if (connection) {
          if (!connection.lines.includes(index)) {
            connection.lines.push(index);
          }
        } else {
          connections.push({
            type: rhymeType,
            lines: [i, index],
            rhymeSound: line.rhymeSound,
          });
        }
        break;
      }
    }

    if (!assigned) {
      // Assign new letter
      schemeLetters[index] = nextLetter;
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    }
  });

  return {
    scheme: schemeLetters.join(''),
    connections,
  };
}

// Analyze sections
export function analyzeSections(text: string): SectionAnalysis[] {
  const sections: SectionAnalysis[] = [];
  const lines = text.split('\n');

  let currentSection = 'Intro';
  let currentSectionLines: string[] = [];

  lines.forEach((line) => {
    const sectionMatch = line.match(/\[([^\]]+)\]/);

    if (sectionMatch) {
      // Process previous section
      if (currentSectionLines.length > 0) {
        const sectionText = currentSectionLines.join('\n');
        const lineAnalyses = analyzeLines(sectionText);
        const { scheme, connections } = detectRhymeScheme(lineAnalyses);

        const syllableCounts = lineAnalyses.map(l => l.syllableCount);
        const avgSyllables = syllableCounts.length > 0 ?
          syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length : 0;
        const variance = syllableCounts.length > 1 ?
          syllableCounts.reduce((sum, count) => sum + Math.pow(count - avgSyllables, 2), 0) / syllableCounts.length : 0;

        // Determine section stability
        const stableLines = lineAnalyses.filter(l => l.endingType === 'stable').length;
        const unstableLines = lineAnalyses.filter(l => l.endingType === 'unstable').length;
        const lineCount = lineAnalyses.length;

        let stability: 'stable' | 'mixed' | 'unstable';
        if (stableLines > unstableLines) {
          stability = 'stable';
        } else if (unstableLines > stableLines) {
          stability = 'unstable';
        } else {
          stability = 'mixed';
        }

        sections.push({
          name: currentSection,
          lineCount,
          stability,
          rhymeScheme: scheme,
          rhymeConnections: connections,
          averageSyllables: avgSyllables,
          lineVariance: variance,
        });
      }

      // Start new section
      currentSection = sectionMatch[1];
      currentSectionLines = [];
    } else if (line.trim()) {
      currentSectionLines.push(line);
    }
  });

  // Process final section
  if (currentSectionLines.length > 0) {
    const sectionText = currentSectionLines.join('\n');
    const lineAnalyses = analyzeLines(sectionText);
    const { scheme, connections } = detectRhymeScheme(lineAnalyses);

    const syllableCounts = lineAnalyses.map(l => l.syllableCount);
    const avgSyllables = syllableCounts.length > 0 ?
      syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length : 0;
    const variance = syllableCounts.length > 1 ?
      syllableCounts.reduce((sum, count) => sum + Math.pow(count - avgSyllables, 2), 0) / syllableCounts.length : 0;

    const stableLines = lineAnalyses.filter(l => l.endingType === 'stable').length;
    const unstableLines = lineAnalyses.filter(l => l.endingType === 'unstable').length;
    const lineCount = lineAnalyses.length;

    let stability: 'stable' | 'mixed' | 'unstable';
    if (stableLines > unstableLines) {
      stability = 'stable';
    } else if (unstableLines > stableLines) {
      stability = 'unstable';
    } else {
      stability = 'mixed';
    }

    sections.push({
      name: currentSection,
      lineCount,
      stability,
      rhymeScheme: scheme,
      rhymeConnections: connections,
      averageSyllables: avgSyllables,
      lineVariance: variance,
    });
  }

  return sections;
}

// Detect clichés
export function detectCliches(text: string): ClicheDetection[] {
  const detections: ClicheDetection[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    const lowerLine = line.toLowerCase();

    COMMON_CLICHES.forEach(({ phrase, suggestion }) => {
      const index = lowerLine.indexOf(phrase);
      if (index !== -1) {
        detections.push({
          phrase,
          lineNumber: lineIndex + 1,
          startIndex: index,
          endIndex: index + phrase.length,
          suggestion,
        });
      }
    });
  });

  return detections;
}

// Main analysis function
export function analyzeProsody(text: string): ProsodyAnalysis {
  const lines = analyzeLines(text);
  const sections = analyzeSections(text);
  const clicheDetections = detectCliches(text);

  // Calculate overall stability
  const totalStableLines = lines.filter(l => l.endingType === 'stable').length;
  const totalUnstableLines = lines.filter(l => l.endingType === 'unstable').length;

  let overallStability: 'stable' | 'mixed' | 'unstable';
  if (totalStableLines > totalUnstableLines) {
    overallStability = 'stable';
  } else if (totalUnstableLines > totalStableLines) {
    overallStability = 'unstable';
  } else {
    overallStability = 'mixed';
  }

  // Find dominant rhyme scheme (first section's scheme, limited to 4 chars)
  const dominantRhymeScheme = sections.length > 0 ?
    sections[0].rhymeScheme.slice(0, 4) : 'ABAB';

  return {
    lines,
    sections,
    overallStability,
    dominantRhymeScheme,
    clicheDetections,
  };
}

// Helper to get stability color
export function getStabilityColor(stability: 'stable' | 'mixed' | 'unstable'): string {
  switch (stability) {
    case 'stable':
      return '#10b981'; // green-500
    case 'mixed':
      return '#f59e0b'; // amber-500
    case 'unstable':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

// Helper to get rhyme scheme letter color
export function getRhymeColor(letter: string): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#a855f7', // purple-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
  ];

  const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
  return colors[index % colors.length];
}
