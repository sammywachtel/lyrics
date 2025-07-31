import React, { useState, useCallback } from 'react'
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import type { PanelState } from '../../hooks/usePanelState'
import type { 
  SongSettings, 
  SectionStructure,
} from '../../lib/api'
import {
  createDefaultSectionStructure,
  NARRATIVE_POV_OPTIONS,
  STRUCTURAL_BOX_OPTIONS,
  RHYME_TYPE_OPTIONS,
  PROSODY_STYLE_OPTIONS,
  SECTION_TYPE_OPTIONS
} from '../../lib/api'

interface SettingsPanelProps {
  panelState: PanelState
  settings?: SongSettings
  onSettingsChange?: (settings: SongSettings) => void
  children?: React.ReactNode
  className?: string
}

export function SettingsPanel({ panelState, settings, onSettingsChange, children, className = '' }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('foundation')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    narrative: false,
    structure: true,
    rhyme: true,
    prosody: true
  })
  const isVisible = panelState.isMobile 
    ? panelState.activeTab === 'settings'
    : panelState.panels.left
  
  if (!isVisible) return null
  
  const panelClasses = [
    // Base styles
    'bg-white/90 backdrop-blur-md border-r border-neutral-200/50 shadow-soft',
    // Desktop styles
    'lg:relative lg:flex lg:flex-col',
    // Mobile/Tablet styles
    panelState.isMobile 
      ? 'absolute inset-0 z-40 flex flex-col'
      : panelState.isTablet
      ? 'absolute left-0 top-0 bottom-0 z-30 w-80 flex flex-col shadow-strong'
      : 'w-80 flex-shrink-0',
    className
  ].join(' ')
  
  return (
    <>
      {/* Overlay for tablet/mobile */}
      {(panelState.isMobile || panelState.isTablet) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
          onClick={() => panelState.closePanel('left')}
        />
      )}
      
      <div className={panelClasses}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200/50">
          <h2 className="text-lg font-semibold text-neutral-900">Song Settings</h2>
          
          {/* Close button for mobile/tablet */}
          {!panelState.isDesktop && (
            <button
              onClick={() => panelState.closePanel('left')}
              className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
              aria-label="Close settings panel"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-500" />
            </button>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-neutral-200/50 bg-neutral-50/50">
          {
            [
              { id: 'foundation', label: 'Foundation', icon: '🏗️' },
              { id: 'structure', label: 'Structure', icon: '📐' },
              { id: 'sound', label: 'Sound', icon: '🎵' },
              { id: 'style', label: 'Style', icon: '🎨' },
              { id: 'content', label: 'Content', icon: '📝' },
              { id: 'ai', label: 'AI', icon: '🤖' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                    : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100/50'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))
          }
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {children ? (
            children
          ) : settings ? (
            <SettingsContent 
              settings={settings} 
              onSettingsChange={onSettingsChange!}
              activeTab={activeTab}
              collapsedSections={collapsedSections}
              setCollapsedSections={setCollapsedSections}
            />
          ) : (
            <div className="p-4 text-center text-neutral-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Cog6ToothIcon className="w-8 h-8" />
              </div>
              <p>No song selected</p>
              <p className="text-xs mt-1">Open a song to configure its settings</p>
            </div>
          )}
        </div>
        
        {/* Panel Footer */}
        <div className="p-4 border-t border-neutral-200/50 bg-neutral-50/50">
          <p className="text-xs text-neutral-500 text-center">
            Settings auto-save as you work
          </p>
        </div>
      </div>
    </>
  )
}

// Settings Content Component
interface SettingsContentProps {
  settings: SongSettings
  onSettingsChange: (settings: SongSettings) => void
  activeTab: string
  collapsedSections: Record<string, boolean>
  setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

function SettingsContent({ settings, onSettingsChange, activeTab, collapsedSections, setCollapsedSections }: SettingsContentProps) {
  // Handle settings changes with proper typing
  const updateSettings = useCallback(<K extends keyof SongSettings>(
    key: K,
    value: SongSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }, [settings, onSettingsChange])

  // Handle nested object updates
  const updateNestedSettings = useCallback(<T extends Record<string, any>>(
    parentKey: keyof SongSettings,
    childKey: keyof T,
    value: any
  ) => {
    const parentValue = settings[parentKey] as T
    updateSettings(parentKey, {
      ...parentValue,
      [childKey]: value
    } as SongSettings[typeof parentKey])
  }, [settings, updateSettings])

  // Add new section structure
  const addSectionStructure = useCallback(() => {
    const newOrder = settings.section_structure.length
    const newSection = createDefaultSectionStructure(newOrder)
    updateSettings('section_structure', [...settings.section_structure, newSection])
  }, [settings.section_structure, updateSettings])

  // Remove section structure
  const removeSectionStructure = useCallback((index: number) => {
    const newSections = settings.section_structure.filter((_, i) => i !== index)
    // Reorder remaining sections
    const reorderedSections = newSections.map((section, i) => ({ ...section, order: i }))
    updateSettings('section_structure', reorderedSections)
  }, [settings.section_structure, updateSettings])

  // Update section structure
  const updateSectionStructure = useCallback(<K extends keyof SectionStructure>(
    index: number,
    key: K,
    value: SectionStructure[K]
  ) => {
    const newSections = [...settings.section_structure]
    newSections[index] = { ...newSections[index], [key]: value }
    updateSettings('section_structure', newSections)
  }, [settings.section_structure, updateSettings])

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const CollapsibleSection = ({ id, title, icon, children, defaultExpanded = false }: {
    id: string
    title: string
    icon: string
    children: React.ReactNode
    defaultExpanded?: boolean
  }) => {
    const isExpanded = collapsedSections[id] !== undefined ? !collapsedSections[id] : defaultExpanded
    
    return (
      <div className="border border-neutral-200/50 rounded-xl bg-white/50 backdrop-blur-sm">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50/50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-neutral-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 pt-0 space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {activeTab === 'foundation' && (
        <>
          <CollapsibleSection id="narrative" title="Narrative Foundation" icon="👤" defaultExpanded>
            {/* Point of View */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Point of View
              </label>
              <select
                value={settings.narrative_pov}
                onChange={(e) => updateSettings('narrative_pov', e.target.value as any)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {NARRATIVE_POV_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Central Theme */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Central Theme
              </label>
              <textarea
                value={settings.central_theme || ''}
                onChange={(e) => updateSettings('central_theme', e.target.value || undefined)}
                placeholder="What is the main message or theme of your song?"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            {/* Six Best Friends */}
            <div>
              <h4 className="font-medium text-neutral-700 mb-3">Six Best Friends</h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'who', label: 'Who', placeholder: 'Who is the song about?' },
                  { key: 'what', label: 'What', placeholder: 'What happens in the song?' },
                  { key: 'when', label: 'When', placeholder: 'When does it take place?' },
                  { key: 'where', label: 'Where', placeholder: 'Where does it happen?' },
                  { key: 'why', label: 'Why', placeholder: 'Why is this story important?' },
                  { key: 'how', label: 'How', placeholder: 'How does the story unfold?' }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(settings.six_best_friends as any)[key] || ''}
                      onChange={(e) => updateNestedSettings('six_best_friends', key as any, e.target.value || undefined)}
                      placeholder={placeholder}
                      className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="targets" title="Global Targets" icon="🎯">
            {/* Target Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Target Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.target_duration_minutes || ''}
                onChange={(e) => updateSettings('target_duration_minutes', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 3.5"
                min="0.5"
                max="15"
                step="0.1"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Overall Mood */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Overall Mood
              </label>
              <input
                type="text"
                value={settings.overall_mood || ''}
                onChange={(e) => updateSettings('overall_mood', e.target.value || undefined)}
                placeholder="e.g., melancholic, upbeat, contemplative"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Energy Level: {settings.energy_level}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.energy_level}
                onChange={(e) => updateSettings('energy_level', parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Calm</span>
                <span>Intense</span>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {activeTab === 'structure' && (
        <>
          <CollapsibleSection id="structural" title="Structural Framework" icon="🏗️" defaultExpanded>
            {/* Structural Boxes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Structural Boxes
              </label>
              <div className="space-y-2">
                {STRUCTURAL_BOX_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.structural_boxes.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateSettings('structural_boxes', [...settings.structural_boxes, option.value])
                        } else {
                          updateSettings('structural_boxes', settings.structural_boxes.filter(box => box !== option.value))
                        }
                      }}
                      className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section Structure */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Section Structure
                </label>
                <button
                  onClick={addSectionStructure}
                  className="text-primary-600 hover:text-primary-800 p-1 rounded"
                  title="Add Section"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {settings.section_structure.map((section, index) => (
                  <div key={index} className="p-3 border border-neutral-200 rounded-lg bg-neutral-50/50">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={section.label}
                        onChange={(e) => updateSectionStructure(index, 'label', e.target.value)}
                        placeholder="Section label"
                        className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-primary-500"
                      />
                      <select
                        value={section.type}
                        onChange={(e) => updateSectionStructure(index, 'type', e.target.value as any)}
                        className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-primary-500"
                      >
                        {SECTION_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={section.line_count_target || ''}
                        onChange={(e) => updateSectionStructure(index, 'line_count_target', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Lines"
                        min="1"
                        max="50"
                        className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        value={section.stress_count_target || ''}
                        onChange={(e) => updateSectionStructure(index, 'stress_count_target', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Stresses"
                        min="1"
                        max="20"
                        className="border border-neutral-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => removeSectionStructure(index)}
                        className="text-red-500 hover:text-red-700 flex items-center justify-center"
                        title="Remove Section"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {activeTab === 'sound' && (
        <>
          <CollapsibleSection id="rhyme" title="Rhyme Settings" icon="🎵" defaultExpanded>
            {/* Primary Rhyme Types */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Preferred Rhyme Types
              </label>
              <div className="space-y-1">
                {RHYME_TYPE_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.rhyme_preferences.primary_types.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newTypes = [...settings.rhyme_preferences.primary_types, option.value]
                          updateNestedSettings('rhyme_preferences', 'primary_types', newTypes)
                        } else {
                          const newTypes = settings.rhyme_preferences.primary_types.filter(type => type !== option.value)
                          updateNestedSettings('rhyme_preferences', 'primary_types', newTypes)
                        }
                      }}
                      className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rhyme Scheme Pattern */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rhyme Scheme Pattern
              </label>
              <input
                type="text"
                value={settings.rhyme_preferences.scheme_pattern || ''}
                onChange={(e) => updateNestedSettings('rhyme_preferences', 'scheme_pattern', e.target.value || undefined)}
                placeholder="e.g., ABAB, AABA, etc."
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Rhyme Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rhyme_preferences.allow_slant_rhymes}
                  onChange={(e) => updateNestedSettings('rhyme_preferences', 'allow_slant_rhymes', e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Allow slant rhymes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rhyme_preferences.emphasis_on_perfect}
                  onChange={(e) => updateNestedSettings('rhyme_preferences', 'emphasis_on_perfect', e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Emphasize perfect rhymes</span>
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="prosody" title="Prosody Settings" icon="🎼">
            {/* Rhythmic Stability */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rhythmic Stability: {settings.prosody_settings.rhythmic_stability}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.prosody_settings.rhythmic_stability}
                onChange={(e) => updateNestedSettings('prosody_settings', 'rhythmic_stability', parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Varied</span>
                <span>Rigid</span>
              </div>
            </div>

            {/* Phrasing Style */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phrasing Style
              </label>
              <select
                value={settings.prosody_settings.phrasing_style}
                onChange={(e) => updateNestedSettings('prosody_settings', 'phrasing_style', e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {PROSODY_STYLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Meter Consistency */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meter Consistency: {settings.prosody_settings.meter_consistency}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.prosody_settings.meter_consistency}
                onChange={(e) => updateNestedSettings('prosody_settings', 'meter_consistency', parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Free Verse</span>
                <span>Strict Meter</span>
              </div>
            </div>

            {/* Syllable Emphasis */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.prosody_settings.syllable_emphasis}
                  onChange={(e) => updateNestedSettings('prosody_settings', 'syllable_emphasis', e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Consider syllable stress patterns</span>
              </label>
            </div>
          </CollapsibleSection>
        </>
      )}

      {activeTab === 'style' && (
        <CollapsibleSection id="style-guide" title="Style Guide" icon="🎨" defaultExpanded>
          <StyleSettingsTab
            settings={settings.style_guide}
            onUpdate={(newSettings) => updateSettings('style_guide', newSettings)}
          />
        </CollapsibleSection>
      )}

      {activeTab === 'content' && (
        <CollapsibleSection id="keywords" title="Keywords & Content" icon="📝" defaultExpanded>
          <KeywordSettingsTab
            settings={settings.keyword_settings}
            onUpdate={(newSettings) => updateSettings('keyword_settings', newSettings)}
          />
        </CollapsibleSection>
      )}

      {activeTab === 'ai' && (
        <CollapsibleSection id="ai-settings" title="AI Assistance" icon="🤖" defaultExpanded>
          {/* AI Creativity Level */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              AI Creativity Level: {settings.ai_creativity_level}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.ai_creativity_level}
              onChange={(e) => updateSettings('ai_creativity_level', parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Conservative</span>
              <span>Experimental</span>
            </div>
          </div>

          {/* AI Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.preserve_user_phrases}
                onChange={(e) => updateSettings('preserve_user_phrases', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Preserve user's original phrases when editing</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.auto_suggestions}
                onChange={(e) => updateSettings('auto_suggestions', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Enable automatic suggestions</span>
            </label>
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

// Sub-components for complex tabs
interface KeywordSettingsTabProps {
  settings: any
  onUpdate: (settings: any) => void
}

const KeywordSettingsTab: React.FC<KeywordSettingsTabProps> = ({ settings, onUpdate }) => {
  const [newKeyword, setNewKeyword] = useState('')
  const [newMetaphor, setNewMetaphor] = useState('')
  const [newAvoidWord, setNewAvoidWord] = useState('')

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.primary_keywords.includes(newKeyword.trim())) {
      onUpdate({
        ...settings,
        primary_keywords: [...settings.primary_keywords, newKeyword.trim()]
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    onUpdate({
      ...settings,
      primary_keywords: settings.primary_keywords.filter((k: string) => k !== keyword)
    })
  }

  const addMetaphor = () => {
    if (newMetaphor.trim() && !settings.metaphor_themes.includes(newMetaphor.trim())) {
      onUpdate({
        ...settings,
        metaphor_themes: [...settings.metaphor_themes, newMetaphor.trim()]
      })
      setNewMetaphor('')
    }
  }

  const removeMetaphor = (metaphor: string) => {
    onUpdate({
      ...settings,
      metaphor_themes: settings.metaphor_themes.filter((m: string) => m !== metaphor)
    })
  }

  const addAvoidWord = () => {
    if (newAvoidWord.trim() && !settings.avoid_words.includes(newAvoidWord.trim())) {
      onUpdate({
        ...settings,
        avoid_words: [...settings.avoid_words, newAvoidWord.trim()]
      })
      setNewAvoidWord('')
    }
  }

  const removeAvoidWord = (word: string) => {
    onUpdate({
      ...settings,
      avoid_words: settings.avoid_words.filter((w: string) => w !== word)
    })
  }

  return (
    <div className="space-y-4">
      {/* Primary Keywords */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Primary Keywords
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addKeyword}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.primary_keywords.map((keyword: string) => (
            <span
              key={keyword}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 border border-primary-200"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Metaphor Themes */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Metaphor Themes
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newMetaphor}
            onChange={(e) => setNewMetaphor(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
            placeholder="Add metaphor theme..."
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addMetaphor}
            className="px-3 py-2 bg-creative-600 text-white rounded-lg hover:bg-creative-700 text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.metaphor_themes.map((metaphor: string) => (
            <span
              key={metaphor}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-creative-100 text-creative-800 border border-creative-200"
            >
              {metaphor}
              <button
                onClick={() => removeMetaphor(metaphor)}
                className="ml-1 text-creative-600 hover:text-creative-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Avoid Words */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Words to Avoid
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newAvoidWord}
            onChange={(e) => setNewAvoidWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAvoidWord()}
            placeholder="Add word to avoid..."
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addAvoidWord}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.avoid_words.map((word: string) => (
            <span
              key={word}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200"
            >
              {word}
              <button
                onClick={() => removeAvoidWord(word)}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StyleSettingsTabProps {
  settings: any
  onUpdate: (settings: any) => void
}

const StyleSettingsTab: React.FC<StyleSettingsTabProps> = ({ settings, onUpdate }) => {
  const [newGenre, setNewGenre] = useState('')
  const [newArtist, setNewArtist] = useState('')

  const addGenre = () => {
    if (newGenre.trim() && !settings.sub_genres.includes(newGenre.trim())) {
      onUpdate({
        ...settings,
        sub_genres: [...settings.sub_genres, newGenre.trim()]
      })
      setNewGenre('')
    }
  }

  const removeGenre = (genre: string) => {
    onUpdate({
      ...settings,
      sub_genres: settings.sub_genres.filter((g: string) => g !== genre)
    })
  }

  const addArtist = () => {
    if (newArtist.trim() && !settings.artist_references.includes(newArtist.trim())) {
      onUpdate({
        ...settings,
        artist_references: [...settings.artist_references, newArtist.trim()]
      })
      setNewArtist('')
    }
  }

  const removeArtist = (artist: string) => {
    onUpdate({
      ...settings,
      artist_references: settings.artist_references.filter((a: string) => a !== artist)
    })
  }

  return (
    <div className="space-y-4">
      {/* Primary Genre */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Primary Genre
        </label>
        <input
          type="text"
          value={settings.primary_genre || ''}
          onChange={(e) => onUpdate({ ...settings, primary_genre: e.target.value || undefined })}
          placeholder="e.g., Pop, Rock, Country, etc."
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Sub-genres */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Sub-genres
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGenre()}
            placeholder="Add sub-genre..."
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addGenre}
            className="px-3 py-2 bg-warm-600 text-white rounded-lg hover:bg-warm-700 text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.sub_genres.map((genre: string) => (
            <span
              key={genre}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-warm-100 text-warm-800 border border-warm-200"
            >
              {genre}
              <button
                onClick={() => removeGenre(genre)}
                className="ml-1 text-warm-600 hover:text-warm-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Artist References */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Artist References
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addArtist()}
            placeholder="Add artist to emulate..."
            className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addArtist}
            className="px-3 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.artist_references.map((artist: string) => (
            <span
              key={artist}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-800 border border-neutral-200"
            >
              {artist}
              <button
                onClick={() => removeArtist(artist)}
                className="ml-1 text-neutral-600 hover:text-neutral-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Innovation Level */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Innovation vs. Tradition: {settings.innovation_level}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={settings.innovation_level}
          onChange={(e) => onUpdate({ ...settings, innovation_level: parseInt(e.target.value) })}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>Traditional</span>
          <span>Innovative</span>
        </div>
      </div>

      {/* Avoid Cliches */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.avoid_cliches}
            onChange={(e) => onUpdate({ ...settings, avoid_cliches: e.target.checked })}
            className="rounded border-neutral-300 text-primary-600 mr-2 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">Avoid common genre cliches</span>
        </label>
      </div>
    </div>
  )
}