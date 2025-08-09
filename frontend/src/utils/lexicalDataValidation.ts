/**
 * Lexical Data Validation and Migration Utilities
 * Prevents corruption of Lexical JSON data and provides safe fallbacks
 */


export interface ValidationResult {
  isValid: boolean
  errors: string[]
  migrated?: boolean
  migratedData?: string
}

export interface LexicalNodeValidation {
  hasValidRoot: boolean
  hasContent: boolean
  nodeTypes: string[]
  errors: string[]
}

/**
 * Validates that a string contains valid Lexical JSON
 */
export function isValidLexicalJSON(jsonString: string): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: []
  }

  try {
    const parsed = JSON.parse(jsonString)

    // Check basic structure
    if (!parsed || typeof parsed !== 'object') {
      result.errors.push('Invalid JSON structure')
      return result
    }

    // Must have root property
    if (!parsed.root || typeof parsed.root !== 'object') {
      result.errors.push('Missing or invalid root property')
      return result
    }

    // Root must have children array
    if (!Array.isArray(parsed.root.children)) {
      result.errors.push('Root must have children array')
      return result
    }

    // Check if root is empty
    if (parsed.root.children.length === 0) {
      result.errors.push('Root has no children - empty document')
      return result
    }

    // Validate node structure
    const nodeValidation = validateNodeStructure(parsed.root)
    if (!nodeValidation.hasValidRoot) {
      result.errors.push(...nodeValidation.errors)
      return result
    }

    result.isValid = true
    return result

  } catch (error) {
    result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Validates the structure of Lexical nodes recursively
 */
function validateNodeStructure(node: any): LexicalNodeValidation {
  const result: LexicalNodeValidation = {
    hasValidRoot: true,
    hasContent: false,
    nodeTypes: [],
    errors: []
  }

  if (!node || typeof node !== 'object') {
    result.hasValidRoot = false
    result.errors.push('Invalid node structure')
    return result
  }

  // Track node type
  if (node.type) {
    result.nodeTypes.push(node.type)
  }

  // Check for text content
  if (node.type === 'text' || node.type === 'stressed-text') {
    if (node.text && typeof node.text === 'string' && node.text.trim().length > 0) {
      result.hasContent = true
    }
  }

  // Recursively validate children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const childValidation = validateNodeStructure(child)
      result.nodeTypes.push(...childValidation.nodeTypes)
      if (childValidation.hasContent) {
        result.hasContent = true
      }
      if (!childValidation.hasValidRoot) {
        result.hasValidRoot = false
        result.errors.push(...childValidation.errors)
      }
    }
  }

  return result
}

/**
 * Migrates plain text to valid Lexical JSON
 */
