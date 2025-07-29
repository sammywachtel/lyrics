// Utilities for handling song sections in lyrics

export interface SongSection {
  name: string
  startLine: number
  endLine: number
  content: string
}

// Common section types for quick insertion
export const COMMON_SECTIONS = [
  { name: 'Verse 1', tag: '[Verse 1]' },
  { name: 'Verse 2', tag: '[Verse 2]' },
  { name: 'Verse 3', tag: '[Verse 3]' },
  { name: 'Chorus', tag: '[Chorus]' },
  { name: 'Pre-Chorus', tag: '[Pre-Chorus]' },
  { name: 'Bridge', tag: '[Bridge]' },
  { name: 'Intro', tag: '[Intro]' },
  { name: 'Outro', tag: '[Outro]' },
  { name: 'Hook', tag: '[Hook]' },
]

// Regular expression to match section tags like [Verse 1], [Chorus], etc.
export const SECTION_TAG_REGEX = /^\[([^\]]+)\]$/

// Parse lyrics and extract sections
export function parseSections(lyrics: string): SongSection[] {
  if (!lyrics.trim()) return []
  
  const lines = lyrics.split('\n')
  const sections: SongSection[] = []
  let currentSection: { name: string; startLine: number } | undefined = undefined
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    const match = trimmedLine.match(SECTION_TAG_REGEX)
    
    if (match) {
      // End previous section if it exists
      if (currentSection) {
        const endLine = index - 1
        const content = lines
          .slice(currentSection.startLine + 1, index)
          .join('\n')
          .trim()
        sections.push({
          name: currentSection.name,
          startLine: currentSection.startLine,
          endLine,
          content
        })
      }
      
      // Start new section
      currentSection = {
        name: match[1],
        startLine: index,
      }
    }
  })
  
  // Close the last section
  if (currentSection !== undefined) {
    const section = currentSection as { name: string; startLine: number }
    const endLine = lines.length - 1
    const content = lines
      .slice(section.startLine + 1)
      .join('\n')
      .trim()
    sections.push({
      name: section.name,
      startLine: section.startLine,
      endLine,
      content
    })
  }
  
  return sections
}

// Insert a section tag at the cursor position
export function insertSectionAtPosition(
  lyrics: string,
  position: number,
  sectionTag: string
): { newLyrics: string; newPosition: number } {
  const before = lyrics.substring(0, position)
  const after = lyrics.substring(position)
  
  // Add some spacing around the section tag
  const beforeHasNewline = before.endsWith('\n') || before === ''
  const afterHasNewline = after.startsWith('\n') || after === ''
  
  const prefix = beforeHasNewline ? '' : '\n'
  const suffix = afterHasNewline ? '' : '\n'
  
  const insertion = `${prefix}${sectionTag}${suffix}`
  const newLyrics = before + insertion + after
  const newPosition = position + insertion.length
  
  return { newLyrics, newPosition }
}

// Get section at a specific line number
export function getSectionAtLine(sections: SongSection[], lineNumber: number): SongSection | null {
  return sections.find(section => 
    lineNumber >= section.startLine && lineNumber <= section.endLine
  ) || null
}

// Jump to a specific section by name
export function getPositionOfSection(lyrics: string, sectionName: string): number | null {
  const lines = lyrics.split('\n')
  const targetTag = `[${sectionName}]`
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === targetTag) {
      // Return position at start of the line
      return lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0)
    }
  }
  
  return null
}

// Validate section tag format
export function isValidSectionTag(text: string): boolean {
  return SECTION_TAG_REGEX.test(text.trim())
}

// Extract section name from tag
export function extractSectionName(tag: string): string | null {
  const match = tag.trim().match(SECTION_TAG_REGEX)
  return match ? match[1] : null
}