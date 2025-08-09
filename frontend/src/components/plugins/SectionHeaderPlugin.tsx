import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createParagraphNode,
  type LexicalNode
} from 'lexical'
import { useEffect } from 'react'
import { $createSectionTagNode, $isSectionTagNode } from '../nodes/SectionTagNode'
import { $isSectionParagraphNode, type SectionParagraphNode } from '../lexical/nodes/SectionParagraphNode'

/**
 * Plugin that automatically creates visual section headers above section-formatted content
 * in Rich Text mode. This ensures users can clearly see which section they're editing.
 */
export default function SectionHeaderPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Track section counts for numbering
    const sectionCounts = new Map<string, number>()

    // Function to get display name for section type with automatic numbering
    const getSectionDisplayName = (sectionType: string | null): string => {
      if (!sectionType) return 'Section'

      const sectionMap: { [key: string]: string } = {
        'verse': 'VERSE',
        'chorus': 'CHORUS',
        'pre-chorus': 'PRE-CHORUS',
        'bridge': 'BRIDGE',
        'intro': 'INTRO',
        'outro': 'OUTRO',
        'hook': 'HOOK'
      }

      const baseName = sectionMap[sectionType] || sectionType.toUpperCase()

      // Increment count for this section type
      const currentCount = (sectionCounts.get(sectionType) || 0) + 1
      sectionCounts.set(sectionType, currentCount)

      // Add numbering for verses and other repeatable sections
      if (['verse', 'chorus', 'bridge', 'hook'].includes(sectionType)) {
        return `${baseName} ${currentCount}`
      }

      return baseName
    }

    // Function to update section headers based on current content
    const updateSectionHeaders = () => {
      editor.update(() => {
        const root = $getRoot()
        const children = root.getChildren()
        const nodesToRemove: LexicalNode[] = []
        const sectionsToAdd: Array<{ index: number; sectionType: string; displayName: string }> = []

        // Reset section counts for this update
        sectionCounts.clear()
        let currentSectionType: string | null = null

        // First pass: identify existing headers and collect all sections
        for (let i = 0; i < children.length; i++) {
          const child = children[i]

          // Track existing section tag nodes for removal
          if ($isSectionTagNode(child)) {
            nodesToRemove.push(child)
            continue
          }

          // Check if this is a section paragraph
          if ($isSectionParagraphNode(child)) {
            const sectionParagraph = child as SectionParagraphNode
            const paragraphSectionType = sectionParagraph.getSectionType()

            if (paragraphSectionType && isValidSectionType(paragraphSectionType)) {
              // If this is the start of a new section block
              if (paragraphSectionType !== currentSectionType) {
                currentSectionType = paragraphSectionType
                const displayName = getSectionDisplayName(paragraphSectionType)
                sectionsToAdd.push({
                  index: i,
                  sectionType: paragraphSectionType,
                  displayName
                })
              }
            } else {
              currentSectionType = null
            }
          } else {
            // Non-section paragraph, reset current section
            currentSectionType = null
          }
        }

        // Remove existing section headers
        nodesToRemove.forEach(node => {
          node.remove()
        })

        // Add new section headers in reverse order to maintain indices
        sectionsToAdd.reverse().forEach(({ index, displayName }) => {
          const sectionTagNode = $createSectionTagNode(displayName)
          const sectionTagParagraph = $createParagraphNode()
          sectionTagParagraph.append(sectionTagNode)

          const targetChild = root.getChildAtIndex(index)
          if (targetChild) {
            targetChild.insertBefore(sectionTagParagraph)
          }
        })
      })
    }

    // Listen for editor state changes that might affect sections
    const removeUpdateListener = editor.registerUpdateListener(() => {
      // Use a small delay to ensure all DOM updates are complete
      setTimeout(updateSectionHeaders, 50)
    })

    // Initial setup
    setTimeout(updateSectionHeaders, 100)

    return () => {
      removeUpdateListener()
    }
  }, [editor])

  return null
}

/**
 * Helper function to determine if a node should trigger section header creation
 */
function isValidSectionType(sectionType: string | null): boolean {
  if (!sectionType) return false
  const validTypes = ['verse', 'chorus', 'pre-chorus', 'bridge', 'intro', 'outro', 'hook']
  return validTypes.includes(sectionType)
}
