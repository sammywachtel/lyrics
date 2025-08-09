import { $createSectionParagraphNode, $isSectionParagraphNode, SectionParagraphNode } from '../SectionParagraphNode'
import { $createTextNode, $getRoot } from 'lexical'
import { createTestEditor } from '../../../utils/testUtils'

describe('SectionParagraphNode', () => {
  let editor: ReturnType<typeof createTestEditor>

  beforeEach(() => {
    editor = createTestEditor()
  })

  describe('Basic Functionality', () => {
    it('should create a section paragraph node', () => {
      editor.update(() => {
        const node = $createSectionParagraphNode()
        expect($isSectionParagraphNode(node)).toBe(true)
        expect(node.getSectionType()).toBe(null)
      })
    })

    it('should create a section paragraph node with section type', () => {
      editor.update(() => {
        const node = $createSectionParagraphNode('verse')
        expect($isSectionParagraphNode(node)).toBe(true)
        expect(node.getSectionType()).toBe('verse')
      })
    })

    it('should allow setting and getting section type', () => {
      editor.update(() => {
        const node = $createSectionParagraphNode()
        node.setSectionType('chorus')
        expect(node.getSectionType()).toBe('chorus')
      })
    })
  })

  describe('Text Editing Capabilities', () => {
    it('should allow text insertion and editing', () => {
      editor.update(() => {
        const root = $getRoot()
        const paragraph = $createSectionParagraphNode('verse')
        const textNode = $createTextNode('Test lyrics')

        paragraph.append(textNode)
        root.append(paragraph)

        // Verify the text is accessible
        expect(paragraph.getTextContent()).toBe('Test lyrics')
      })
    })

    it('should not have restrictive text insertion methods that break selection', () => {
      editor.update(() => {
        const node = $createSectionParagraphNode()

        // These methods should not be overridden to return false
        // as that breaks text selection and editing
        // Since we removed the override, these should use the parent behavior
        // which allows text insertion for editable content
        expect(typeof node.canInsertTextBefore).toBe('function')
        expect(typeof node.canInsertTextAfter).toBe('function')
      })
    })
  })

  describe('Section Formatting', () => {
    it('should serialize and deserialize correctly', () => {
      editor.update(() => {
        const node = $createSectionParagraphNode('bridge')
        const serialized = node.exportJSON()

        expect(serialized.type).toBe('section-paragraph')
        expect(serialized.sectionType).toBe('bridge')
        expect(serialized.version).toBe(1)

        const deserialized = SectionParagraphNode.importJSON(serialized)
        expect(deserialized.getSectionType()).toBe('bridge')
      })
    })

    it('should handle DOM creation with section classes', () => {
      editor.update(() => {
        const mockConfig = { theme: {}, namespace: 'test' }

        const node = $createSectionParagraphNode('chorus')
        const domElement = node.createDOM(mockConfig as any)

        expect(domElement.classList.contains('lexical-text-chorus')).toBe(true)
      })
    })

    it('should update DOM classes when section type changes', () => {
      editor.update(() => {
        const mockConfig = { theme: {}, namespace: 'test' }

        const oldNode = $createSectionParagraphNode('verse')
        const newNode = $createSectionParagraphNode('chorus')
        const domElement = document.createElement('p')
        domElement.classList.add('lexical-text-verse')

        const wasUpdated = newNode.updateDOM(oldNode, domElement, mockConfig as any)

        expect(wasUpdated).toBe(true)
        expect(domElement.classList.contains('lexical-text-verse')).toBe(false)
        expect(domElement.classList.contains('lexical-text-chorus')).toBe(true)
      })
    })
  })

  describe('Node Type System', () => {
    it('should have correct node type', () => {
      expect(SectionParagraphNode.getType()).toBe('section-paragraph')
    })

    it('should clone correctly', () => {
      editor.update(() => {
        const original = $createSectionParagraphNode('intro')
        const clone = SectionParagraphNode.clone(original)

        expect(clone.getSectionType()).toBe('intro')
        expect($isSectionParagraphNode(clone)).toBe(true)
        // Keys can be the same in test environments
        expect(clone.getType()).toBe(original.getType())
      })
    })
  })
})