export function migrateTextToLexical(text: string): string {
  if (!text || text.trim().length === 0) {
    // Return minimal valid Lexical structure
    return JSON.stringify({
      root: {
        children: [{
          children: [],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'section-paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
          sectionType: null
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1
      }
    })
  }

  const lines = text.split('\n')
  const children = lines.map((line) => {
    if (line.trim().length === 0) {
      // Empty line
      return {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'section-paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
        sectionType: null
      }
    }

    // Detect section headers
    const sectionMatch = line.match(/^\[(.*?)\]$/)
    let sectionType = null
    if (sectionMatch) {
      const sectionName = sectionMatch[1].toLowerCase()
      if (sectionName.includes('verse')) sectionType = 'verse'
      else if (sectionName.includes('chorus') && !sectionName.includes('pre')) sectionType = 'chorus'
      else if (sectionName.includes('pre-chorus') || sectionName.includes('prechorus')) sectionType = 'pre-chorus'
      else if (sectionName.includes('bridge')) sectionType = 'bridge'
      else if (sectionName.includes('intro')) sectionType = 'intro'
      else if (sectionName.includes('outro')) sectionType = 'outro'
      else if (sectionName.includes('hook')) sectionType = 'hook'
    }

    return {
      children: [{
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: line,
        type: 'stressed-text',
        version: 1,
        stressPatterns: [],
        autoDetectionEnabled: true
      }],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'section-paragraph',
      version: 1,
      textFormat: 0,
      textStyle: '',
      sectionType
    }
  })

  return JSON.stringify({
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  })
}

/**
 * Attempts to repair corrupted Lexical JSON
 */
export function repairLexicalJSON(jsonString: string): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    migrated: false
  }

  try {
    const parsed = JSON.parse(jsonString)

    // Try to extract any text content
    const extractedText = extractTextFromCorruptedJSON(parsed)

    if (extractedText && extractedText.trim().length > 0) {
      // Migrate extracted text to valid Lexical JSON
      result.migratedData = migrateTextToLexical(extractedText)
      result.isValid = true
      result.migrated = true
      console.log('✅ Successfully repaired corrupted Lexical JSON')
      return result
    }

    result.errors.push('Could not extract text from corrupted JSON')
    return result

  } catch (error) {
    result.errors.push(`Failed to repair JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Recursively extracts text content from potentially corrupted JSON
 */
function extractTextFromCorruptedJSON(obj: any, depth = 0): string {
  if (depth > 10) return '' // Prevent infinite recursion

  let text = ''

  if (typeof obj === 'string') {
    return obj
  }

  if (typeof obj !== 'object' || obj === null) {
    return ''
  }

  // Check for text properties
  if (obj.text && typeof obj.text === 'string') {
    text += obj.text
  }

  // Recursively search children, content, etc.
  const searchKeys = ['children', 'content', 'child', 'nodes', 'elements']
  for (const key of searchKeys) {
    if (Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        const childText = extractTextFromCorruptedJSON(item, depth + 1)
        if (childText) {
          text += (text ? '\n' : '') + childText
        }
      }
    } else if (obj[key]) {
      const childText = extractTextFromCorruptedJSON(obj[key], depth + 1)
      if (childText) {
        text += (text ? '\n' : '') + childText
      }
    }
  }

  return text
}

/**
 * Safe wrapper for loading and validating Lexical content
 */
export function safeLexicalLoad(content: string): {
  data: string
  wasRepaired: boolean
  errors: string[]
} {
  if (!content || content.trim().length === 0) {
    return {
      data: migrateTextToLexical(''),
      wasRepaired: true,
      errors: []
    }
  }

  // First, check if it's valid JSON
  let isJSON = false
  try {
    JSON.parse(content)
    isJSON = true
  } catch {
    isJSON = false
  }

  if (!isJSON) {
    // Treat as plain text
    return {
      data: migrateTextToLexical(content),
      wasRepaired: true,
      errors: ['Content was plain text, migrated to Lexical format']
    }
  }

  // Validate Lexical structure
  const validation = isValidLexicalJSON(content)

  if (validation.isValid) {
    return {
      data: content,
      wasRepaired: false,
      errors: []
    }
  }

  // Try to repair
  const repair = repairLexicalJSON(content)

  if (repair.isValid && repair.migratedData) {
    return {
      data: repair.migratedData,
      wasRepaired: true,
      errors: validation.errors
    }
  }

  // Last resort - extract any text and create fresh Lexical
  const extractedText = extractTextFromCorruptedJSON(content)
  return {
    data: migrateTextToLexical(extractedText),
    wasRepaired: true,
    errors: [...validation.errors, 'Used fallback text extraction']
  }
}

/**
 * Creates a backup-safe version of Lexical JSON before saving
 */
export function prepareLexicalForSave(editorStateJSON: string): {
  data: string
  isValid: boolean
  errors: string[]
} {
  const validation = isValidLexicalJSON(editorStateJSON)

  if (validation.isValid) {
    return {
      data: editorStateJSON,
      isValid: true,
      errors: []
    }
  }

  // Don't save corrupted data - extract text instead
  const safeLoad = safeLexicalLoad(editorStateJSON)

  return {
    data: safeLoad.data,
    isValid: false,
    errors: [...validation.errors, 'Prevented saving corrupted data']
  }
}

/**
 * Development helper to log Lexical validation issues
 */
export function debugLexicalJSON(content: string, label = 'Lexical Content'): void {
  if (process.env.NODE_ENV !== 'development') return

  console.group(`🔍 ${label} Validation`)

  const validation = isValidLexicalJSON(content)

  if (validation.isValid) {
    console.log('✅ Valid Lexical JSON')
  } else {
    console.error('❌ Invalid Lexical JSON:')
    validation.errors.forEach(error => console.error(`  - ${error}`))

    try {
      const parsed = JSON.parse(content)
      const nodeValidation = validateNodeStructure(parsed.root || parsed)
      console.log('📊 Node Analysis:')
      console.log(`  - Has content: ${nodeValidation.hasContent}`)
      console.log(`  - Node types: ${[...new Set(nodeValidation.nodeTypes)].join(', ')}`)
    } catch {
      console.error('  - Cannot parse as JSON')
    }
  }

  console.groupEnd()
}
