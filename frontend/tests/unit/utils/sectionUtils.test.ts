import {
  parseSections,
  insertSectionAtPosition,
  getPositionOfSection,
  getSectionAtLine,
  isValidSectionTag,
  extractSectionName,
  SECTION_TAG_REGEX,
  COMMON_SECTIONS
} from '../../../src/utils/sectionUtils'

describe('sectionUtils', () => {
  describe('SECTION_TAG_REGEX', () => {
    it('should match valid section tags', () => {
      expect('[Verse 1]').toMatch(SECTION_TAG_REGEX)
      expect('[Chorus]').toMatch(SECTION_TAG_REGEX)
      expect('[Bridge]').toMatch(SECTION_TAG_REGEX)
      expect('[Pre-Chorus]').toMatch(SECTION_TAG_REGEX)
      expect('[Verse 2 - Alternate]').toMatch(SECTION_TAG_REGEX)
    })

    it('should not match invalid section tags', () => {
      expect('Verse 1').not.toMatch(SECTION_TAG_REGEX)
      expect('[Verse 1').not.toMatch(SECTION_TAG_REGEX)
      expect('Verse 1]').not.toMatch(SECTION_TAG_REGEX)
      expect('[]').not.toMatch(SECTION_TAG_REGEX)
      expect('[').not.toMatch(SECTION_TAG_REGEX)
      expect(']').not.toMatch(SECTION_TAG_REGEX)
    })
  })

  describe('parseSections', () => {
    it('should return empty array for empty lyrics', () => {
      expect(parseSections('')).toEqual([])
      expect(parseSections('   ')).toEqual([])
      expect(parseSections('\n\n')).toEqual([])
    })

    it('should parse single section correctly', () => {
      const lyrics = `[Verse 1]
This is the first verse
With multiple lines
Of content`

      const sections = parseSections(lyrics)
      expect(sections).toHaveLength(1)
      expect(sections[0]).toEqual({
        name: 'Verse 1',
        startLine: 0,
        endLine: 3,
        content: 'This is the first verse\nWith multiple lines\nOf content'
      })
    })

    it('should parse multiple sections correctly', () => {
      const lyrics = `[Verse 1]
First verse line 1
First verse line 2

[Chorus]
Chorus line 1
Chorus line 2

[Verse 2]
Second verse line 1`

      const sections = parseSections(lyrics)
      expect(sections).toHaveLength(3)

      expect(sections[0]).toEqual({
        name: 'Verse 1',
        startLine: 0,
        endLine: 3,
        content: 'First verse line 1\nFirst verse line 2'
      })

      expect(sections[1]).toEqual({
        name: 'Chorus',
        startLine: 4,
        endLine: 7,
        content: 'Chorus line 1\nChorus line 2'
      })

      expect(sections[2]).toEqual({
        name: 'Verse 2',
        startLine: 8,
        endLine: 9,
        content: 'Second verse line 1'
      })
    })

    it('should handle sections with no content', () => {
      const lyrics = `[Verse 1]

[Chorus]

[Bridge]`

      const sections = parseSections(lyrics)
      expect(sections).toHaveLength(3)
      expect(sections[0].content).toBe('')
      expect(sections[1].content).toBe('')
      expect(sections[2].content).toBe('')
    })

    it('should handle mixed content with and without sections', () => {
      const lyrics = `Some intro text
without a section

[Verse 1]
This has a section

More text without section

[Chorus]
Final section`

      const sections = parseSections(lyrics)
      expect(sections).toHaveLength(2)
      expect(sections[0].name).toBe('Verse 1')
      expect(sections[1].name).toBe('Chorus')
    })

    it('should handle complex section names', () => {
      const lyrics = `[Verse 1 - Acoustic Version]
Content here

[Pre-Chorus (Harmony)]
More content

[Bridge - Instrumental Break]
Even more content`

      const sections = parseSections(lyrics)
      expect(sections).toHaveLength(3)
      expect(sections[0].name).toBe('Verse 1 - Acoustic Version')
      expect(sections[1].name).toBe('Pre-Chorus (Harmony)')
      expect(sections[2].name).toBe('Bridge - Instrumental Break')
    })
  })

  describe('insertSectionAtPosition', () => {
    it('should insert section at beginning of empty text', () => {
      const result = insertSectionAtPosition('', 0, '[Verse 1]')
      expect(result.newLyrics).toBe('[Verse 1]')
      expect(result.newPosition).toBe(9)
    })

    it('should insert section at beginning of text', () => {
      const lyrics = 'Existing content'
      const result = insertSectionAtPosition(lyrics, 0, '[Verse 1]')
      expect(result.newLyrics).toBe('[Verse 1]\nExisting content')
      expect(result.newPosition).toBe(10)
    })

    it('should insert section in middle of text with proper spacing', () => {
      const lyrics = 'Line 1\nLine 2\nLine 3'
      const position = 7 // After "Line 1\n"
      const result = insertSectionAtPosition(lyrics, position, '[Chorus]')
      expect(result.newLyrics).toBe('Line 1\n[Chorus]\nLine 2\nLine 3')
      expect(result.newPosition).toBe(16)
    })

    it('should insert section at end of text', () => {
      const lyrics = 'Existing content'
      const result = insertSectionAtPosition(lyrics, lyrics.length, '[Outro]')
      // New behavior: section goes above the current line
      expect(result.newLyrics).toBe('\n[Outro]\nExisting content')
      expect(result.newPosition).toBe(9) // After "\n[Outro]\n"
    })

    it('should handle insertion with existing newlines', () => {
      const lyrics = 'Line 1\n\nLine 3'
      const position = 8 // After "Line 1\n\n"
      const result = insertSectionAtPosition(lyrics, position, '[Bridge]')
      expect(result.newLyrics).toBe('Line 1\n\n[Bridge]\nLine 3')
      expect(result.newPosition).toBe(17)
    })
  })

  describe('getPositionOfSection', () => {
    it('should return null for non-existent section', () => {
      const lyrics = '[Verse 1]\nContent'
      expect(getPositionOfSection(lyrics, 'Chorus')).toBeNull()
    })

    it('should return correct position for existing section', () => {
      const lyrics = '[Verse 1]\nVerse content\n[Chorus]\nChorus content'
      expect(getPositionOfSection(lyrics, 'Verse 1')).toBe(0)
      expect(getPositionOfSection(lyrics, 'Chorus')).toBe(24)
    })

    it('should return position for section in complex lyrics', () => {
      const lyrics = `Some intro
[Verse 1]
Verse content
More verse

[Chorus]
Chorus content`

      expect(getPositionOfSection(lyrics, 'Verse 1')).toBe(11)
      expect(getPositionOfSection(lyrics, 'Chorus')).toBe(47)
    })

    it('should handle exact section name matching', () => {
      const lyrics = '[Verse 1]\nContent\n[Verse 11]\nMore content'
      expect(getPositionOfSection(lyrics, 'Verse 1')).toBe(0)
      expect(getPositionOfSection(lyrics, 'Verse 11')).toBe(18)
    })
  })

  describe('getSectionAtLine', () => {
    const lyrics = `[Verse 1]
Line 1
Line 2

[Chorus]
Chorus line 1
Chorus line 2`

    const sections = parseSections(lyrics)

    it('should return correct section for lines within section', () => {
      expect(getSectionAtLine(sections, 0)?.name).toBe('Verse 1') // Section tag line
      expect(getSectionAtLine(sections, 1)?.name).toBe('Verse 1') // Content line 1
      expect(getSectionAtLine(sections, 2)?.name).toBe('Verse 1') // Content line 2
      expect(getSectionAtLine(sections, 3)?.name).toBe('Verse 1') // Empty line

      expect(getSectionAtLine(sections, 4)?.name).toBe('Chorus') // Section tag line
      expect(getSectionAtLine(sections, 5)?.name).toBe('Chorus') // Content line 1
      expect(getSectionAtLine(sections, 6)?.name).toBe('Chorus') // Content line 2
    })

    it('should return null for lines outside any section', () => {
      const lyricsWithoutSections = 'Line 1\nLine 2\n[Verse 1]\nContent'
      const sectionsWithGap = parseSections(lyricsWithoutSections)

      expect(getSectionAtLine(sectionsWithGap, 0)).toBeNull() // Before any section
      expect(getSectionAtLine(sectionsWithGap, 1)).toBeNull() // Before any section
      expect(getSectionAtLine(sectionsWithGap, 2)?.name).toBe('Verse 1') // Section line
    })

    it('should return null for invalid line numbers', () => {
      expect(getSectionAtLine(sections, -1)).toBeNull()
      expect(getSectionAtLine(sections, 100)).toBeNull()
    })
  })

  describe('isValidSectionTag', () => {
    it('should return true for valid section tags', () => {
      expect(isValidSectionTag('[Verse 1]')).toBe(true)
      expect(isValidSectionTag('[Chorus]')).toBe(true)
      expect(isValidSectionTag('[Bridge - Instrumental]')).toBe(true)
      expect(isValidSectionTag('  [Outro]  ')).toBe(true) // With whitespace
    })

    it('should return false for invalid section tags', () => {
      expect(isValidSectionTag('Verse 1')).toBe(false)
      expect(isValidSectionTag('[Verse 1')).toBe(false)
      expect(isValidSectionTag('Verse 1]')).toBe(false)
      expect(isValidSectionTag('[]')).toBe(false)
      expect(isValidSectionTag('')).toBe(false)
    })
  })

  describe('extractSectionName', () => {
    it('should extract name from valid section tags', () => {
      expect(extractSectionName('[Verse 1]')).toBe('Verse 1')
      expect(extractSectionName('[Chorus]')).toBe('Chorus')
      expect(extractSectionName('[Bridge - Instrumental]')).toBe('Bridge - Instrumental')
      expect(extractSectionName('  [Outro]  ')).toBe('Outro') // With whitespace
    })

    it('should return null for invalid section tags', () => {
      expect(extractSectionName('Verse 1')).toBeNull()
      expect(extractSectionName('[Verse 1')).toBeNull()
      expect(extractSectionName('Verse 1]')).toBeNull()
      expect(extractSectionName('[]')).toBeNull()
      expect(extractSectionName('')).toBeNull()
    })
  })

  describe('COMMON_SECTIONS', () => {
    it('should contain expected common sections', () => {
      expect(COMMON_SECTIONS).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Verse 1', tag: '[Verse 1]' }),
          expect.objectContaining({ name: 'Verse 2', tag: '[Verse 2]' }),
          expect.objectContaining({ name: 'Chorus', tag: '[Chorus]' }),
          expect.objectContaining({ name: 'Bridge', tag: '[Bridge]' }),
        ])
      )
    })

    it('should have consistent structure', () => {
      COMMON_SECTIONS.forEach(section => {
        expect(section).toHaveProperty('name')
        expect(section).toHaveProperty('tag')
        expect(typeof section.name).toBe('string')
        expect(typeof section.tag).toBe('string')
        expect(section.tag).toMatch(SECTION_TAG_REGEX)
      })
    })
  })
})
