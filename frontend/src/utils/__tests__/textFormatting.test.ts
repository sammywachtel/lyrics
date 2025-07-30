import {
  parseFormattedText,
  formatTextToHtml,
  formatTextToPlain,
  getWordCount,
  hasFormatting
} from '../textFormatting'

describe('textFormatting utilities', () => {
  describe('parseFormattedText', () => {
    it('should parse plain text correctly', () => {
      const result = parseFormattedText('Hello world')
      expect(result).toEqual([
        {
          text: 'Hello world',
          bold: false,
          italic: false,
          underline: false
        }
      ])
    })

    it('should parse bold text correctly', () => {
      const result = parseFormattedText('**Hello** world')
      expect(result).toEqual([
        {
          text: 'Hello',
          bold: true,
          italic: false,
          underline: false
        },
        {
          text: ' world',
          bold: false,
          italic: false,
          underline: false
        }
      ])
    })

    it('should parse italic text correctly', () => {
      const result = parseFormattedText('*Hello* world')
      expect(result).toEqual([
        {
          text: 'Hello',
          bold: false,
          italic: true,
          underline: false
        },
        {
          text: ' world',
          bold: false,
          italic: false,
          underline: false
        }
      ])
    })

    it('should parse underline text correctly', () => {
      const result = parseFormattedText('_Hello_ world')
      expect(result).toEqual([
        {
          text: 'Hello',
          bold: false,
          italic: false,
          underline: true
        },
        {
          text: ' world',
          bold: false,
          italic: false,
          underline: false
        }
      ])
    })

    it('should parse multiple formatting types', () => {
      const result = parseFormattedText('**Bold** *italic* _underline_')
      expect(result).toEqual([
        {
          text: 'Bold',
          bold: true,
          italic: false,
          underline: false
        },
        {
          text: ' ',
          bold: false,
          italic: false,
          underline: false
        },
        {
          text: 'italic',
          bold: false,
          italic: true,
          underline: false
        },
        {
          text: ' ',
          bold: false,
          italic: false,
          underline: false
        },
        {
          text: 'underline',
          bold: false,
          italic: false,
          underline: true
        }
      ])
    })

    it('should handle empty text', () => {
      const result = parseFormattedText('')
      expect(result).toEqual([])
    })

    it('should handle malformed formatting', () => {
      const result = parseFormattedText('**incomplete bold')
      expect(result).toEqual([
        {
          text: '**incomplete bold',
          bold: false,
          italic: false,
          underline: false
        }
      ])
    })
  })

  describe('formatTextToHtml', () => {
    it('should convert plain text to HTML', () => {
      const result = formatTextToHtml('Hello world')
      expect(result).toBe('Hello world')
    })

    it('should convert bold text to HTML', () => {
      const result = formatTextToHtml('**Hello** world')
      expect(result).toBe('<strong>Hello</strong> world')
    })

    it('should convert italic text to HTML', () => {
      const result = formatTextToHtml('*Hello* world')
      expect(result).toBe('<em>Hello</em> world')
    })

    it('should convert underline text to HTML', () => {
      const result = formatTextToHtml('_Hello_ world')
      expect(result).toBe('<u>Hello</u> world')
    })

    it('should escape HTML characters', () => {
      const result = formatTextToHtml('**<script>** alert')
      expect(result).toBe('<strong>&lt;script&gt;</strong> alert')
    })

    it('should handle multiple formatting types', () => {
      const result = formatTextToHtml('**Bold** *italic* _underline_')
      expect(result).toBe('<strong>Bold</strong> <em>italic</em> <u>underline</u>')
    })
  })

  describe('formatTextToPlain', () => {
    it('should remove bold formatting', () => {
      const result = formatTextToPlain('**Hello** world')
      expect(result).toBe('Hello world')
    })

    it('should remove italic formatting', () => {
      const result = formatTextToPlain('*Hello* world')
      expect(result).toBe('Hello world')
    })

    it('should remove underline formatting', () => {
      const result = formatTextToPlain('_Hello_ world')
      expect(result).toBe('Hello world')
    })

    it('should remove all formatting types', () => {
      const result = formatTextToPlain('**Bold** *italic* _underline_')
      expect(result).toBe('Bold italic underline')
    })

    it('should handle text without formatting', () => {
      const result = formatTextToPlain('Plain text')
      expect(result).toBe('Plain text')
    })
  })

  describe('getWordCount', () => {
    it('should count words in plain text', () => {
      const result = getWordCount('Hello world')
      expect(result).toBe(2)
    })

    it('should count words in formatted text', () => {
      const result = getWordCount('**Hello** *world*')
      expect(result).toBe(2)
    })

    it('should handle empty text', () => {
      const result = getWordCount('')
      expect(result).toBe(0)
    })

    it('should handle whitespace-only text', () => {
      const result = getWordCount('   ')
      expect(result).toBe(0)
    })

    it('should handle multiple spaces between words', () => {
      const result = getWordCount('Hello    world')
      expect(result).toBe(2)
    })

    it('should count words in multiline text', () => {
      const result = getWordCount('**Hello**\n*world*\n_test_')
      expect(result).toBe(3)
    })
  })

  describe('hasFormatting', () => {
    it('should return false for plain text', () => {
      const result = hasFormatting('Hello world')
      expect(result).toBe(false)
    })

    it('should return true for bold text', () => {
      const result = hasFormatting('**Hello** world')
      expect(result).toBe(true)
    })

    it('should return true for italic text', () => {
      const result = hasFormatting('*Hello* world')
      expect(result).toBe(true)
    })

    it('should return true for underline text', () => {
      const result = hasFormatting('_Hello_ world')
      expect(result).toBe(true)
    })

    it('should return false for malformed formatting', () => {
      const result = hasFormatting('**incomplete')
      expect(result).toBe(false)
    })

    it('should return true for mixed formatting', () => {
      const result = hasFormatting('**Bold** and *italic*')
      expect(result).toBe(true)
    })

    it('should handle empty text', () => {
      const result = hasFormatting('')
      expect(result).toBe(false)
    })
  })
})