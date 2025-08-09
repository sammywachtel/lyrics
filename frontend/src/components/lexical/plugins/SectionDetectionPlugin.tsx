import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  ParagraphNode,
} from 'lexical'
import { $createSectionNode, SectionNode } from '../nodes/SectionNode'
import { SECTION_TAG_REGEX, getSectionType } from '../../../utils/sectionUtils'

export function SectionDetectionPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const children = root.getChildren()
        for (let i = 0; i < children.length; i++) {
          const child = children[i]

          if (child instanceof ParagraphNode) {
            const textContent = child.getTextContent().trim()

            // Check if this paragraph matches a section tag pattern
            const match = textContent.match(SECTION_TAG_REGEX)

            if (match) {
              const sectionName = match[1]
              const sectionType = getSectionType(sectionName) || 'Section'

              // Check if this is already a section node
              const nextSibling = child.getNextSibling()
              if (!(nextSibling instanceof SectionNode)) {
                // Replace the text paragraph with a section node
                editor.update(() => {
                  const sectionNode = $createSectionNode(sectionName, sectionType)
                  child.replace(sectionNode)
                })
                break // Exit loop and let the next update cycle handle more changes
              }
            } else {
              // Check if there's a section node that should be converted back to text
              // This handles cases where section tags are edited to no longer match the pattern
              const prevSibling = child.getPreviousSibling()
              if (prevSibling instanceof SectionNode) {
                const sectionText = `[${prevSibling.getSectionName()}]`
                if (textContent !== sectionText && !textContent.match(SECTION_TAG_REGEX)) {
                  // The user has edited the section, convert it back to a text paragraph
                  // Only if the current text doesn't look like a section tag
                  continue
                }
              }
            }
          }
        }
      })
    })

    return removeUpdateListener
  }, [editor])

  return null
}
