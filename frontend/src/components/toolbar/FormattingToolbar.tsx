import React, { useState, useCallback } from 'react'

interface FormattingToolbarProps {
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => void
  onClearFormatting: () => void
  onToggleSyllableMarking: () => void
  onToggleProsodyAnalysis: () => void
  onToggleRhymeScheme: () => void
  syllableMarkingEnabled: boolean
  prosodyAnalysisEnabled: boolean
  rhymeSchemeEnabled: boolean
}

interface FormatButtonProps {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent'
}

const FormatButton: React.FC<FormatButtonProps> = ({ 
  onClick, 
  isActive = false, 
  title, 
  children, 
  variant = 'primary' 
}) => {
  const baseClasses = "relative overflow-hidden px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border"
  
  const variantClasses = {
    primary: isActive 
      ? "bg-primary-100 text-primary-800 border-primary-300 shadow-soft"
      : "bg-white/80 text-neutral-700 border-neutral-200/50 hover:bg-white hover:border-primary-300 hover:shadow-soft",
    secondary: isActive
      ? "bg-creative-100 text-creative-800 border-creative-300 shadow-soft"
      : "bg-white/80 text-neutral-700 border-neutral-200/50 hover:bg-creative-50 hover:border-creative-300 hover:shadow-soft",
    accent: isActive
      ? "bg-warm-100 text-warm-800 border-warm-300 shadow-soft"
      : "bg-white/80 text-neutral-700 border-neutral-200/50 hover:bg-warm-50 hover:border-warm-300 hover:shadow-soft"
  }
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
      title={title}
    >
      <span className="relative z-10 flex items-center space-x-1">
        {children}
      </span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-creative from-primary-50/50 to-creative-50/50 opacity-50"></div>
      )}
    </button>
  )
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onFormat,
  onClearFormatting,
  onToggleSyllableMarking,
  onToggleProsodyAnalysis,
  onToggleRhymeScheme,
  syllableMarkingEnabled,
  prosodyAnalysisEnabled,
  rhymeSchemeEnabled
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const formatButtons = [
    {
      format: 'bold' as const,
      icon: '𝐁',
      title: 'Bold (Ctrl+B)',
      shortcut: 'Ctrl+B'
    },
    {
      format: 'italic' as const,
      icon: '𝐼',
      title: 'Italic (Ctrl+I)',
      shortcut: 'Ctrl+I'
    },
    {
      format: 'underline' as const,
      icon: '𝐔',
      title: 'Underline (Ctrl+U)',
      shortcut: 'Ctrl+U'
    },
    {
      format: 'strikethrough' as const,
      icon: '𝐒',
      title: 'Strikethrough',
      shortcut: ''
    }
  ]
  
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-neutral-50/80 to-white/60 backdrop-blur-sm">
      {/* Basic Formatting */}
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-gradient-creative from-primary-400 to-creative-500"></span>
        <span className="text-sm font-semibold text-neutral-700">Format:</span>
      </div>
      
      <div className="flex gap-2">
        {formatButtons.map((button) => (
          <FormatButton
            key={button.format}
            onClick={() => onFormat(button.format)}
            title={button.title}
            variant="primary"
          >
            <span className="font-bold text-base">{button.icon}</span>
          </FormatButton>
        ))}
        
        <FormatButton
          onClick={onClearFormatting}
          title="Clear Formatting (Ctrl+\\)"
          variant="secondary"
        >
          <span>✖</span>
          <span>Clear</span>
        </FormatButton>
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-neutral-300/50"></div>
      
      {/* Songwriting Features */}
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-gradient-creative from-creative-400 to-warm-500"></span>
        <span className="text-sm font-semibold text-neutral-700">Songwriting:</span>
      </div>
      
      <div className="flex gap-2">
        <FormatButton
          onClick={onToggleSyllableMarking}
          isActive={syllableMarkingEnabled}
          title="Toggle Syllable Marking - Highlight syllable boundaries"
          variant="accent"
        >
          <span>○●○</span>
          <span>Syllables</span>
        </FormatButton>
        
        <FormatButton
          onClick={onToggleProsodyAnalysis}
          isActive={prosodyAnalysisEnabled}
          title="Toggle Prosody Analysis - Analyze rhythm and meter"
          variant="accent"
        >
          <span>🎵</span>
          <span>Prosody</span>
        </FormatButton>
        
        <FormatButton
          onClick={onToggleRhymeScheme}
          isActive={rhymeSchemeEnabled}
          title="Toggle Rhyme Scheme - Visualize rhyming patterns"
          variant="accent"
        >
          <span>🎤</span>
          <span>Rhymes</span>
        </FormatButton>
      </div>
      
      {/* Advanced Toggle */}
      <div className="flex-1" />
      
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="group relative overflow-hidden px-3 py-2 text-sm font-medium text-neutral-600 bg-white/60 hover:bg-white border border-neutral-200/50 hover:border-neutral-300 rounded-lg hover:shadow-soft transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
        title={showAdvanced ? 'Hide Advanced Features' : 'Show Advanced Features'}
      >
        <span className="relative z-10 flex items-center space-x-2">
          <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>⚙️</span>
          <span>{showAdvanced ? 'Less' : 'More'}</span>
        </span>
      </button>
      
      {/* Advanced Features Panel */}
      {showAdvanced && (
        <div className="absolute top-full left-0 right-0 z-20 mt-2 p-4 bg-white/95 backdrop-blur-md border border-neutral-200/50 rounded-lg shadow-strong">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-gradient-creative from-success-400 to-primary-500"></span>
              <span className="text-sm font-semibold text-neutral-700">AI Assistance:</span>
            </div>
            
            <div className="flex gap-2">
              <FormatButton
                onClick={() => {/* TODO: Implement AI suggestions */}}
                title="Get AI suggestions for selected text"
                variant="secondary"
              >
                <span>🤖</span>
                <span>AI Suggest</span>
              </FormatButton>
              
              <FormatButton
                onClick={() => {/* TODO: Implement rhyme suggestions */}}
                title="Find rhyming words for selected text"
                variant="secondary"
              >
                <span>🎯</span>
                <span>Find Rhymes</span>
              </FormatButton>
              
              <FormatButton
                onClick={() => {/* TODO: Implement synonym suggestions */}}
                title="Find synonyms for selected text"
                variant="secondary"
              >
                <span>📚</span>
                <span>Synonyms</span>
              </FormatButton>
            </div>
            
            <div className="w-px h-6 bg-neutral-300/50"></div>
            
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-gradient-creative from-warm-400 to-creative-500"></span>
              <span className="text-sm font-semibold text-neutral-700">Analysis:</span>
            </div>
            
            <div className="flex gap-2">
              <FormatButton
                onClick={() => {/* TODO: Implement sentiment analysis */}}
                title="Analyze emotional tone of lyrics"
                variant="accent"
              >
                <span>😊</span>
                <span>Sentiment</span>
              </FormatButton>
              
              <FormatButton
                onClick={() => {/* TODO: Implement reading level analysis */}}
                title="Check reading level and complexity"
                variant="accent"
              >
                <span>📊</span>
                <span>Complexity</span>
              </FormatButton>
              
              <FormatButton
                onClick={() => {/* TODO: Implement cliche detection */}}
                title="Detect and suggest alternatives to cliches"
                variant="accent"
              >
                <span>⚠️</span>
                <span>Clichés</span>
              </FormatButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormattingToolbar