# Lexical Framework Linting Guidelines

This document provides guidelines for detecting Lexical anti-patterns during development. While not all Lexical anti-patterns can be caught by traditional linting, these rules help catch the most common and dangerous patterns.

## ESLint Rules for Lexical

### 1. **Forbidden Direct DOM Manipulation**

Add these patterns to your ESLint configuration to catch dangerous DOM manipulation:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='classList'][callee.object.type='Identifier']",
        "message": "❌ LEXICAL ANTI-PATTERN: Direct classList manipulation breaks Lexical reconciliation. Use data attributes and CSS instead."
      },
      {
        "selector": "CallExpression[callee.property.name='scrollIntoView']",
        "message": "❌ LEXICAL ANTI-PATTERN: Direct scrollIntoView breaks Lexical selection management. Use Lexical selection APIs instead."
      },
      {
        "selector": "AssignmentExpression[left.property.name='innerHTML']",
        "message": "❌ LEXICAL ANTI-PATTERN: Direct innerHTML modification breaks Lexical node management. Use Lexical node APIs instead."
      },
      {
        "selector": "AssignmentExpression[left.object.property.name='style']",
        "message": "❌ LEXICAL ANTI-PATTERN: Direct style manipulation breaks Lexical's CSS management. Use CSS classes with data attributes instead."
      }
    ]
  }
}
```

### 2. **Forbidden Private API Access**

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "MemberExpression[property.name='_nodeMap']",
        "message": "❌ LEXICAL ANTI-PATTERN: Accessing _nodeMap private API. Use editor.getEditorState().read(() => $getNodeByKey(key)) instead."
      },
      {
        "selector": "MemberExpression[property.name='_parentKey']",
        "message": "❌ LEXICAL ANTI-PATTERN: Accessing _parentKey private API. Use node.getParent() instead."
      },
      {
        "selector": "MemberExpression[property.name=/^_/]",
        "message": "❌ LEXICAL ANTI-PATTERN: Accessing private API (underscore prefix). Use public Lexical APIs only."
      }
    ]
  }
}
```

### 3. **Required Lexical Patterns**

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='update']:not([arguments.1.type='ObjectExpression'])",
        "message": "⚠️ LEXICAL BEST PRACTICE: Always provide tags for editor.update() calls: editor.update(() => {}, { tag: 'descriptive-tag' })"
      }
    ]
  }
}
```

## TypeScript Rules for Lexical

### 1. **Type Safety Requirements**

Add these TypeScript-specific rules:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": [
      "error",
      {
        "ignoreRestArgs": false
      }
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ]
  }
}
```

### 2. **Required Type Guards**

Custom rule to encourage proper type checking:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name=/get.*Content/]:not(IfStatement MemberExpression)",
        "message": "⚠️ LEXICAL BEST PRACTICE: Always use type guards before calling node methods. Use $isTextNode(node) or similar checks."
      }
    ]
  }
}
```

## Custom ESLint Plugin for Lexical

For advanced checking, consider creating a custom ESLint plugin:

```javascript
// eslint-plugin-lexical-framework.js
module.exports = {
  rules: {
    'no-nested-editor-updates': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow nested editor.update() calls that create race conditions'
        },
        messages: {
          nestedUpdate: '❌ LEXICAL ANTI-PATTERN: Nested editor.update() calls create race conditions. Combine operations in single update.'
        }
      },
      create(context) {
        let updateCallDepth = 0

        return {
          'CallExpression[callee.property.name="update"]'(node) {
            if (isEditorUpdateCall(node)) {
              updateCallDepth++
              if (updateCallDepth > 1) {
                context.report({
                  node,
                  messageId: 'nestedUpdate'
                })
              }
            }
          },
          'CallExpression[callee.property.name="update"]:exit'(node) {
            if (isEditorUpdateCall(node)) {
              updateCallDepth--
            }
          }
        }
      }
    },

    'require-lexical-type-guards': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require type guards before accessing Lexical node methods'
        }
      },
      create(context) {
        return {
          'CallExpression[callee.property.name=/^(getText|getChildren|getParent)/]'(node) {
            // Check if there's a type guard in the current scope
            if (!hasTypeGuardInScope(node)) {
              context.report({
                node,
                message: '⚠️ Use type guards like $isTextNode(node) before accessing node methods'
              })
            }
          }
        }
      }
    }
  }
}

