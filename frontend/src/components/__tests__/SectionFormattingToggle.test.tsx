import React, { useEffect } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode,
  $createRangeSelection,
  $setSelection,
  $isElementNode,
  $isTextNode,
  type LexicalEditor
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createTestLexicalConfig } from '../utils/testUtils'
import { SectionParagraphNode, $createSectionParagraphNode, $isSectionParagraphNode } from '../lexical/nodes/SectionParagraphNode'
import { $applySectionFormatting, $clearSectionFormatting, $getCurrentSectionType } from '../lexical/commands/SectionFormattingCommands'

// Test component that sets up proper Lexical context with history
function TestLexicalEditor({ onEditorReady }: { onEditorReady: (editor: LexicalEditor) => void }) {
  function EditorCapture() {
    const [editor] = useLexicalComposerContext()
    
    useEffect(() => {
      if (editor) {
        onEditorReady(editor)
      }
    }, [editor])
    
    return null
  }

  return (
    <div data-testid="test-lexical-editor">
      <LexicalComposer initialConfig={createTestLexicalConfig()}>
        <EditorCapture />
        <HistoryPlugin delay={100} />
        <div>Test Editor Ready</div>
      </LexicalComposer>
    </div>
  )
}

describe('Section Formatting Toggle and Clear', () => {
  describe('Toggle Behavior', () => {
    it('should toggle off verse formatting when clicking verse button on verse paragraph', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      // Wait for editor to be ready
      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up initial content with verse formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const sectionParagraph = $createSectionParagraphNode('verse')
          const textNode = $createTextNode('This is a verse line')
          sectionParagraph.append(textNode)
          root.append(sectionParagraph)
        })
      })
      
      // Step 2: Select the paragraph and verify it has verse formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const paragraph = root.getFirstChild()
          
          // Create selection that includes the paragraph
          const selection = $createRangeSelection()
          selection.anchor.set(paragraph.getKey(), 0, 'element')
          selection.focus.set(paragraph.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Verify it has verse formatting
          expect($isSectionParagraphNode(paragraph)).toBe(true)
          if ($isSectionParagraphNode(paragraph)) {
            expect(paragraph.getSectionType()).toBe('verse')
          }
          
          // Also verify using getCurrentSectionType
          expect($getCurrentSectionType()).toBe('verse')
        })
      })
      
      // Step 3: Apply verse formatting again (toggle off)
      await act(async () => {
        testEditor.update(() => {
          $applySectionFormatting('verse')
        })
      })
      
      // Step 4: Verify the formatting was removed
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const paragraph = root.getFirstChild()
        
        expect($isSectionParagraphNode(paragraph)).toBe(true)
        if ($isSectionParagraphNode(paragraph)) {
          expect(paragraph.getSectionType()).toBeNull()
        }
        
        // Also verify using getCurrentSectionType
        expect($getCurrentSectionType()).toBeNull()
      })
    })

    it('should toggle off chorus formatting when clicking chorus button on chorus paragraph', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up initial content with chorus formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const sectionParagraph = $createSectionParagraphNode('chorus')
          const textNode = $createTextNode('This is a chorus line')
          sectionParagraph.append(textNode)
          root.append(sectionParagraph)
        })
      })
      
      // Step 2: Select and toggle chorus formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const paragraph = root.getFirstChild()
          
          const selection = $createRangeSelection()
          selection.anchor.set(paragraph.getKey(), 0, 'element')
          selection.focus.set(paragraph.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Verify initial state
          expect($getCurrentSectionType()).toBe('chorus')
          
          // Toggle off
          $applySectionFormatting('chorus')
        })
      })
      
      // Step 3: Verify the formatting was removed
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const paragraph = root.getFirstChild()
        
        expect($isSectionParagraphNode(paragraph)).toBe(true)
        if ($isSectionParagraphNode(paragraph)) {
          expect(paragraph.getSectionType()).toBeNull()
        }
      })
    })

    it('should change section type when applying different section type', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up initial content with verse formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const sectionParagraph = $createSectionParagraphNode('verse')
          const textNode = $createTextNode('This was a verse')
          sectionParagraph.append(textNode)
          root.append(sectionParagraph)
        })
      })
      
      // Step 2: Select and apply different formatting (chorus)
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const paragraph = root.getFirstChild()
          
          const selection = $createRangeSelection()
          selection.anchor.set(paragraph.getKey(), 0, 'element')
          selection.focus.set(paragraph.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Verify initial state
          expect($getCurrentSectionType()).toBe('verse')
          
          // Apply chorus formatting (should change, not toggle)
          $applySectionFormatting('chorus')
        })
      })
      
      // Step 3: Verify the formatting was changed to chorus
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const paragraph = root.getFirstChild()
        
        expect($isSectionParagraphNode(paragraph)).toBe(true)
        if ($isSectionParagraphNode(paragraph)) {
          expect(paragraph.getSectionType()).toBe('chorus')
        }
      })
    })

    it('should handle toggle with multiple paragraphs having same section type', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up multiple paragraphs with same section type
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const para1 = $createSectionParagraphNode('verse')
          const text1 = $createTextNode('First verse line')
          para1.append(text1)
          root.append(para1)
          
          const para2 = $createSectionParagraphNode('verse')
          const text2 = $createTextNode('Second verse line')
          para2.append(text2)
          root.append(para2)
        })
      })
      
      // Step 2: Select both paragraphs and toggle formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const para1 = root.getFirstChild()
          const para2 = root.getLastChild()
          
          // Select both paragraphs
          const selection = $createRangeSelection()
          selection.anchor.set(para1.getKey(), 0, 'element')
          selection.focus.set(para2.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Verify both have verse formatting
          expect($getCurrentSectionType()).toBe('verse')
          
          // Toggle off
          $applySectionFormatting('verse')
        })
      })
      
      // Step 3: Verify both paragraphs have formatting removed
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const para1 = root.getFirstChild()
        const para2 = root.getLastChild()
        
        expect($isSectionParagraphNode(para1)).toBe(true)
        expect($isSectionParagraphNode(para2)).toBe(true)
        
        if ($isSectionParagraphNode(para1) && $isSectionParagraphNode(para2)) {
          expect(para1.getSectionType()).toBeNull()
          expect(para2.getSectionType()).toBeNull()
        }
      })
    })
  })

  describe('Clear Section Formatting', () => {
    it('should clear verse formatting using $clearSectionFormatting', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up content with verse formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const sectionParagraph = $createSectionParagraphNode('verse')
          const textNode = $createTextNode('This is a verse line')
          sectionParagraph.append(textNode)
          root.append(sectionParagraph)
        })
      })
      
      // Step 2: Select and clear formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const paragraph = root.getFirstChild()
          
          const selection = $createRangeSelection()
          selection.anchor.set(paragraph.getKey(), 0, 'element')
          selection.focus.set(paragraph.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Verify initial state
          expect($getCurrentSectionType()).toBe('verse')
          
          // Clear formatting
          $clearSectionFormatting()
        })
      })
      
      // Step 3: Verify formatting was cleared
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const paragraph = root.getFirstChild()
        
        expect($isSectionParagraphNode(paragraph)).toBe(true)
        if ($isSectionParagraphNode(paragraph)) {
          expect(paragraph.getSectionType()).toBeNull()
        }
      })
    })

    it('should clear any section type using $clearSectionFormatting', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Test clearing different section types
      const sectionTypes = ['verse', 'chorus', 'bridge', 'pre-chorus', 'intro', 'outro', 'hook']
      
      for (const sectionType of sectionTypes) {
        // Step 1: Set up content with this section type
        await act(async () => {
          testEditor.update(() => {
            const root = $getRoot()
            root.clear()
            
            const sectionParagraph = $createSectionParagraphNode(sectionType)
            const textNode = $createTextNode(`This is a ${sectionType} line`)
            sectionParagraph.append(textNode)
            root.append(sectionParagraph)
          })
        })
        
        // Step 2: Clear formatting
        await act(async () => {
          testEditor.update(() => {
            const root = $getRoot()
            const paragraph = root.getFirstChild()
            
            const selection = $createRangeSelection()
            selection.anchor.set(paragraph.getKey(), 0, 'element')
            selection.focus.set(paragraph.getKey(), 1, 'element')
            $setSelection(selection)
            
            // Verify initial state
            expect($getCurrentSectionType()).toBe(sectionType)
            
            // Clear formatting
            $clearSectionFormatting()
          })
        })
        
        // Step 3: Verify formatting was cleared
        testEditor.getEditorState().read(() => {
          const root = $getRoot()
          const paragraph = root.getFirstChild()
          
          expect($isSectionParagraphNode(paragraph)).toBe(true)
          if ($isSectionParagraphNode(paragraph)) {
            expect(paragraph.getSectionType()).toBeNull()
          }
        })
      }
    })

    it('should clear formatting from multiple paragraphs with different section types', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up multiple paragraphs with different section types
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const versePara = $createSectionParagraphNode('verse')
          const verseText = $createTextNode('This is a verse')
          versePara.append(verseText)
          root.append(versePara)
          
          const chorusPara = $createSectionParagraphNode('chorus')
          const chorusText = $createTextNode('This is a chorus')
          chorusPara.append(chorusText)
          root.append(chorusPara)
          
          const bridgePara = $createSectionParagraphNode('bridge')
          const bridgeText = $createTextNode('This is a bridge')
          bridgePara.append(bridgeText)
          root.append(bridgePara)
        })
      })
      
      // Step 2: Select all paragraphs and clear formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const para1 = root.getFirstChild()
          const para3 = root.getLastChild()
          
          // Select all paragraphs
          const selection = $createRangeSelection()
          selection.anchor.set(para1.getKey(), 0, 'element')
          selection.focus.set(para3.getKey(), 1, 'element')
          $setSelection(selection)
          
          // When multiple different section types are selected, getCurrentSectionType should return null
          expect($getCurrentSectionType()).toBeNull()
          
          // Clear formatting
          $clearSectionFormatting()
        })
      })
      
      // Step 3: Verify all paragraphs have formatting cleared
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const children = root.getChildren()
        
        expect(children).toHaveLength(3)
        
        children.forEach(paragraph => {
          expect($isSectionParagraphNode(paragraph)).toBe(true)
          if ($isSectionParagraphNode(paragraph)) {
            expect(paragraph.getSectionType()).toBeNull()
          }
        })
      })
    })
  })

  describe('Mixed Selection Scenarios', () => {
    it('should handle mixed selection with formatted and unformatted paragraphs', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up mixed content (formatted and regular paragraphs)
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          // Regular paragraph
          const regularPara = $createParagraphNode()
          const regularText = $createTextNode('Regular paragraph')
          regularPara.append(regularText)
          root.append(regularPara)
          
          // Section paragraph with formatting
          const sectionPara = $createSectionParagraphNode('verse')
          const sectionText = $createTextNode('Verse paragraph')
          sectionPara.append(sectionText)
          root.append(sectionPara)
        })
      })
      
      // Step 2: Select both and apply formatting
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const para1 = root.getFirstChild()
          const para2 = root.getLastChild()
          
          // Select both paragraphs
          const selection = $createRangeSelection()
          selection.anchor.set(para1.getKey(), 0, 'element')
          selection.focus.set(para2.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Current section type should be null due to mixed selection
          expect($getCurrentSectionType()).toBeNull()
          
          // Apply chorus formatting to both
          $applySectionFormatting('chorus')
        })
      })
      
      // Step 3: Verify both paragraphs now have chorus formatting
      testEditor.getEditorState().read(() => {
        const root = $getRoot()
        const para1 = root.getFirstChild()
        const para2 = root.getLastChild()
        
        // First paragraph should have been converted to section paragraph
        expect($isSectionParagraphNode(para1)).toBe(true)
        if ($isSectionParagraphNode(para1)) {
          expect(para1.getSectionType()).toBe('chorus')
        }
        
        // Second paragraph should have changed from verse to chorus
        expect($isSectionParagraphNode(para2)).toBe(true)
        if ($isSectionParagraphNode(para2)) {
          expect(para2.getSectionType()).toBe('chorus')
        }
      })
    })

    it('should detect when all selected paragraphs have the same section type', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up multiple paragraphs with same section type
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const para1 = $createSectionParagraphNode('chorus')
          const text1 = $createTextNode('First chorus line')
          para1.append(text1)
          root.append(para1)
          
          const para2 = $createSectionParagraphNode('chorus')
          const text2 = $createTextNode('Second chorus line')
          para2.append(text2)
          root.append(para2)
          
          const para3 = $createSectionParagraphNode('chorus')
          const text3 = $createTextNode('Third chorus line')
          para3.append(text3)
          root.append(para3)
        })
      })
      
      // Step 2: Select all and verify current section type detection
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const para1 = root.getFirstChild()
          const para3 = root.getLastChild()
          
          // Select all paragraphs
          const selection = $createRangeSelection()
          selection.anchor.set(para1.getKey(), 0, 'element')
          selection.focus.set(para3.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Should detect chorus as current section type
          expect($getCurrentSectionType()).toBe('chorus')
        })
      })
    })

    it('should return null for mixed section types in selection', async () => {
      let testEditor: LexicalEditor | null = null
      
      render(
        <TestLexicalEditor 
          onEditorReady={(editor) => {
            testEditor = editor
          }} 
        />
      )

      await waitFor(() => {
        expect(testEditor).toBeTruthy()
      })
      
      if (!testEditor) return

      // Step 1: Set up paragraphs with different section types
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const versePara = $createSectionParagraphNode('verse')
          const verseText = $createTextNode('This is a verse')
          versePara.append(verseText)
          root.append(versePara)
          
          const chorusPara = $createSectionParagraphNode('chorus')
          const chorusText = $createTextNode('This is a chorus')
          chorusPara.append(chorusText)
          root.append(chorusPara)
        })
      })
      
      // Step 2: Select both and verify mixed type detection
      await act(async () => {
        testEditor.update(() => {
          const root = $getRoot()
          const para1 = root.getFirstChild()
          const para2 = root.getLastChild()
          
          // Select both paragraphs
          const selection = $createRangeSelection()
          selection.anchor.set(para1.getKey(), 0, 'element')
          selection.focus.set(para2.getKey(), 1, 'element')
          $setSelection(selection)
          
          // Should return null for mixed selection
          expect($getCurrentSectionType()).toBeNull()
        })
      })
    })
  })
})