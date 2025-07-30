/**
 * Utility functions for handling rich text formatting in lyrics
 */

export interface FormattedTextSegment {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
}

/**
 * Parse formatted text and return segments with formatting information
 */
export function parseFormattedText(text: string): FormattedTextSegment[] {
  const segments: FormattedTextSegment[] = []
  let currentIndex = 0
  
  while (currentIndex < text.length) {
    
    // Look for formatting markers
    const remainingText = text.substring(currentIndex)
    
    // Check for bold (**text**)
    const boldMatch = remainingText.match(/^\*\*([^*]+)\*\*/)
    // Check for italic (*text* but not **text**)
    const italicMatch = remainingText.match(/^\*([^*]+)\*(?!\*)/)
    // Check for underline (_text_)
    const underlineMatch = remainingText.match(/^_([^_]+)_/)
    
    // Find the nearest formatting marker
    const markers = []
    if (boldMatch) markers.push({ type: 'bold', match: boldMatch, index: currentIndex })
    if (italicMatch) markers.push({ type: 'italic', match: italicMatch, index: currentIndex })
    if (underlineMatch) markers.push({ type: 'underline', match: underlineMatch, index: currentIndex })
    
    if (markers.length > 0) {
      // Found formatting, process it
      const marker = markers[0] // Take the first one
      
      if (marker.type === 'bold' && boldMatch) {
        segments.push({
          text: boldMatch[1],
          bold: true,
          italic: false,
          underline: false
        })
        currentIndex += boldMatch[0].length
      } else if (marker.type === 'italic' && italicMatch) {
        segments.push({
          text: italicMatch[1],
          bold: false,
          italic: true,
          underline: false
        })
        currentIndex += italicMatch[0].length
      } else if (marker.type === 'underline' && underlineMatch) {
        segments.push({
          text: underlineMatch[1],
          bold: false,
          italic: false,
          underline: true
        })
        currentIndex += underlineMatch[0].length
      }
    } else {
      // No formatting found, look for the next potential formatting marker
      const nextBold = text.indexOf('**', currentIndex)
      const nextItalic = text.indexOf('*', currentIndex)
      const nextUnderline = text.indexOf('_', currentIndex)
      
      const nextMarkers = [nextBold, nextItalic, nextUnderline].filter(index => index !== -1)
      const nextMarker = nextMarkers.length > 0 ? Math.min(...nextMarkers) : text.length
      
      // Add plain text segment
      if (nextMarker > currentIndex) {
        segments.push({
          text: text.substring(currentIndex, nextMarker),
          bold: false,
          italic: false,
          underline: false
        })
        currentIndex = nextMarker
      } else {
        // No more markers, add rest as plain text
        segments.push({
          text: text.substring(currentIndex),
          bold: false,
          italic: false,
          underline: false
        })
        break
      }
    }
  }
  
  return segments
}

/**
 * Convert formatted text to HTML for preview
 */
export function formatTextToHtml(text: string): string {
  const segments = parseFormattedText(text)
  
  return segments.map(segment => {
    let html = segment.text
    
    // Escape HTML characters
    html = html.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
    
    // Apply formatting
    if (segment.bold) html = `<strong>${html}</strong>`
    if (segment.italic) html = `<em>${html}</em>`
    if (segment.underline) html = `<u>${html}</u>`
    
    return html
  }).join('')
}

/**
 * Convert formatted text to plain text (remove formatting markers)
 */
export function formatTextToPlain(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')      // Remove italic
    .replace(/_([^_]+)_/g, '$1')        // Remove underline
}

/**
 * Get word count from formatted text
 */
export function getWordCount(text: string): number {
  const plainText = formatTextToPlain(text)
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Check if text contains formatting
 */
export function hasFormatting(text: string): boolean {
  return /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/.test(text)
}