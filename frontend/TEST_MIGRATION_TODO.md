# Test Migration TODO for Lexical Editor

## Background
The lyrics editor has been migrated from a simple `<textarea>` element to a rich text editor using Lexical.js. This fundamental change means several test suites that were written for textarea behavior are no longer valid and need to be rewritten.

## Tests That Need Migration

### 1. NewlinePreservation.test.tsx
**Current Issue**: Tests expect `HTMLTextAreaElement` with `.value` property
**What Needs to Change**:
- Tests need to work with Lexical's content model instead of textarea.value
- Need to use Lexical testing utilities to get/set editor content
- Must interact with Lexical's `$getRoot()` and node tree structure
- Consider using `@lexical/testing` utilities

**Key Test Cases to Preserve**:
- Verify exact newline formatting is preserved when loading from backend
- Ensure newlines in text statistics are counted correctly
- Handle edge cases with multiple newlines

### 2. RichTextLyricsEditor.test.tsx
**Current Issue**: All Lexical components are mocked, preventing real integration testing
**What Needs to Change**:
- Either use real Lexical components with proper test setup
- Or update mocks to properly simulate Lexical behavior
- Add tests for rich text formatting features (bold, italic, etc.)
- Test section tagging functionality
- Test stress analysis plugin integration

**Key Test Cases to Add**:
- Rich text formatting toolbar interactions
- Section paragraph node creation and editing
- Stress mark decorator functionality
- Plugin initialization and lifecycle

## Migration Strategy

### Option 1: Use Lexical Testing Utilities
```typescript
import { $getRoot, $createParagraphNode } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';

// Create test editor instance
const editor = createHeadlessEditor(config);

// Set content
editor.update(() => {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode('Test content'));
  root.append(paragraph);
});

// Read content
editor.getEditorState().read(() => {
  const text = $getRoot().getTextContent();
  expect(text).toBe('Test content');
});
```

### Option 2: Integration Testing with React Testing Library
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Render the actual RichTextLyricsEditor
const { container } = render(<RichTextLyricsEditor />);

// Interact with contentEditable
const editor = container.querySelector('[contenteditable="true"]');
await userEvent.type(editor, 'Test content');
```

## Temporary Test Removal

The following test files have been temporarily removed/disabled until proper Lexical testing can be implemented:
- `NewlinePreservation.test.tsx` - All 3 tests removed
- `RichTextLyricsEditor.test.tsx` - All 8 tests removed

## Priority for Re-implementation

1. **High Priority**:
   - Basic content input/output tests
   - Section tag preservation
   - Newline handling

2. **Medium Priority**:
   - Rich text formatting
   - Toolbar interactions
   - Plugin lifecycle

3. **Low Priority**:
   - Advanced stress analysis features
   - Performance tests
   - Edge cases

## Resources

- [Lexical Testing Guide](https://lexical.dev/docs/testing)
- [Lexical Headless Editor](https://lexical.dev/docs/headless)
- [@lexical/testing Package](https://www.npmjs.com/package/@lexical/testing)
- [React Testing Library with contentEditable](https://testing-library.com/docs/react-testing-library/example-intro)

## Timeline

These tests should be re-implemented after the current stress analysis feature is complete, as part of a dedicated testing improvement sprint.
