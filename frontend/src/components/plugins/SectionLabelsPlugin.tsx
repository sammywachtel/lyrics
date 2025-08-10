import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
  type ElementNode
} from 'lexical'
import { useEffect } from 'react'
import { $createSectionTagNode, $isSectionTagNode } from '../nodes/SectionTagNode'

// Command to insert a section tag
export const INSERT_SECTION_TAG_COMMAND: LexicalCommand<string> = createCommand('INSERT_SECTION_TAG_COMMAND')

export default function SectionLabelsPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register command to insert section tags
    const removeInsertSectionCommand = editor.registerCommand(
      INSERT_SECTION_TAG_COMMAND,
      (sectionName: string) => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const sectionNode = $createSectionTagNode(sectionName)
            const paragraph = $createParagraphNode()
            paragraph.append(sectionNode)
            selection.insertNodes([paragraph])
          }
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Register keyboard shortcut for creating sections
    const removeKeyboardCommand = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        // Check if user pressed Ctrl+Shift+Enter to create a new section
        if (event.ctrlKey && event.shiftKey) {
          event.preventDefault()

          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              // Create a default section (could open a modal for section name)
              const sectionNode = $createSectionTagNode('New Section')
              const paragraph = $createParagraphNode()
              paragraph.append(sectionNode)

              // Insert the section
              selection.insertNodes([paragraph])

              // Add an empty line after the section for content
              const contentParagraph = $createParagraphNode()
              contentParagraph.append($createTextNode(''))
              selection.insertNodes([contentParagraph])
            }
          })

          return true
        }

        return false
      },
      COMMAND_PRIORITY_EDITOR
    )

    // Auto-detect and convert section tags in plain text
    const removeTextTransform = editor.registerTextContentListener(() => {
      // Look for patterns like [Section Name] and convert them to section nodes
      // const sectionRegex = /^\[([^\]]+)\]$/gm
      // let match

      editor.update(() => {
        const root = $getRoot()
        const children = root.getChildren()

        children.forEach((child) => {
          if (child.getType() === 'paragraph') {
            const textContent = child.getTextContent()
            const sectionMatch = textContent.match(/^\[([^\]]+)\]$/)

            if (sectionMatch && !(child as ElementNode).getChildren().some((node: LexicalNode) => $isSectionTagNode(node))) {
              // Replace text with section tag node
              const sectionName = sectionMatch[1]
              const sectionNode = $createSectionTagNode(sectionName)

              if ('clear' in child && 'append' in child) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(child as any).clear()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(child as any).append(sectionNode)
              }
            }
          }
        })
      })
    })

    return () => {
      removeInsertSectionCommand()
      removeKeyboardCommand()
      removeTextTransform()
    }
  }, [editor])

  return null
}
