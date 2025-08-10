import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  type LexicalCommand,
  type LexicalNode
} from 'lexical'
import {
  $isSectionParagraphNode,
  $convertToSectionParagraph,
  SectionParagraphNode
} from '../nodes/SectionParagraphNode'

// Custom commands for section formatting
export const SECTION_FORMAT_COMMAND: LexicalCommand<string | null> = createCommand('SECTION_FORMAT_COMMAND')

// Helper function to get all paragraph nodes that intersect with the selection
function $getSelectedParagraphs() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return []
  }

  const paragraphs: Array<SectionParagraphNode | LexicalNode> = []
  const seen = new Set<string>()

  // Handle collapsed selections (cursor position only) differently from range selections
  if (selection.isCollapsed()) {
    // For cursor position, get the paragraph containing the anchor node
    const anchorNode = selection.anchor.getNode()
    let currentNode: LexicalNode | null = anchorNode

    // Find the paragraph that contains the cursor
    while (currentNode && currentNode.getType() !== 'section-paragraph' && currentNode.getType() !== 'paragraph') {
      currentNode = currentNode.getParent()
    }

    if (currentNode) {
      paragraphs.push(currentNode)
    }
  } else {
    // For text selections, use the existing logic to collect all intersected paragraphs
    const nodes = selection.getNodes()

    // Collect all paragraph nodes (including ancestors)
    nodes.forEach(node => {
      // Get the paragraph that contains this node
      let currentNode: LexicalNode | null = node
      while (currentNode && currentNode.getType() !== 'section-paragraph' && currentNode.getType() !== 'paragraph') {
        currentNode = currentNode.getParent()
      }

      if (currentNode && !seen.has(currentNode.getKey())) {
        seen.add(currentNode.getKey())

        // Just collect the paragraphs, don't convert them yet
        // Conversion will happen in $applySectionFormatting
        paragraphs.push(currentNode)
      }
    })
  }

  return paragraphs
}

// Helper function to apply section formatting to selected paragraphs
export function $applySectionFormatting(sectionType: string | null) {
  const selectedParagraphs = $getSelectedParagraphs()

  if (selectedParagraphs.length === 0) {
    return
  }

  selectedParagraphs.forEach(paragraph => {
    // Convert regular paragraph to section paragraph if needed
    if (paragraph.getType() === 'paragraph') {
      const sectionParagraph = $convertToSectionParagraph(paragraph, sectionType)
      paragraph.replace(sectionParagraph)
    } else if ($isSectionParagraphNode(paragraph)) {
      // If this paragraph already has this section type, remove it (toggle behavior)
      if (paragraph.getSectionType() === sectionType) {
        paragraph.setSectionType(null)
      } else {
        // Otherwise, set the new section type
        paragraph.setSectionType(sectionType)
      }
    }
  })
}

// Helper function to get the current section type of the selection
export function $getCurrentSectionType(): string | null {
  const selectedParagraphs = $getSelectedParagraphs()

  if (selectedParagraphs.length === 0) {
    return null
  }

  // Check if all selected paragraphs have the same section type
  const firstParagraph = selectedParagraphs[0]
  const firstSectionType = $isSectionParagraphNode(firstParagraph) ? firstParagraph.getSectionType() : null

  const allSameType = selectedParagraphs.every(p => {
    const sectionType = $isSectionParagraphNode(p) ? p.getSectionType() : null
    return sectionType === firstSectionType
  })

  return allSameType ? firstSectionType : null
}

// Helper functions for specific section types
export function $formatAsVerse() {
  $applySectionFormatting('verse')
}

export function $formatAsChorus() {
  $applySectionFormatting('chorus')
}

export function $formatAsPreChorus() {
  $applySectionFormatting('pre-chorus')
}

export function $formatAsBridge() {
  $applySectionFormatting('bridge')
}

export function $formatAsIntro() {
  $applySectionFormatting('intro')
}

export function $formatAsOutro() {
  $applySectionFormatting('outro')
}

export function $formatAsHook() {
  $applySectionFormatting('hook')
}

export function $clearSectionFormatting() {
  $applySectionFormatting(null)
}
