import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, $getNodeByKey } from 'lexical'
import { $isStressedTextNode, type StressPattern } from '../nodes/StressedTextNode'

interface StressContextMenuProps {
  x: number
  y: number
  word: string
  syllableIndex?: number
  onClose: () => void
}

interface ContextMenuState {
  word: string
  syllableIndex?: number
  stressPattern?: StressPattern
  nodeKey?: string
}

export default function StressContextMenu({ 
  x, 
  y, 
  word, 
  syllableIndex, 
  onClose 
}: StressContextMenuProps) {
  const [editor] = useLexicalComposerContext()
  const [contextState, setContextState] = useState<ContextMenuState>({ word })
  const menuRef = useRef<HTMLDivElement>(null)

  // Load current stress pattern for the word
  useEffect(() => {
    editor.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const anchorNode = selection.anchor.getNode()
      
      // Find the StressedTextNode that contains this word
      let textNode = anchorNode
      while (textNode && !$isStressedTextNode(textNode)) {
        const parent = textNode.getParent()
        if (!parent) break
        textNode = parent
      }
      
      if (textNode && $isStressedTextNode(textNode)) {
        const pattern = textNode.getStressPattern(word)
        setContextState({
          word,
          syllableIndex,
          stressPattern: pattern || undefined,
          nodeKey: textNode.getKey()
        })
      }
    })
  }, [editor, word, syllableIndex])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const toggleSyllableStress = useCallback((syllableIdx: number) => {
    if (!contextState.nodeKey) return

    editor.update(() => {
      const node = $getNodeByKey(contextState.nodeKey!)
      if ($isStressedTextNode(node)) {
        node.toggleSyllableStress(word, syllableIdx)
      }
    })
    
    onClose()
  }, [editor, word, contextState.nodeKey, onClose])

  const setWordStressPattern = useCallback((pattern: StressPattern) => {
    if (!contextState.nodeKey) return

    editor.update(() => {
      const node = $getNodeByKey(contextState.nodeKey!)
      if ($isStressedTextNode(node)) {
        node.setStressPattern(word, pattern)
      }
    })
    
    onClose()
  }, [editor, word, contextState.nodeKey, onClose])

  const clearWordStress = useCallback(() => {
    if (!contextState.nodeKey) return

    editor.update(() => {
      const node = $getNodeByKey(contextState.nodeKey!)
      if ($isStressedTextNode(node)) {
        node.clearStressPattern(word)
      }
    })
    
    onClose()
  }, [editor, word, contextState.nodeKey, onClose])

  const moveStressToSyllable = useCallback((syllableIdx: number) => {
    if (!contextState.stressPattern) return

    const newSyllables = contextState.stressPattern.syllables.map((syl, idx) => ({
      ...syl,
      stressed: idx === syllableIdx,
      overridden: true,
    }))

    setWordStressPattern({
      syllables: newSyllables,
      overridden: true,
    })
  }, [contextState.stressPattern, setWordStressPattern])

  const applyCommonStressPatterns = useCallback((patternType: 'trochee' | 'iamb' | 'dactyl' | 'anapest') => {
    if (!contextState.stressPattern) return

    const newSyllables = contextState.stressPattern.syllables.map((syl, idx) => {
      let stressed = false
      
      switch (patternType) {
        case 'trochee': // Strong-weak (1-0-1-0...)
          stressed = idx % 2 === 0
          break
        case 'iamb': // Weak-strong (0-1-0-1...)
          stressed = idx % 2 === 1
          break
        case 'dactyl': // Strong-weak-weak (1-0-0-1-0-0...)
          stressed = idx % 3 === 0
          break
        case 'anapest': // Weak-weak-strong (0-0-1-0-0-1...)
          stressed = idx % 3 === 2
          break
      }
      
      return {
        ...syl,
        stressed,
        overridden: true,
        confidence: 0.9, // High confidence for manual patterns
      }
    })

    setWordStressPattern({
      syllables: newSyllables,
      overridden: true,
    })
  }, [contextState.stressPattern, setWordStressPattern])

  if (!contextState.stressPattern) {
    return null // Pattern not loaded yet
  }

  const { stressPattern } = contextState
  const syllableCount = stressPattern.syllables.length

  return (
    <div
      ref={menuRef}
      className="stress-context-menu"
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
      }}
    >
      <div className="stress-context-menu-item" style={{ padding: '8px 12px', background: '#f9fafb', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>
        {word} ({syllableCount} syllable{syllableCount !== 1 ? 's' : ''})
      </div>
      
      <div className="stress-context-menu-divider" />

      {/* Individual Syllable Controls */}
      <div style={{ padding: '4px 0' }}>
        {stressPattern.syllables.map((syllable, idx) => (
          <button
            key={idx}
            className="stress-context-menu-item"
            onClick={() => toggleSyllableStress(idx)}
          >
            <span className="icon">
              {syllable.stressed ? '´' : '˘'}
            </span>
            <span>
              {syllable.text} - {syllable.stressed ? 'Stressed' : 'Unstressed'}
              {syllable.overridden && ' ✓'}
            </span>
          </button>
        ))}
      </div>

      <div className="stress-context-menu-divider" />

      {/* Move Stress Options */}
      {syllableCount > 1 && (
        <>
          <div style={{ padding: '4px 12px', fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
            Move stress to:
          </div>
          {stressPattern.syllables.map((syllable, idx) => (
            <button
              key={`move-${idx}`}
              className="stress-context-menu-item"
              onClick={() => moveStressToSyllable(idx)}
              style={{ paddingLeft: '28px' }}
            >
              {syllable.text} (syllable {idx + 1})
            </button>
          ))}
          <div className="stress-context-menu-divider" />
        </>
      )}

      {/* Common Stress Patterns */}
      {syllableCount > 1 && (
        <>
          <div style={{ padding: '4px 12px', fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
            Apply pattern:
          </div>
          
          {syllableCount >= 2 && (
            <>
              <button
                className="stress-context-menu-item"
                onClick={() => applyCommonStressPatterns('trochee')}
                style={{ paddingLeft: '28px' }}
              >
                Trochee (´˘´˘)
              </button>
              <button
                className="stress-context-menu-item"
                onClick={() => applyCommonStressPatterns('iamb')}
                style={{ paddingLeft: '28px' }}
              >
                Iamb (˘´˘´)
              </button>
            </>
          )}
          
          {syllableCount >= 3 && (
            <>
              <button
                className="stress-context-menu-item"
                onClick={() => applyCommonStressPatterns('dactyl')}
                style={{ paddingLeft: '28px' }}
              >
                Dactyl (´˘˘´)
              </button>
              <button
                className="stress-context-menu-item"
                onClick={() => applyCommonStressPatterns('anapest')}
                style={{ paddingLeft: '28px' }}
              >
                Anapest (˘˘´˘)
              </button>
            </>
          )}
          
          <div className="stress-context-menu-divider" />
        </>
      )}

      {/* Clear Options */}
      <button
        className="stress-context-menu-item"
        onClick={clearWordStress}
        style={{ color: '#dc2626' }}
      >
        <span className="icon">🗑</span>
        Clear stress pattern
      </button>
      
      <div className="stress-context-menu-divider" />
      
      <button
        className="stress-context-menu-item"
        onClick={onClose}
        style={{ color: '#6b7280' }}
      >
        <span className="icon">✕</span>
        Cancel
      </button>
    </div>
  )
}