function isEditorUpdateCall(node) {
  return node.callee.type === 'MemberExpression' &&
         node.callee.property.name === 'update' &&
         node.callee.object.name === 'editor'
}

function hasTypeGuardInScope(node) {
  // Implementation to check for type guards in current scope
  // This would need more sophisticated scope analysis
  return false
}
```

## Pre-commit Hooks for Lexical

Add these checks to your pre-commit hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lexical-pattern-check
        name: Check for Lexical anti-patterns
        entry: bash -c 'grep -r "classList\|scrollIntoView\|_nodeMap" frontend/src/ && echo "❌ Found Lexical anti-patterns!" && exit 1 || exit 0'
        language: system
        files: ^frontend/.*\.(ts|tsx)$

      - id: lexical-tag-check
        name: Check for editor.update() tags
        entry: bash -c 'grep -r "editor\.update(" frontend/src/ | grep -v "tag:" && echo "⚠️ Found editor.update() calls without tags!" && exit 1 || exit 0'
        language: system
        files: ^frontend/.*\.(ts|tsx)$
```

## Manual Code Review Checklist

For code reviews, check these patterns manually:

### ✅ **Required Checks**

- [ ] All `editor.update()` calls have descriptive tags
- [ ] No direct DOM manipulation (classList, innerHTML, style)
- [ ] No private API access (underscore properties)
- [ ] Type guards used before node method calls
- [ ] Proper cleanup in useEffect returns
- [ ] Error handling around node operations

### ❌ **Anti-pattern Detection**

- [ ] Nested `editor.update()` calls or race conditions
- [ ] Global state outside Lexical's system
- [ ] Missing `$applyNodeReplacement()` in node creation
- [ ] Direct event listeners on editor DOM
- [ ] Synchronous operations in async contexts

### 🔍 **Performance Checks**

- [ ] Debounced/throttled user interactions
- [ ] Batched DOM measurements
- [ ] Memoized expensive calculations
- [ ] Proper dependency arrays in useEffect

## IDE Integration

### VS Code Settings

Add these to your workspace settings for better Lexical development:

```json
{
  "eslint.validate": [
    "javascript",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.lexical.ts": "typescript",
    "*.lexical.tsx": "typescriptreact"
  }
}
```

### Code Snippets

Add these VS Code snippets for Lexical patterns:

```json
{
  "Lexical Read Operation": {
    "prefix": "lexical-read",
    "body": [
      "editor.getEditorState().read(() => {",
      "  const root = $getRoot()",
      "  const selection = $getSelection()",
      "  $1",
      "})"
    ],
    "description": "Safe Lexical read operation"
  },

  "Lexical Update Operation": {
    "prefix": "lexical-update",
    "body": [
      "editor.update(() => {",
      "  $1",
      "}, { tag: '$2' })"
    ],
    "description": "Safe Lexical update operation with tag"
  },

  "Lexical Type Guard": {
    "prefix": "lexical-guard",
    "body": [
      "if ($is${1:Text}Node(node)) {",
      "  $2",
      "}"
    ],
    "description": "Lexical type guard pattern"
  }
}
```

## Summary

While traditional linting can't catch all Lexical anti-patterns, these guidelines provide a foundation for detecting the most dangerous patterns. The most critical issues (DOM manipulation, private API access, race conditions) can be caught with proper ESLint configuration.

For comprehensive protection, combine:
1. ESLint rules for syntax-level detection
2. TypeScript for type safety
3. Pre-commit hooks for pattern detection
4. Manual code review checklists
5. Developer education through the CLAUDE.md guide

Remember: **The Lexical anti-patterns guide in CLAUDE.md is the primary defense**. These linting tools are supplementary safety nets.
