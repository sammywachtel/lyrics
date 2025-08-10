import { createEditor } from 'lexical'
import { StressMarkDecoratorNode, $createStressMarkDecoratorNode, $isStressMarkDecoratorNode } from '../StressMarkDecoratorNode'
import { type StressPattern } from '../StressedTextNode'

// Type for component props to avoid any types
type StressMarkProps = {
  word: string
  pattern: StressPattern
  className?: string
}

describe('StressMarkDecoratorNode', () => {
  let editor: ReturnType<typeof createEditor>

  beforeEach(() => {
    editor = createEditor({
      nodes: [StressMarkDecoratorNode],
      onError: (error) => console.error(error),
    })
  })
  const mockPattern: StressPattern = {
    syllables: [
      {
        text: 'walk',
        stressed: true,
        confidence: 0.9,
        position: 0,
        overridden: false,
      },
      {
        text: 'ing',
        stressed: false,
        confidence: 0.8,
        position: 1,
        overridden: false,
      },
    ],
    overridden: false,
  }

  describe('$createStressMarkDecoratorNode', () => {
    it('should create a new StressMarkDecoratorNode', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)

        expect($isStressMarkDecoratorNode(node)).toBe(true)
        expect(node.getWord()).toBe('walking')
        expect(node.getPattern()).toEqual(mockPattern)
      })
    })

    it('should create node with custom className', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'custom-class')

        expect(node.getClassName()).toBe('custom-class')
      })
    })
  })

  describe('StressMarkDecoratorNode methods', () => {
    it('should return correct type', () => {
      expect(StressMarkDecoratorNode.getType()).toBe('stress-mark-decorator')
    })

    it('should get word correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        expect(node.getWord()).toBe('walking')
      })
    })

    it('should get pattern correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        expect(node.getPattern()).toEqual(mockPattern)
      })
    })

    it('should be inline node', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        expect(node.isInline()).toBe(true)
      })
    })

    it('should not be keyboard selectable', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        expect(node.isKeyboardSelectable()).toBe(false)
      })
    })

    it('should set word correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        const newNode = node.setWord('running')
        expect(newNode.getWord()).toBe('running')
      })
    })

    it('should set pattern correctly', () => {
      editor.update(() => {
        const newPattern: StressPattern = {
          syllables: [
            {
              text: 'run',
              stressed: true,
              confidence: 0.95,
              position: 0,
              overridden: true,
            },
          ],
          overridden: true,
        }

        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        const newNode = node.setPattern(newPattern)
        expect(newNode.getPattern()).toEqual(newPattern)
      })
    })

    it('should set className correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        const newNode = node.setClassName('new-class')
        expect(newNode.getClassName()).toBe('new-class')
      })
    })
  })

  describe('serialization', () => {
    it('should export JSON correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'test-class')
        const json = node.exportJSON()

        expect(json).toEqual({
          word: 'walking',
          pattern: mockPattern,
          className: 'test-class',
          type: 'stress-mark-decorator',
          version: 1,
        })
      })
    })

    it('should import JSON correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'test-class')
        const json = node.exportJSON()
        const importedNode = StressMarkDecoratorNode.importJSON(json)

        expect(importedNode.getWord()).toBe('walking')
        expect(importedNode.getPattern()).toEqual(mockPattern)
        expect(importedNode.getClassName()).toBe('test-class')
      })
    })

    it('should clone correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'test-class')
        const clonedNode = StressMarkDecoratorNode.clone(node)

        expect(clonedNode.getWord()).toBe(node.getWord())
        expect(clonedNode.getPattern()).toEqual(node.getPattern())
        expect(clonedNode.getClassName()).toBe(node.getClassName())
        expect(clonedNode.getKey()).toBe(node.getKey())
      })
    })
  })

  describe('React component rendering', () => {
    it('should render stress marks component', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'test-class')
        const component = node.decorate()

        expect(component).toBeDefined()
        const props = (component as { props: StressMarkProps }).props
        expect(props.word).toBe('walking')
        expect(props.pattern).toEqual(mockPattern)
        expect(props.className).toBe('test-class')
      })
    })
  })

  describe('DOM export', () => {
    it('should export DOM correctly', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        const domOutput = node.exportDOM()

        const element = domOutput.element as HTMLElement
        expect(element.tagName).toBe('SPAN')
        expect(element.className).toBe('stress-decorated-word')
        expect(element.getAttribute('data-word')).toBe('walking')
        expect(element.getAttribute('data-pattern')).toBe(JSON.stringify(mockPattern))
      })
    })

    it('should export DOM with custom className', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern, 'custom-class')
        const domOutput = node.exportDOM()

        const element = domOutput.element as HTMLElement
        expect(element.className).toBe('stress-decorated-word custom-class')
      })
    })

    it('should create syllable elements in DOM export', () => {
      editor.update(() => {
        const node = $createStressMarkDecoratorNode('walking', mockPattern)
        const domOutput = node.exportDOM()

        const element = domOutput.element as HTMLElement
        const syllableElements = element.querySelectorAll('.syllable')
        expect(syllableElements).toHaveLength(2)

        expect(syllableElements[0].textContent).toBe('walk')
        expect(syllableElements[0].classList.contains('stressed')).toBe(true)
        expect(syllableElements[0].classList.contains('auto-detected')).toBe(true)

        expect(syllableElements[1].textContent).toBe('ing')
        expect(syllableElements[1].classList.contains('unstressed')).toBe(true)
        expect(syllableElements[1].classList.contains('auto-detected')).toBe(true)
      })
    })
  })
})
