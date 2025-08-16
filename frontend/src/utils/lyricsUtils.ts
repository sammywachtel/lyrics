/**
 * Utilities for handling lyrics in different formats (plain text vs Lexical JSON)
 */

export interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  detail?: number
  format?: number | string
  mode?: string
}

export interface LexicalData {
  root?: LexicalNode
}

/**
 * Extract plain text from Lexical JSON format
 */
export function extractTextFromLexical(lexicalData: unknown): string {
  if (!lexicalData || typeof lexicalData !== 'object') {
    return ''
  }

  const data = lexicalData as LexicalData

  function extractTextFromNode(node: LexicalNode): string {
    // If this node has text, return it
    if (node.text) {
      return node.text
    }

    // If this node has children, recursively extract text from them
    if (node.children && Array.isArray(node.children)) {
      return node.children
        .map(child => extractTextFromNode(child))
        .join('')
    }

    // For paragraph breaks, add newlines
    if (node.type === 'paragraph' || node.type === 'section-paragraph') {
      return '\n'
    }

    return ''
  }

  try {
    return extractTextFromNode(data.root || data as LexicalNode).trim()
  } catch (error) {
    console.warn('Error extracting text from Lexical data:', error)
    return ''
  }
}

/**
 * Convert lyrics to plain text, handling both Lexical JSON and plain text formats
 */
export function getLyricsPlainText(lyrics: string): string {
  if (!lyrics || lyrics.trim() === '') {
    return ''
  }

  // Check if it looks like Lexical JSON format
  if (lyrics.trim().startsWith('{') && lyrics.includes('"root"')) {
    try {
      const lexicalData = JSON.parse(lyrics)
      const plainText = extractTextFromLexical(lexicalData)
      return plainText || lyrics // Fallback to original if extraction fails
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      console.warn('Failed to parse Lexical JSON, treating as plain text:', error)
      return lyrics
    }
  }

  // If it doesn't look like JSON, return as-is (plain text)
  return lyrics
}

/**
 * Truncate lyrics with smart word breaking
 */
export function truncateLyrics(lyrics: string, maxLength: number = 100): string {
  const plainText = getLyricsPlainText(lyrics)

  if (plainText.length <= maxLength) {
    return plainText
  }

  // Try to break at word boundaries
  const truncated = plainText.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > maxLength * 0.7) { // If we can break at a word that's not too short
    return truncated.substring(0, lastSpaceIndex) + '...'
  }

  return truncated + '...'
}

/**
 * Get first few lines of lyrics for preview
 */
export function getLyricsPreview(lyrics: string, maxLines: number = 3): string {
  const plainText = getLyricsPlainText(lyrics)
  const lines = plainText.split('\n').filter(line => line.trim() !== '')

  if (lines.length <= maxLines) {
    return plainText
  }

  return lines.slice(0, maxLines).join('\n') + '\n...'
}
