// Utilities for handling song sections in lyrics

export interface SongSection {
  name: string
  startLine: number
  endLine: number
  content: string
}

// Common section types for quick insertion (deprecated - use getAvailableSectionTypes instead)
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

// Insert a section tag at the cursor position - places tag at start of current or new line
export function insertSectionAtPosition(
  lyrics: string,
  position: number,
  sectionTag: string
): { newLyrics: string; newPosition: number } {
  const before = lyrics.substring(0, position)
  const after = lyrics.substring(position)
  
  // Find which line the cursor is on
  const beforeLines = before.split('\n')
  const currentLineIndex = beforeLines.length - 1
  const currentLineText = beforeLines[currentLineIndex]
  
  // If we're at the start of a line or the line is empty, insert section here
  // Otherwise, create a new line above
  const isAtLineStart = currentLineText === ''
  const shouldInsertAbove = !isAtLineStart && currentLineText.trim() !== ''
  
  if (shouldInsertAbove) {
    // Insert section tag on a new line above current content
    const lineStartPosition = position - currentLineText.length
    const beforeLine = lyrics.substring(0, lineStartPosition)
    const currentLineAndAfter = lyrics.substring(lineStartPosition)
    
    const needsSpacing = beforeLine && !beforeLine.endsWith('\n')
    const prefix = needsSpacing ? '\n\n' : '\n'
    
    const insertion = `${prefix}${sectionTag}\n`
    const newLyrics = beforeLine + insertion + currentLineAndAfter
    const newPosition = beforeLine.length + insertion.length
    
    return { newLyrics, newPosition }
  } else {
    // Insert at current position with proper spacing
    const beforeHasNewline = before.endsWith('\n') || before === ''
    const afterHasNewline = after.startsWith('\n') || after === ''
    
    const prefix = beforeHasNewline ? '' : '\n'
    const suffix = afterHasNewline ? '' : '\n'
    
    const insertion = `${prefix}${sectionTag}${suffix}`
    const newLyrics = before + insertion + after
    const newPosition = position + insertion.length
    
    return { newLyrics, newPosition }
  }
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

// Wrap selected text with a section tag - places section tag ABOVE the selection
export function wrapTextWithSection(
  lyrics: string,
  startPosition: number,
  endPosition: number,
  sectionTag: string
): { newLyrics: string; newStartPosition: number; newEndPosition: number } {
  const before = lyrics.substring(0, startPosition)
  const selectedText = lyrics.substring(startPosition, endPosition)
  const after = lyrics.substring(endPosition)
  
  // Ensure the selected text is properly formatted
  const cleanSelectedText = selectedText.trim()
  
  // Add proper spacing around the section
  const beforeTrimmed = before.trimEnd()
  const afterTrimmed = after.trimStart()
  
  const needsNewlineBefore = beforeTrimmed && !beforeTrimmed.endsWith('\n')
  const needsDoubleNewlineBefore = beforeTrimmed && beforeTrimmed.split('\n').pop()?.trim() !== ''
  const needsNewlineAfter = afterTrimmed && !afterTrimmed.startsWith('\n')
  
  // Build the wrapped content with proper spacing
  let prefix = ''
  if (needsNewlineBefore) {
    prefix = needsDoubleNewlineBefore ? '\n\n' : '\n'
  }
  
  const suffix = needsNewlineAfter ? '\n' : ''
  
  const wrappedText = `${prefix}${sectionTag}\n${cleanSelectedText}${suffix}`
  const newLyrics = before + wrappedText + after
  
  const newStartPosition = startPosition + prefix.length
  const newEndPosition = newStartPosition + sectionTag.length + 1 + cleanSelectedText.length
  
  return { newLyrics, newStartPosition, newEndPosition }
}

// Section types for smart numbering
export type SectionType = 'Verse' | 'Chorus' | 'Pre-Chorus' | 'Bridge' | 'Intro' | 'Outro' | 'Hook'

// Get section type from section name
export function getSectionType(sectionName: string): SectionType | null {
  const name = sectionName.toLowerCase()
  if (name.includes('verse')) return 'Verse'
  if (name.includes('chorus') && !name.includes('pre')) return 'Chorus'
  if (name.includes('pre-chorus') || name.includes('prechorus')) return 'Pre-Chorus'
  if (name.includes('bridge')) return 'Bridge'
  if (name.includes('intro')) return 'Intro'
  if (name.includes('outro')) return 'Outro'
  if (name.includes('hook')) return 'Hook'
  return null
}

// Get next number for a section type
export function getNextSectionNumber(sections: SongSection[], sectionType: SectionType): number {
  const existingSections = sections.filter(section => {
    const type = getSectionType(section.name)
    return type === sectionType
  })
  
  // For unique sections (Intro, Outro, Bridge), don't add numbers unless multiples exist
  if (['Intro', 'Outro', 'Bridge', 'Hook', 'Pre-Chorus'].includes(sectionType)) {
    return existingSections.length > 0 ? existingSections.length + 1 : 1
  }
  
  // For verses and choruses, always use numbers
  return existingSections.length + 1
}

// Generate section tag with smart numbering
export function generateSectionTag(sections: SongSection[], sectionType: SectionType): string {
  const existingSections = sections.filter(section => {
    const type = getSectionType(section.name)
    return type === sectionType
  })
  
  const nextNumber = existingSections.length + 1
  
  // For single sections like Bridge, Intro, Outro - don't add number unless there are multiples
  if (['Intro', 'Outro', 'Bridge', 'Hook', 'Pre-Chorus'].includes(sectionType) && nextNumber === 1) {
    return `[${sectionType}]`
  }
  
  return `[${sectionType} ${nextNumber}]`
}

// Renumber sections to maintain order based on text position
export function renumberSections(lyrics: string): string {
  const sections = parseSections(lyrics)
  if (sections.length === 0) return lyrics
  
  const lines = lyrics.split('\n')
  const renumberedLines = [...lines]
  
  // Group sections by type
  const sectionsByType = new Map<SectionType, Array<{ section: SongSection; index: number }>>()
  
  sections.forEach((section, index) => {
    const type = getSectionType(section.name)
    if (type) {
      if (!sectionsByType.has(type)) {
        sectionsByType.set(type, [])
      }
      sectionsByType.get(type)!.push({ section, index })
    }
  })
  
  // Renumber each type based on text order
  sectionsByType.forEach((typeSections, sectionType) => {
    // Sort by start line to maintain text order
    typeSections.sort((a, b) => a.section.startLine - b.section.startLine)
    
    typeSections.forEach((item, typeIndex) => {
      const { section } = item
      const newNumber = typeIndex + 1
      
      // Generate new section name
      let newSectionName: string
      if (['Intro', 'Outro', 'Bridge', 'Hook', 'Pre-Chorus'].includes(sectionType) && typeSections.length === 1) {
        newSectionName = sectionType
      } else {
        newSectionName = `${sectionType} ${newNumber}`
      }
      
      // Update the line with the new section tag
      renumberedLines[section.startLine] = `[${newSectionName}]`
    })
  })
  
  return renumberedLines.join('\n')
}

// Get available section types for quick insert with simplified display names
export function getAvailableSectionTypes(sections: SongSection[]): Array<{ type: SectionType; tag: string; description: string }> {
  const sectionTypes: Array<{ type: SectionType; tag: string; description: string }> = []
  
  // Core section types - always show with simple names
  const coreTypes: SectionType[] = ['Verse', 'Chorus', 'Pre-Chorus', 'Bridge']
  
  coreTypes.forEach(type => {
    const existingCount = sections.filter(s => getSectionType(s.name) === type).length
    const nextNumber = existingCount + 1
    
    // Generate the actual tag with smart numbering
    let tag: string
    if (['Pre-Chorus', 'Bridge'].includes(type) && existingCount === 0) {
      tag = `[${type}]`
    } else {
      tag = `[${type} ${nextNumber}]`
    }
    
    sectionTypes.push({
      type,
      tag,
      description: type // Show simple name like "Verse", "Chorus", etc.
    })
  })
  
  // Additional section types
  const additionalTypes: SectionType[] = ['Intro', 'Outro', 'Hook']
  
  additionalTypes.forEach(type => {
    const existingCount = sections.filter(s => getSectionType(s.name) === type).length
    const tag = existingCount > 0 ? `[${type} ${existingCount + 1}]` : `[${type}]`
    
    sectionTypes.push({
      type,
      tag,
      description: type // Show simple name
    })
  })
  
  return sectionTypes
}