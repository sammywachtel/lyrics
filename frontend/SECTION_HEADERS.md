# Visual Section Headers Implementation

## Overview

The visual section headers feature automatically creates prominent header labels above section-formatted content in Rich Text mode. This solves Task #98 by ensuring users can immediately see which section they're editing without relying solely on colored paragraph backgrounds.

## Implementation Details

### Core Components

1. **SectionHeaderPlugin** (`src/components/plugins/SectionHeaderPlugin.tsx`)
   - Monitors section paragraph formatting changes
   - Automatically creates/updates SectionTagNode headers
   - Handles section numbering (VERSE 1, VERSE 2, etc.)
   - Removes outdated headers when content changes

2. **SectionTagNode** (`src/components/nodes/SectionTagNode.tsx`)
   - Custom Lexical decorator node for visual section headers  
   - Renders styled badge with section name and icon
   - Supports inline editing of section names
   - Provides delete functionality

3. **Enhanced CSS** (`src/index.css`)
   - Section-specific color schemes matching paragraph formatting
   - Compact header design that doesn't interfere with text flow
   - Mobile-responsive styling
   - Hover effects and visual polish

### How It Works

1. **Automatic Detection**: Plugin listens for editor changes and scans for SectionParagraphNode instances
2. **Header Creation**: When a new section block is detected, creates a SectionTagNode header above it  
3. **Smart Numbering**: Automatically numbers repeatable sections (VERSE 1, VERSE 2, CHORUS 1, etc.)
4. **Cleanup**: Removes old headers when section formatting changes
5. **Visual Design**: Headers use the same color scheme as their corresponding section paragraphs

### Visual Design System

Each section type has a distinctive appearance:

- **VERSE**: Blue gradient background with 📝 icon
- **CHORUS**: Purple gradient background with 🎵 icon  
- **PRE-CHORUS**: Warm yellow gradient with ✨ icon
- **BRIDGE**: Green gradient background with 🌉 icon
- **INTRO/OUTRO**: Neutral gray gradient with 🎧/🎼 icons
- **HOOK**: Pink gradient background with 🎣 icon

### Integration

The feature is integrated into:
- `RichTextLyricsEditor.tsx` - Plugin registration and SectionTagNode in nodes array
- Section formatting toolbar - Existing buttons now create both paragraph formatting AND headers
- CSS styling - Coordinated color schemes between headers and paragraph backgrounds

## Benefits

### User Experience
- **Immediate Visual Clarity**: Users instantly see which section they're editing
- **Professional Appearance**: Headers look like those in professional songwriting software
- **Contextual Information**: Section numbering helps with song structure organization
- **Mobile Friendly**: Compact design works well on all screen sizes

### Technical Benefits  
- **Automatic Management**: Headers appear/disappear automatically, no manual intervention
- **Consistent Styling**: Uses the existing design system colors and patterns
- **Accessible**: Proper ARIA labels and semantic markup
- **Performance**: Efficient update mechanism that only changes what's needed

## Usage

### For Users
1. Apply section formatting using the toolbar buttons (Verse, Chorus, etc.)
2. Visual headers automatically appear above the formatted content
3. Click on header badges to edit section names
4. Headers show/hide automatically as you add/remove section formatting

### For Developers
```tsx
// Plugin is automatically included in RichTextLyricsEditor
import SectionHeaderPlugin from './plugins/SectionHeaderPlugin'

// Headers use existing SectionTagNode component
import { SectionTagNode } from './nodes/SectionTagNode'

// CSS classes follow consistent naming
.section-tag-node[data-section*="VERSE"] .section-tag-label {
  background: linear-gradient(135deg, var(--color-primary-100), var(--color-primary-50));
  // ...
}
```

## Testing

- Unit tests verify section type validation and plugin registration
- Integration tests ensure headers appear when section formatting is applied  
- Visual regression tests confirm styling consistency
- Accessibility tests validate ARIA labels and keyboard navigation

## Future Enhancements

1. **Drag & Drop**: Allow reordering sections by dragging headers
2. **Section Templates**: Quick insertion of common song structures
3. **Collapse/Expand**: Hide section content while keeping headers visible
4. **Section Statistics**: Show line count, syllable count in headers
5. **Custom Icons**: User-configurable icons for different section types

## Files Modified

- ✅ `src/components/plugins/SectionHeaderPlugin.tsx` - New plugin implementation
- ✅ `src/components/RichTextLyricsEditor.tsx` - Plugin integration  
- ✅ `src/components/nodes/SectionTagNode.tsx` - Enhanced header component
- ✅ `src/index.css` - New section header styling
- ✅ `src/components/__tests__/SectionHeaderPlugin.test.tsx` - Test coverage

## Conclusion

This implementation provides a clean, automatic solution to the section header visibility problem. Users now get immediate visual feedback about which section they're editing, while the technical implementation remains efficient and maintainable. The feature seamlessly integrates with the existing rich text editor and follows the established design patterns.