import {
  analyzeLines,
  detectRhymeScheme,
  analyzeSections,
  detectCliches,
  analyzeProsody,
  getStabilityColor,
  getRhymeColor,
} from '../prosodyAnalysis'

describe('prosodyAnalysis', () => {
  describe('analyzeLines', () => {
    it('should analyze line endings for stability', () => {
      const text = `The night is bright
Walking in delight
Keep on running
Love is coming`

      const result = analyzeLines(text)

      expect(result).toHaveLength(4)
      expect(result[0].endingType).toBe('stable') // bright (-ight ending)
      expect(result[1].endingType).toBe('stable') // delight (-ight ending)
      expect(result[2].endingType).toBe('unstable') // running (-ing ending)
      expect(result[3].endingType).toBe('unstable') // coming (-ing ending)
    })

    it('should count syllables correctly', () => {
      const text = `Hello world
Beautiful morning sunshine
Simple word`

      const result = analyzeLines(text)

      expect(result[0].syllableCount).toBe(3) // Hel-lo world
      expect(result[1].syllableCount).toBe(7) // Beau-ti-ful mor-ning sun-shine
      expect(result[2].syllableCount).toBe(3) // Sim-ple word
    })

    it('should extract ending words and rhyme sounds', () => {
      const text = `First line here
Second line there`

      const result = analyzeLines(text)

      expect(result[0].endingWord).toBe('here')
      expect(result[0].rhymeSound).toBe('re')
      expect(result[1].endingWord).toBe('there')
      expect(result[1].rhymeSound).toBe('re')
    })

    it('should handle empty lines', () => {
      const text = `Line one

Line three`

      const result = analyzeLines(text)

      expect(result).toHaveLength(2)
      expect(result[0].lineNumber).toBe(1)
      expect(result[1].lineNumber).toBe(3)
    })

    it('should detect unstable endings', () => {
      const text = `Keep on running
Love is coming
Time for dancing
Keep advancing`

      const result = analyzeLines(text)

      expect(result[0].endingType).toBe('unstable') // running
      expect(result[1].endingType).toBe('unstable') // coming
      expect(result[2].endingType).toBe('unstable') // dancing
      expect(result[3].endingType).toBe('unstable') // advancing
    })
  })

  describe('detectRhymeScheme', () => {
    it('should detect AABB rhyme scheme', () => {
      const lines = analyzeLines(`The night is bright
With pure delight
The day is long
With happy song`)

      const { scheme, connections } = detectRhymeScheme(lines)

      expect(scheme).toBe('AABB')
      expect(connections).toHaveLength(2)
      expect(connections[0].lines).toEqual([0, 1])
      expect(connections[1].lines).toEqual([2, 3])
    })

    it('should detect ABAC rhyme scheme (blue/dew near rhyme)', () => {
      const lines = analyzeLines(`The night is bright
With skies so blue
Full of light
And morning dew`)

      const { scheme, connections } = detectRhymeScheme(lines)

      expect(scheme).toBe('ABAC') // bright/light rhyme, blue/dew don't rhyme perfectly
      expect(connections).toHaveLength(1) // Only bright/light rhyme
    })

    it('should detect ABBA rhyme scheme', () => {
      const lines = analyzeLines(`In the night
We dance away
Throughout the day
We see the light`)

      const { scheme, connections } = detectRhymeScheme(lines)

      expect(scheme).toBe('ABBA')
      expect(connections).toHaveLength(2)
    })

    it('should handle mostly non-rhyming lines', () => {
      const lines = analyzeLines(`First line here
Second line different
Third line unique
Fourth line special`)

      const { scheme, connections } = detectRhymeScheme(lines)

      // 'here' and 'unique' both end in 'e' sound, creating partial rhyme
      expect(scheme).toBe('ABAC')
      expect(connections).toHaveLength(1)
    })

    it('should detect rhyme types correctly', () => {
      const lines = analyzeLines(`The night is bright
With pure delight`)

      const { connections } = detectRhymeScheme(lines)

      expect(connections[0].type).toBe('perfect')
    })
  })

  describe('analyzeSections', () => {
    it('should analyze sections with tags', () => {
      const text = `[Verse 1]
The night is bright
Walking in delight

[Chorus]
The day is long
With happy song
Life goes on strong
Nothing goes wrong`

      const result = analyzeSections(text)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Verse 1')
      expect(result[0].lineCount).toBe(2)
      expect(result[0].rhymeScheme).toBe('AA')
      
      expect(result[1].name).toBe('Chorus')
      expect(result[1].lineCount).toBe(4)
      expect(result[1].rhymeScheme).toBe('AAAA')
    })

    it('should determine section stability', () => {
      const text = `[Verse]
Night is bright
Stars in sight

[Bridge]
Keep on running
Love is coming`

      const result = analyzeSections(text)

      expect(result[0].stability).toBe('stable') // stable endings
      expect(result[1].stability).toBe('unstable') // unstable endings
    })

    it('should calculate average syllables and variance', () => {
      const text = `[Verse]
Short line
Another short line`

      const result = analyzeSections(text)

      expect(result[0].averageSyllables).toBeGreaterThan(0)
      expect(result[0].lineVariance).toBeDefined()
    })

    it('should handle sections without tags', () => {
      const text = `Line one
Line two
Line three`

      const result = analyzeSections(text)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Intro')
    })

    it('should handle mixed stability correctly', () => {
      const text = `[Verse]
Stable ending night
Keep on running`

      const result = analyzeSections(text)

      expect(result[0].lineCount).toBe(2)
      expect(result[0].stability).toBe('mixed') // One stable, one unstable
    })
  })

  describe('detectCliches', () => {
    it('should detect common clichés', () => {
      const text = `My heart on fire burns bright
Love is blind they say`

      const result = detectCliches(text)

      expect(result).toHaveLength(2)
      expect(result[0].phrase).toBe('heart on fire')
      expect(result[0].lineNumber).toBe(1)
      expect(result[0].suggestion).toBeDefined()
      
      expect(result[1].phrase).toBe('love is blind')
      expect(result[1].lineNumber).toBe(2)
    })

    it('should provide correct positions', () => {
      const text = `Walking against all odds today`

      const result = detectCliches(text)

      expect(result).toHaveLength(1)
      expect(result[0].startIndex).toBe(8)
      expect(result[0].endIndex).toBe(24) // 'against all odds' is 15 chars, 8 + 15 = 23, but endIndex is exclusive
    })

    it('should handle no clichés', () => {
      const text = `Original creative lines
Unique expressions shine`

      const result = detectCliches(text)

      expect(result).toHaveLength(0)
    })

    it('should be case insensitive', () => {
      const text = `HEART ON FIRE
Heart On Fire
heart on fire`

      const result = detectCliches(text)

      expect(result).toHaveLength(3)
    })
  })

  describe('analyzeProsody', () => {
    it('should perform complete analysis', () => {
      const text = `[Verse 1]
The night is bright
Walking in delight
The sun shines bright
Everything's alright

[Chorus]
Love is blind they say
But I found my way`

      const result = analyzeProsody(text)

      expect(result.lines).toBeDefined()
      expect(result.sections).toBeDefined()
      expect(result.overallStability).toBeDefined()
      expect(result.dominantRhymeScheme).toBeDefined()
      expect(result.clicheDetections).toBeDefined()
    })

    it('should determine overall stability', () => {
      const stableText = `Night is bright
Stars in sight
Moon's delight
Pure daylight`

      const unstableText = `Keep on running
Love is coming
Time for dancing
Keep advancing`

      const stableResult = analyzeProsody(stableText)
      const unstableResult = analyzeProsody(unstableText)

      expect(stableResult.overallStability).toBe('stable')
      expect(unstableResult.overallStability).toBe('unstable')
    })

    it('should find dominant rhyme scheme', () => {
      const text = `[Verse]
The night is bright
With pure delight

[Chorus]
The day is long
With happy song`

      const result = analyzeProsody(text)

      expect(result.dominantRhymeScheme).toBe('AA') // First 4 chars of scheme
    })

    it('should handle empty text', () => {
      const result = analyzeProsody('')

      expect(result.lines).toHaveLength(0)
      expect(result.sections).toHaveLength(0)
      expect(result.clicheDetections).toHaveLength(0)
    })
  })

  describe('getStabilityColor', () => {
    it('should return correct colors for stability levels', () => {
      expect(getStabilityColor('stable')).toBe('#10b981')
      expect(getStabilityColor('mixed')).toBe('#f59e0b')
      expect(getStabilityColor('unstable')).toBe('#ef4444')
    })
  })

  describe('getRhymeColor', () => {
    it('should return consistent colors for rhyme letters', () => {
      const colorA = getRhymeColor('A')
      const colorB = getRhymeColor('B')
      const colorA2 = getRhymeColor('A')

      expect(colorA).toBe(colorA2) // Same letter gets same color
      expect(colorA).not.toBe(colorB) // Different letters get different colors
    })

    it('should handle letters beyond available colors', () => {
      const colorI = getRhymeColor('I') // 9th letter, should wrap around
      const colorA = getRhymeColor('A')

      expect(colorI).toBe(colorA) // Should wrap to first color
    })
  })
})