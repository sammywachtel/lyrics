import '@testing-library/jest-dom'
import {
  $createRangeSelection,
  $setSelection,
  $getRoot,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  createEditor,
  type LexicalEditor
} from 'lexical'
import { $createSectionParagraphNode, SectionParagraphNode } from '../../nodes/SectionParagraphNode'
import {
  $getCurrentSectionType,
  $applySectionFormatting,
  $clearSectionFormatting
} from '../SectionFormattingCommands'

describe('SectionFormattingCommands', () => {
  let editor: LexicalEditor

  beforeEach(() => {
    // Create a new editor instance for each test with SectionParagraphNode
    editor = createEditor({
      nodes: [SectionParagraphNode]
    })
  })

  describe('$getCurrentSectionType with cursor position (collapsed selection)', () => {
    it('should detect section type when cursor is positioned in section paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a section paragraph with verse formatting
        const verseParagraph = $createSectionParagraphNode('verse')
        const textNode = $createTextNode('This is a verse line')
        verseParagraph.append(textNode)
        root.append(verseParagraph)

        // Create a collapsed selection (cursor position) at the beginning of text
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 0, 'text')
        selection.focus.set(textNode.getKey(), 0, 'text')
        $setSelection(selection)

        // The selection should be collapsed (cursor-only)
        const currentSelection = $getSelection()
        expect($isRangeSelection(currentSelection)).toBe(true)
        if ($isRangeSelection(currentSelection)) {
          expect(currentSelection.isCollapsed()).toBe(true)
        }

        // Should detect the verse section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('verse')
      })
    })

    it('should detect section type when cursor is positioned in middle of section paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a section paragraph with chorus formatting
        const chorusParagraph = $createSectionParagraphNode('chorus')
        const textNode = $createTextNode('This is a chorus line')
        chorusParagraph.append(textNode)
        root.append(chorusParagraph)

        // Position cursor in the middle of the text
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 10, 'text')
        selection.focus.set(textNode.getKey(), 10, 'text')
        $setSelection(selection)

        // Should detect the chorus section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('chorus')
      })
    })

    it('should detect section type when cursor is at end of section paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a section paragraph with bridge formatting
        const bridgeParagraph = $createSectionParagraphNode('bridge')
        const textNode = $createTextNode('This is a bridge')
        bridgeParagraph.append(textNode)
        root.append(bridgeParagraph)

        // Position cursor at the end
        const textLength = textNode.getTextContent().length
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), textLength, 'text')
        selection.focus.set(textNode.getKey(), textLength, 'text')
        $setSelection(selection)

        // Should detect the bridge section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('bridge')
      })
    })

    it('should return null when cursor is in unformatted paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create an unformatted section paragraph (no section type)
        const paragraph = $createSectionParagraphNode()
        const textNode = $createTextNode('This is unformatted text')
        paragraph.append(textNode)
        root.append(paragraph)

        // Position cursor in the paragraph
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 5, 'text')
        selection.focus.set(textNode.getKey(), 5, 'text')
        $setSelection(selection)

        // Should return null for unformatted paragraph
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe(null)
      })
    })
  })

  describe('$getCurrentSectionType with text selection (range selection)', () => {
    it('should detect section type when text is selected within section paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a section paragraph with pre-chorus formatting
        const preChorusParagraph = $createSectionParagraphNode('pre-chorus')
        const textNode = $createTextNode('This is a pre-chorus line')
        preChorusParagraph.append(textNode)
        root.append(preChorusParagraph)

        // Select part of the text
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 5, 'text')
        selection.focus.set(textNode.getKey(), 15, 'text')
        $setSelection(selection)

        // The selection should not be collapsed (text selection)
        const currentSelection = $getSelection()
        expect($isRangeSelection(currentSelection)).toBe(true)
        if ($isRangeSelection(currentSelection)) {
          expect(currentSelection.isCollapsed()).toBe(false)
        }

        // Should detect the pre-chorus section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('pre-chorus')
      })
    })

    it('should detect section type when entire text is selected in section paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a section paragraph with intro formatting
        const introParagraph = $createSectionParagraphNode('intro')
        const textNode = $createTextNode('Intro text here')
        introParagraph.append(textNode)
        root.append(introParagraph)

        // Select all text
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 0, 'text')
        selection.focus.set(textNode.getKey(), textNode.getTextContent().length, 'text')
        $setSelection(selection)

        // Should detect the intro section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('intro')
      })
    })

    it('should handle multiple paragraphs with same section type', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create multiple verse paragraphs
        const verse1 = $createSectionParagraphNode('verse')
        const text1 = $createTextNode('First verse line')
        verse1.append(text1)
        root.append(verse1)

        const verse2 = $createSectionParagraphNode('verse')
        const text2 = $createTextNode('Second verse line')
        verse2.append(text2)
        root.append(verse2)

        // Select across both paragraphs
        const selection = $createRangeSelection()
        selection.anchor.set(text1.getKey(), 0, 'text')
        selection.focus.set(text2.getKey(), text2.getTextContent().length, 'text')
        $setSelection(selection)

        // Should detect consistent verse section
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('verse')
      })
    })

    it('should return null when paragraphs have different section types', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create paragraphs with different section types
        const verse = $createSectionParagraphNode('verse')
        const verseText = $createTextNode('Verse text')
        verse.append(verseText)
        root.append(verse)

        const chorus = $createSectionParagraphNode('chorus')
        const chorusText = $createTextNode('Chorus text')
        chorus.append(chorusText)
        root.append(chorus)

        // Select across both different sections
        const selection = $createRangeSelection()
        selection.anchor.set(verseText.getKey(), 0, 'text')
        selection.focus.set(chorusText.getKey(), chorusText.getTextContent().length, 'text')
        $setSelection(selection)

        // Should return null for mixed section types
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe(null)
      })
    })
  })

  describe('$applySectionFormatting with cursor position', () => {
    it('should apply section formatting to paragraph containing cursor', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create an unformatted paragraph
        const paragraph = $createSectionParagraphNode()
        const textNode = $createTextNode('This will become a verse')
        paragraph.append(textNode)
        root.append(paragraph)

        // Position cursor in the paragraph
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 5, 'text')
        selection.focus.set(textNode.getKey(), 5, 'text')
        $setSelection(selection)

        // Apply verse formatting
        $applySectionFormatting('verse')

        // Check that the paragraph now has verse formatting
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('verse')
      })
    })

    it('should toggle section formatting when cursor is in same section type', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a verse paragraph
        const verseParagraph = $createSectionParagraphNode('verse')
        const textNode = $createTextNode('This is already a verse')
        verseParagraph.append(textNode)
        root.append(verseParagraph)

        // Position cursor in the verse
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 10, 'text')
        selection.focus.set(textNode.getKey(), 10, 'text')
        $setSelection(selection)

        // Apply verse formatting again (should toggle off)
        $applySectionFormatting('verse')

        // Check that formatting was removed
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe(null)
      })
    })

    it('should change section type when cursor is in different section', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a chorus paragraph
        const chorusParagraph = $createSectionParagraphNode('chorus')
        const textNode = $createTextNode('This was a chorus')
        chorusParagraph.append(textNode)
        root.append(chorusParagraph)

        // Position cursor in the chorus
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 8, 'text')
        selection.focus.set(textNode.getKey(), 8, 'text')
        $setSelection(selection)

        // Apply bridge formatting
        $applySectionFormatting('bridge')

        // Check that it changed to bridge
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe('bridge')
      })
    })
  })

  describe('$clearSectionFormatting', () => {
    it('should clear section formatting when cursor is in formatted paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create a hook paragraph
        const hookParagraph = $createSectionParagraphNode('hook')
        const textNode = $createTextNode('This is a hook')
        hookParagraph.append(textNode)
        root.append(hookParagraph)

        // Position cursor in the hook
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 7, 'text')
        selection.focus.set(textNode.getKey(), 7, 'text')
        $setSelection(selection)

        // Verify it starts as hook
        expect($getCurrentSectionType()).toBe('hook')

        // Clear formatting
        $clearSectionFormatting()

        // Check that formatting was cleared
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe(null)
      })
    })

    it('should handle clearing when cursor is in unformatted paragraph', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create an unformatted paragraph
        const paragraph = $createSectionParagraphNode()
        const textNode = $createTextNode('This is unformatted')
        paragraph.append(textNode)
        root.append(paragraph)

        // Position cursor in the paragraph
        const selection = $createRangeSelection()
        selection.anchor.set(textNode.getKey(), 5, 'text')
        selection.focus.set(textNode.getKey(), 5, 'text')
        $setSelection(selection)

        // Clear formatting (should not cause errors)
        expect(() => $clearSectionFormatting()).not.toThrow()

        // Should still be null
        const sectionType = $getCurrentSectionType()
        expect(sectionType).toBe(null)
      })
    })
  })

  describe('backward compatibility - existing text selection behavior', () => {
    it('should maintain previous behavior for text selections', async () => {
      await editor.update(() => {
        const root = $getRoot()
        root.clear()

        // Create multiple different section paragraphs
        const verse = $createSectionParagraphNode('verse')
        const verseText = $createTextNode('Verse content here')
        verse.append(verseText)
        root.append(verse)

        const chorus = $createSectionParagraphNode('chorus')
        const chorusText = $createTextNode('Chorus content here')
        chorus.append(chorusText)
        root.append(chorus)

        const unformatted = $createSectionParagraphNode()
        const unformattedText = $createTextNode('No formatting here')
        unformatted.append(unformattedText)
        root.append(unformatted)

        // Test 1: Selection within single verse paragraph
        let selection = $createRangeSelection()
        selection.anchor.set(verseText.getKey(), 0, 'text')
        selection.focus.set(verseText.getKey(), 5, 'text')
        $setSelection(selection)
        expect($getCurrentSectionType()).toBe('verse')

        // Test 2: Selection within single chorus paragraph
        selection = $createRangeSelection()
        selection.anchor.set(chorusText.getKey(), 2, 'text')
        selection.focus.set(chorusText.getKey(), 8, 'text')
        $setSelection(selection)
        expect($getCurrentSectionType()).toBe('chorus')

        // Test 3: Selection within unformatted paragraph
        selection = $createRangeSelection()
        selection.anchor.set(unformattedText.getKey(), 0, 'text')
        selection.focus.set(unformattedText.getKey(), 10, 'text')
        $setSelection(selection)
        expect($getCurrentSectionType()).toBe(null)

        // Test 4: Selection across different section types (should return null)
        selection = $createRangeSelection()
        selection.anchor.set(verseText.getKey(), 5, 'text')
        selection.focus.set(chorusText.getKey(), 5, 'text')
        $setSelection(selection)
        expect($getCurrentSectionType()).toBe(null)

        // Test 5: Apply formatting to text selection
        selection = $createRangeSelection()
        selection.anchor.set(unformattedText.getKey(), 0, 'text')
        selection.focus.set(unformattedText.getKey(), 10, 'text')
        $setSelection(selection)

        $applySectionFormatting('outro')
        expect($getCurrentSectionType()).toBe('outro')
      })
    })
  })
})
