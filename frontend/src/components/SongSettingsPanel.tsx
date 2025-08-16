import React, { useState, useCallback } from 'react'
import type {
  SongSettings,
  SectionStructure,
  KeywordSettings,
  StyleGuide,
  NarrativePOV,
  SectionType
} from '../lib/api'
import {
  createDefaultSectionStructure,
  NARRATIVE_POV_OPTIONS,
  STRUCTURAL_BOX_OPTIONS,
  RHYME_TYPE_OPTIONS,
  PROSODY_STYLE_OPTIONS,
  SECTION_TYPE_OPTIONS
} from '../lib/api'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

interface SongSettingsPanelProps {
  settings: SongSettings
  onSettingsChange: (settings: SongSettings) => void
  isVisible?: boolean
  onToggleVisibility?: () => void
}

export const SongSettingsPanel: React.FC<SongSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  isVisible = true,
  onToggleVisibility
}) => {
  const [activeTab, setActiveTab] = useState<string>('narrative')

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
  const updateNestedSettings = useCallback(<T extends Record<string, unknown>>(
    parentKey: keyof SongSettings,
    childKey: keyof T,
    value: unknown
  ) => {
    const parentValue = settings[parentKey] as T
    const updatedValue: SongSettings[typeof parentKey] = {
      ...parentValue,
      [childKey]: value
    }
    updateSettings(parentKey, updatedValue)
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

  // Handle array updates (tags, keywords, etc.)
  const updateArrayField = useCallback((
    parentKey: keyof SongSettings,
    childKey: string,
    value: string[]
  ) => {
    updateNestedSettings(parentKey, childKey, value)
  }, [updateNestedSettings])

  // Add/remove from arrays
  const addToArray = useCallback((
    parentKey: keyof SongSettings,
    childKey: string,
    value: string
  ) => {
    const current = (settings[parentKey] as Record<string, string[]>)[childKey]
    if (!current.includes(value)) {
      updateArrayField(parentKey, childKey, [...current, value])
    }
  }, [settings, updateArrayField])

  const removeFromArray = useCallback((
    parentKey: keyof SongSettings,
    childKey: string,
    value: string
  ) => {
    const current = (settings[parentKey] as Record<string, string[]>)[childKey]
    updateArrayField(parentKey, childKey, current.filter(item => item !== value))
  }, [settings, updateArrayField])

  if (!isVisible) {
    return (
      <div className="fixed left-0 top-20 z-50">
        <button
          onClick={onToggleVisibility}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-r-xl shadow-2xl border-2 border-indigo-500 transition-all duration-200 hover:scale-105"
          title="Show Settings Panel"
          style={{backgroundColor: '#4f46e5'}}
        >
          <div className="flex items-center space-x-1">
            <ChevronRightIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onToggleVisibility} />
      )}

      {/* Settings Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r-2 border-gray-300 shadow-2xl z-50 overflow-hidden flex flex-col opacity-100" style={{backgroundColor: '#ffffff'}}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-300 bg-white" style={{backgroundColor: '#ffffff'}}>
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Cog6ToothIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg">Song Settings</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
          title="Hide Settings Panel"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </div>


      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b-2 border-gray-300 bg-gray-100" style={{backgroundColor: '#f3f4f6'}}>
        {[
          { id: 'narrative', label: 'Narrative', icon: '👤' },
          { id: 'structure', label: 'Structure', icon: '🏗️' },
          { id: 'rhyme', label: 'Rhyme', icon: '🎵' },
          { id: 'prosody', label: 'Prosody', icon: '🎼' },
          { id: 'keywords', label: 'Keywords', icon: '🏷️' },
          { id: 'style', label: 'Style', icon: '🎨' },
          { id: 'targets', label: 'Targets', icon: '🎯' },
          { id: 'ai', label: 'AI', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white" style={{backgroundColor: '#ffffff'}}>
        {/* Narrative Tab */}
        {activeTab === 'narrative' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Narrative Settings</h3>

            {/* Point of View */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Point of View
              </label>
              <select
                value={settings.narrative_pov}
                onChange={(e) => updateSettings('narrative_pov', e.target.value as NarrativePOV)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Central Theme
              </label>
              <textarea
                value={settings.central_theme || ''}
                onChange={(e) => updateSettings('central_theme', e.target.value || undefined)}
                placeholder="What is the main message or theme of your song?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
                rows={3}
              />
            </div>

            {/* Six Best Friends */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Six Best Friends</h4>
              <div className="space-y-3">
                {[
                  { key: 'who', label: 'Who', placeholder: 'Who is the song about?' },
                  { key: 'what', label: 'What', placeholder: 'What happens in the song?' },
                  { key: 'when', label: 'When', placeholder: 'When does it take place?' },
                  { key: 'where', label: 'Where', placeholder: 'Where does it happen?' },
                  { key: 'why', label: 'Why', placeholder: 'Why is this story important?' },
                  { key: 'how', label: 'How', placeholder: 'How does the story unfold?' }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(settings.six_best_friends as Record<string, string | undefined>)[key] || ''}
                      onChange={(e) => updateNestedSettings('six_best_friends', key as keyof typeof settings.six_best_friends, e.target.value || undefined)}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Structure Tab */}
        {activeTab === 'structure' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Structure Settings</h3>

            {/* Structural Boxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section Structure */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Section Structure
                </label>
                <button
                  onClick={addSectionStructure}
                  className="text-blue-600 hover:text-blue-800"
                  title="Add Section"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {settings.section_structure.map((section, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={section.label}
                        onChange={(e) => updateSectionStructure(index, 'label', e.target.value)}
                        placeholder="Section label"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <select
                        value={section.type}
                        onChange={(e) => updateSectionStructure(index, 'type', e.target.value as SectionType)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        {SECTION_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={section.line_count_target || ''}
                        onChange={(e) => updateSectionStructure(index, 'line_count_target', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Lines"
                        min="1"
                        max="50"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={section.stress_count_target || ''}
                        onChange={(e) => updateSectionStructure(index, 'stress_count_target', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Stresses"
                        min="1"
                        max="20"
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => removeSectionStructure(index)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove Section"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rhyme Tab */}
        {activeTab === 'rhyme' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Rhyme Settings</h3>

            {/* Primary Rhyme Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          addToArray('rhyme_preferences', 'primary_types', option.value)
                        } else {
                          removeFromArray('rhyme_preferences', 'primary_types', option.value)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rhyme Scheme Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rhyme Scheme Pattern
              </label>
              <input
                type="text"
                value={settings.rhyme_preferences.scheme_pattern || ''}
                onChange={(e) => updateNestedSettings('rhyme_preferences', 'scheme_pattern', e.target.value || undefined)}
                placeholder="e.g., ABAB, AABA, etc."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Rhyme Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rhyme_preferences.allow_slant_rhymes}
                  onChange={(e) => updateNestedSettings('rhyme_preferences', 'allow_slant_rhymes', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Allow slant rhymes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rhyme_preferences.emphasis_on_perfect}
                  onChange={(e) => updateNestedSettings('rhyme_preferences', 'emphasis_on_perfect', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Emphasize perfect rhymes</span>
              </label>
            </div>
          </div>
        )}

        {/* Prosody Tab */}
        {activeTab === 'prosody' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Prosody Settings</h3>

            {/* Rhythmic Stability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rhythmic Stability: {settings.prosody_settings.rhythmic_stability}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.prosody_settings.rhythmic_stability}
                onChange={(e) => updateNestedSettings('prosody_settings', 'rhythmic_stability', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Varied</span>
                <span>Rigid</span>
              </div>
            </div>

            {/* Phrasing Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phrasing Style
              </label>
              <select
                value={settings.prosody_settings.phrasing_style}
                onChange={(e) => updateNestedSettings('prosody_settings', 'phrasing_style', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meter Consistency: {settings.prosody_settings.meter_consistency}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.prosody_settings.meter_consistency}
                onChange={(e) => updateNestedSettings('prosody_settings', 'meter_consistency', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
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
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Consider syllable stress patterns</span>
              </label>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <KeywordSettingsTab
            settings={settings.keyword_settings}
            onUpdate={(newSettings) => updateSettings('keyword_settings', newSettings)}
          />
        )}

        {/* Style Tab */}
        {activeTab === 'style' && (
          <StyleSettingsTab
            settings={settings.style_guide}
            onUpdate={(newSettings) => updateSettings('style_guide', newSettings)}
          />
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Global Targets</h3>

            {/* Target Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Overall Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overall Mood
              </label>
              <input
                type="text"
                value={settings.overall_mood || ''}
                onChange={(e) => updateSettings('overall_mood', e.target.value || undefined)}
                placeholder="e.g., melancholic, upbeat, contemplative"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Energy Level: {settings.energy_level}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.energy_level}
                onChange={(e) => updateSettings('energy_level', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Calm</span>
                <span>Intense</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">AI Assistance</h3>

            {/* AI Creativity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Creativity Level: {settings.ai_creativity_level}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.ai_creativity_level}
                onChange={(e) => updateSettings('ai_creativity_level', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Conservative</span>
                <span>Experimental</span>
              </div>
            </div>

            {/* AI Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.preserve_user_phrases}
                  onChange={(e) => updateSettings('preserve_user_phrases', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Preserve user's original phrases when editing</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.auto_suggestions}
                  onChange={(e) => updateSettings('auto_suggestions', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Enable automatic suggestions</span>
              </label>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}

// Keyword Settings Sub-component
const KeywordSettingsTab: React.FC<{
  settings: KeywordSettings
  onUpdate: (settings: KeywordSettings) => void
}> = ({ settings, onUpdate }) => {
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
      <h3 className="font-medium text-gray-900">Keyword Settings</h3>

      {/* Primary Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary Keywords
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={addKeyword}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.primary_keywords.map((keyword: string) => (
            <span
              key={keyword}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Metaphor Themes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Metaphor Themes
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newMetaphor}
            onChange={(e) => setNewMetaphor(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
            placeholder="Add metaphor theme..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={addMetaphor}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.metaphor_themes.map((metaphor: string) => (
            <span
              key={metaphor}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
            >
              {metaphor}
              <button
                onClick={() => removeMetaphor(metaphor)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Avoid Words */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Words to Avoid
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newAvoidWord}
            onChange={(e) => setNewAvoidWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAvoidWord()}
            placeholder="Add word to avoid..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={addAvoidWord}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.avoid_words.map((word: string) => (
            <span
              key={word}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
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

// Style Settings Sub-component
const StyleSettingsTab: React.FC<{
  settings: StyleGuide
  onUpdate: (settings: StyleGuide) => void
}> = ({ settings, onUpdate }) => {
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
      <h3 className="font-medium text-gray-900">Style Settings</h3>

      {/* Primary Genre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary Genre
        </label>
        <input
          type="text"
          value={settings.primary_genre || ''}
          onChange={(e) => onUpdate({ ...settings, primary_genre: e.target.value || undefined })}
          placeholder="e.g., Pop, Rock, Country, etc."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
        />
      </div>

      {/* Sub-genres */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sub-genres
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGenre()}
            placeholder="Add sub-genre..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={addGenre}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.sub_genres.map((genre: string) => (
            <span
              key={genre}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
            >
              {genre}
              <button
                onClick={() => removeGenre(genre)}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Artist References */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Artist References
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addArtist()}
            placeholder="Add artist to emulate..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={addArtist}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {settings.artist_references.map((artist: string) => (
            <span
              key={artist}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
            >
              {artist}
              <button
                onClick={() => removeArtist(artist)}
                className="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Innovation Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Innovation vs. Tradition: {settings.innovation_level}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={settings.innovation_level}
          onChange={(e) => onUpdate({ ...settings, innovation_level: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
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
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          <span className="text-sm text-gray-700">Avoid common genre cliches</span>
        </label>
      </div>
    </div>
  )
}

export default SongSettingsPanel
