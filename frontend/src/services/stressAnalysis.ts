/**
 * Comprehensive stress analysis service for communicating with the backend
 * stress analysis API that uses spaCy, CMU dictionary, and G2P fallback.
 */

export interface WordAnalysis {
  word: string
  pos: string  // Part of speech tag from spaCy
  syllables: string[]
  stress_pattern: number[]  // 0=unstressed, 1=primary, 2=secondary
  reasoning: string  // Explanation of how stress was determined
  char_positions: number[]  // Character positions for stress mark placement
  confidence: number
}

export interface StressAnalysisResult {
  text: string
  total_syllables: number
  stressed_syllables: number
  processing_time_ms: number
  words: WordAnalysis[]
}

export interface BatchStressAnalysisResult {
  total_lines: number
  total_processing_time_ms: number
  lines: Array<{
    line_number: number
    text: string
    total_syllables: number
    stressed_syllables: number
    processing_time_ms: number
    words: WordAnalysis[]
  }>
}

export interface AnalyzerStatus {
  status: 'ready' | 'error'
  message: string
  components: {
    spacy_model?: string
    g2p_model?: string
    cmu_dictionary?: string
    total_words?: number
    cache_size?: number
    cache_hits?: number
    cache_misses?: number
  }
}

class ComprehensiveStressAnalysisService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
  }

  /**
   * Analyze stress patterns for a single text using the comprehensive algorithm
   */
  async analyzeText(
    text: string,
    context: 'lyrical' | 'conversational' = 'lyrical'
  ): Promise<StressAnalysisResult> {
    const response = await fetch(`${this.baseURL}/api/stress/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        context
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Analyze stress patterns for multiple lines of text in batch
   */
  async analyzeBatch(
    lines: string[],
    context: 'lyrical' | 'conversational' = 'lyrical'
  ): Promise<BatchStressAnalysisResult> {
    const response = await fetch(`${this.baseURL}/api/stress/analyze-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lines,
        context
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get status of the comprehensive stress analyzer components
   */
  async getAnalyzerStatus(): Promise<AnalyzerStatus> {
    const response = await fetch(`${this.baseURL}/api/stress/analyzer-status`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Extract lines from Lexical JSON structure for batch analysis
   */
  extractLinesFromLexicalJSON(lexicalJSON: unknown): string[] {
    const lines: string[] = []

    function traverseNodes(nodes: unknown[]) {
      for (const node of nodes) {
        const nodeObj = node as Record<string, unknown>
        if (nodeObj.type === 'section-paragraph' || nodeObj.type === 'paragraph') {
          // Extract text content from paragraph node
          const textContent = this.extractTextFromNode(nodeObj)
          if (textContent.trim()) {
            lines.push(textContent.trim())
          }
        }

        // Recursively traverse children
        if (nodeObj.children && Array.isArray(nodeObj.children)) {
          traverseNodes(nodeObj.children as unknown[])
        }
      }
    }

    const lexicalObj = lexicalJSON as Record<string, unknown>
    const root = lexicalObj?.root as Record<string, unknown>
    if (root?.children && Array.isArray(root.children)) {
      traverseNodes.call(this, root.children as unknown[])
    }

    return lines
  }

  /**
   * Extract text content from a Lexical node
   */
  private extractTextFromNode(node: unknown): string {
    if (!node || typeof node !== 'object') return ''

    const nodeObj = node as Record<string, unknown>

    if (nodeObj.type === 'text') {
      return String(nodeObj.text || '')
    }

    if (nodeObj.children && Array.isArray(nodeObj.children)) {
      return nodeObj.children
        .map((child: unknown) => this.extractTextFromNode(child))
        .join('')
    }

    return ''
  }

  /**
   * Convert stress analysis results back to character positions for UI rendering
   */
  getStressMarksForText(text: string, words: WordAnalysis[]): Array<{
    position: number
    stress: number
    word: string
    syllable: string
  }> {
    const stressMarks: Array<{
      position: number
      stress: number
      word: string
      syllable: string
    }> = []

    let textPosition = 0

    for (const wordAnalysis of words) {
      // Find word position in text
      const wordStartIndex = text.indexOf(wordAnalysis.word, textPosition)
      if (wordStartIndex === -1) continue

      // Map stress marks to character positions
      for (let i = 0; i < wordAnalysis.char_positions.length; i++) {
        const charPos = wordAnalysis.char_positions[i]
        const stressLevel = wordAnalysis.stress_pattern[i] || 0
        const syllable = wordAnalysis.syllables[i] || ''

        stressMarks.push({
          position: wordStartIndex + charPos,
          stress: stressLevel,
          word: wordAnalysis.word,
          syllable
        })
      }

      textPosition = wordStartIndex + wordAnalysis.word.length
    }

    return stressMarks
  }

  /**
   * Check if the comprehensive analyzer is available and ready
   */
  async isReady(): Promise<boolean> {
    try {
      const status = await this.getAnalyzerStatus()
      return status.status === 'ready'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const comprehensiveStressAnalysis = new ComprehensiveStressAnalysisService()
export default comprehensiveStressAnalysis
