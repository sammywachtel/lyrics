# Professional Songwriting Application - Design Specifications

## Overview

This document provides comprehensive design specifications for transforming the current songwriting application into a professional-grade tool that supports the complete lyric-writing methodology outlined in `songwriting_with_tools.md`. The design emphasizes visual prosody, workflow guidance, and seamless integration between creative and analytical processes.

## Design Philosophy

### Core Principles
- **Visual Prosody Integration**: Every element of the interface supports the prosodic analysis of lyrics
- **Progressive Disclosure**: Complex features are revealed contextually to avoid overwhelming users
- **Workflow Guidance**: The interface naturally guides users through the songwriting methodology
- **Professional Aesthetics**: Clean, modern design that inspires creativity while maintaining functionality
- **Accessibility First**: All visual indicators have accessible alternatives and clear explanations

### Color Psychology
- **Stability Indicators**: Green tones convey resolution and completion
- **Instability Indicators**: Amber/orange tones suggest movement and tension
- **Creative Energy**: Purple gradients inspire artistic thinking
- **Professional Trust**: Deep blues establish credibility and focus

## Application Layout

### Three-Panel Professional Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Header Navigation                            │
├─────────────┬───────────────────────────┬───────────────────────┤
│             │                           │                       │
│   Settings  │        Editor Panel       │      Tools Panel      │
│   Panel     │                           │                       │
│   (300px)   │        (Flexible)         │       (350px)         │
│             │                           │                       │
│             │                           │                       │
│             │                           │                       │
├─────────────┴───────────────────────────┴───────────────────────┤
│                    Status Footer                                │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Responsive Strategy
- **Desktop (1200px+)**: Full three-panel layout
- **Tablet (768px-1199px)**: Collapsible side panels with overlay mode
- **Mobile (320px-767px)**: Single panel with tabbed navigation

## Left Panel: Song Settings & Configuration

### Layout Structure
```typescript
interface SettingsPanelProps {
  song: Song
  onSettingsChange: (settings: Partial<SongSettings>) => void
  isCollapsed?: boolean
}
```

### Core Settings Sections

#### 1. Narrative Foundation
```css
.narrative-section {
  @apply bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4;
  border: 1px solid theme('colors.blue.200');
}

.setting-field {
  @apply mb-3 last:mb-0;
}

.field-label {
  @apply text-sm font-semibold text-gray-700 mb-2 flex items-center;
}

.field-input {
  @apply w-full p-3 border border-gray-200 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-transparent
         transition-all duration-200;
}
```

**Fields:**
- **Who is talking?** (dropdown + custom input)
- **To whom?** (Point of view selector)
- **Why?** (core message textarea with character count)

#### 2. Story Development (Boxes)
```css
.story-boxes {
  @apply space-y-3;
}

.story-box {
  @apply bg-white rounded-lg p-4 border-l-4 shadow-sm;
  transition: all 0.3s ease;
}

.story-box.box-1 { @apply border-l-green-400; }
.story-box.box-2 { @apply border-l-yellow-400; }
.story-box.box-3 { @apply border-l-red-400; }

.story-box:hover {
  @apply shadow-md transform scale-[1.02];
}

.box-header {
  @apply flex items-center justify-between mb-2;
}

.box-title {
  @apply font-semibold text-gray-800;
}

.box-weight {
  @apply text-xs px-2 py-1 rounded-full;
}
```

**Interactive Elements:**
- Dynamic box addition/removal (1-5 boxes)
- Weight indicators showing story progression
- Visual connection lines between boxes
- AI suggestions for box content

#### 3. Six Best Friends Explorer
```css
.six-friends-grid {
  @apply grid grid-cols-2 gap-3;
}

.friend-card {
  @apply bg-gradient-to-br from-purple-50 to-pink-50
         rounded-lg p-3 border border-purple-200
         hover:shadow-md transition-all duration-200;
}

.friend-icon {
  @apply w-8 h-8 bg-purple-100 rounded-full
         flex items-center justify-center mb-2;
}

.friend-input {
  @apply w-full text-sm p-2 border-0 bg-transparent
         placeholder-purple-400 focus:outline-none
         resize-none;
}
```

#### 4. Prosody Configuration
```css
.prosody-controls {
  @apply bg-gradient-to-r from-amber-50 to-orange-50
         rounded-xl p-4 border border-amber-200;
}

.stability-slider {
  @apply w-full h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200
         rounded-full appearance-none cursor-pointer;
}

.stability-slider::-webkit-slider-thumb {
  @apply appearance-none w-6 h-6 bg-white border-2 border-gray-300
         rounded-full shadow-lg cursor-pointer;
}

.prosody-indicators {
  @apply flex justify-between text-xs text-gray-600 mt-2;
}
```

**Elements:**
- Stability slider (stable ↔ unstable)
- Rhyme scheme preference toggles
- Line length matching controls
- Auto-analysis toggle switches

## Center Panel: Advanced Lyrics Editor

### Enhanced WYSIWYG Implementation

#### Component Architecture
```typescript
interface AdvancedEditorProps {
  lyrics: string
  onLyricsChange: (lyrics: string) => void
  songSettings: SongSettings
  mode: 'wysiwyg' | 'source' | 'split'
  prosodyVisible: boolean
  onModeChange: (mode: EditorMode) => void
}

interface ProsodyIndicators {
  lineStability: LineStability[]
  rhymeScheme: RhymeScheme
  matchedLengths: boolean[]
  clicheDetection: ClicheMatch[]
}
```

#### Visual Prosody System
```css
/* Line Stability Indicators */
.lyric-line {
  @apply relative pl-8 py-2 rounded-lg transition-all duration-300;
  border-left: 4px solid transparent;
}

.lyric-line.stable {
  @apply border-l-green-400 bg-green-50/30;
}

.lyric-line.unstable {
  @apply border-l-amber-400 bg-amber-50/30;
}

.lyric-line.highly-unstable {
  @apply border-l-red-400 bg-red-50/30;
}

/* Line Numbers with Prosody */
.line-number {
  @apply absolute left-2 top-2 text-xs font-mono
         w-6 h-6 rounded-full flex items-center justify-center;
}

.line-number.stable { @apply bg-green-100 text-green-700; }
.line-number.unstable { @apply bg-amber-100 text-amber-700; }
.line-number.highly-unstable { @apply bg-red-100 text-red-700; }

/* Rhyme Scheme Visualization */
.rhyme-indicator {
  @apply absolute right-2 top-2 w-4 h-4 rounded-full
         border-2 border-white shadow-sm;
}

.rhyme-a { @apply bg-blue-400; }
.rhyme-b { @apply bg-green-400; }
.rhyme-c { @apply bg-purple-400; }
.rhyme-d { @apply bg-orange-400; }

/* Section Headers */
.section-header {
  @apply font-bold text-lg py-3 px-4 rounded-lg
         bg-gradient-to-r from-indigo-100 to-purple-100
         border border-indigo-200 mb-2 mt-4;
}

.section-header:first-child {
  @apply mt-0;
}

/* Cliché Detection */
.cliche-detected {
  @apply bg-yellow-200 border-b-2 border-yellow-400
         cursor-help relative;
}

.cliche-tooltip {
  @apply absolute z-10 bg-gray-800 text-white text-sm
         px-3 py-2 rounded-lg shadow-lg -top-12 left-1/2
         transform -translate-x-1/2 opacity-0 pointer-events-none
         transition-opacity duration-200;
}

.cliche-detected:hover .cliche-tooltip {
  @apply opacity-100;
}
```

#### Editor Mode Controls
```css
.editor-mode-tabs {
  @apply flex bg-gray-100 rounded-lg p-1 mb-4;
}

.mode-tab {
  @apply flex-1 px-4 py-2 text-sm font-medium rounded-md
         text-gray-600 hover:text-gray-800
         transition-all duration-200 cursor-pointer;
}

.mode-tab.active {
  @apply bg-white text-indigo-600 shadow-sm;
}

.editor-toolbar {
  @apply flex items-center justify-between p-3
         bg-gray-50 border-b border-gray-200;
}

.toolbar-group {
  @apply flex items-center space-x-2;
}

.toolbar-button {
  @apply p-2 rounded-lg hover:bg-gray-200
         transition-colors duration-200 cursor-pointer;
}

.toolbar-button.active {
  @apply bg-indigo-100 text-indigo-600;
}
```

#### Split View Implementation
```css
.split-editor {
  @apply grid grid-cols-2 gap-4 h-full;
}

.split-pane {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.split-pane-header {
  @apply bg-gray-50 px-4 py-2 text-sm font-medium
         text-gray-700 border-b border-gray-200;
}

.wysiwyg-pane {
  @apply h-full overflow-y-auto p-4;
}

.source-pane {
  @apply h-full;
}

.source-editor {
  @apply w-full h-full p-4 font-mono text-sm
         border-0 resize-none focus:outline-none
         bg-gray-900 text-green-400;
}
```

#### Real-time Analysis Features
```typescript
interface AnalysisFeatures {
  prosodyAnalysis: {
    lineStability: (line: string, context: string[]) => StabilityScore
    rhymeScheme: (section: string[]) => RhymePattern
    lineLength: (lines: string[]) => LengthAnalysis
  }
  clicheDetection: {
    detectCliches: (text: string) => ClicheMatch[]
    suggestAlternatives: (cliche: string) => string[]
  }
  structureAnalysis: {
    identifySections: (lyrics: string) => Section[]
    validateBoxes: (lyrics: string, boxes: StoryBox[]) => ValidationResult
  }
}
```

## Right Panel: Prosody Tools & AI Assistant

### Tool Categories

#### 1. Rhyme Workshop
```css
.rhyme-workshop {
  @apply bg-gradient-to-br from-violet-50 to-purple-50
         rounded-xl p-4 mb-4 border border-violet-200;
}

.keyword-input {
  @apply w-full p-3 border border-purple-200 rounded-lg
         focus:ring-2 focus:ring-purple-500 mb-3;
}

.rhyme-columns {
  @apply grid grid-cols-2 gap-3;
}

.rhyme-type-section {
  @apply mb-4 last:mb-0;
}

.rhyme-type-header {
  @apply text-sm font-semibold text-purple-700 mb-2
         flex items-center justify-between;
}

.stability-badge {
  @apply text-xs px-2 py-1 rounded-full;
}

.stability-badge.stable { @apply bg-green-100 text-green-700; }
.stability-badge.unstable { @apply bg-amber-100 text-amber-700; }

.rhyme-suggestions {
  @apply space-y-1;
}

.rhyme-word {
  @apply inline-block px-3 py-1 bg-white rounded-lg
         border border-purple-200 text-sm cursor-pointer
         hover:bg-purple-50 hover:border-purple-300
         transition-all duration-200 mr-2 mb-2;
}

.rhyme-word:hover {
  @apply transform scale-105 shadow-sm;
}
```

#### 2. Thesaurus Integration
```css
.thesaurus-panel {
  @apply bg-gradient-to-br from-teal-50 to-cyan-50
         rounded-xl p-4 mb-4 border border-teal-200;
}

.concept-explorer {
  @apply mb-4;
}

.concept-web {
  @apply flex flex-wrap gap-2 mt-3;
}

.concept-node {
  @apply px-3 py-2 bg-teal-100 text-teal-800 rounded-lg
         text-sm cursor-pointer hover:bg-teal-200
         transition-colors duration-200;
}

.concept-connections {
  @apply text-xs text-teal-600 mt-1;
}
```

#### 3. AI Writing Assistant
```css
.ai-assistant {
  @apply bg-gradient-to-br from-indigo-50 to-blue-50
         rounded-xl p-4 border border-indigo-200;
}

.ai-status {
  @apply flex items-center justify-between mb-4;
}

.ai-indicator {
  @apply flex items-center space-x-2;
}

.ai-status-dot {
  @apply w-3 h-3 rounded-full;
}

.ai-status-dot.active { @apply bg-green-400 animate-pulse; }
.ai-status-dot.thinking { @apply bg-amber-400 animate-bounce; }
.ai-status-dot.inactive { @apply bg-gray-300; }

.ai-suggestions {
  @apply space-y-3;
}

.suggestion-card {
  @apply bg-white rounded-lg p-3 border border-indigo-100
         hover:shadow-md transition-all duration-200;
}

.suggestion-type {
  @apply text-xs font-medium text-indigo-600 uppercase
         tracking-wide mb-1;
}

.suggestion-content {
  @apply text-sm text-gray-700 mb-2;
}

.suggestion-actions {
  @apply flex justify-between items-center;
}

.suggestion-button {
  @apply text-xs px-3 py-1 rounded-full cursor-pointer
         transition-colors duration-200;
}

.suggestion-button.accept {
  @apply bg-green-100 text-green-700 hover:bg-green-200;
}

.suggestion-button.reject {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.suggestion-button.modify {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}
```

#### 4. Activity Log
```css
.activity-log {
  @apply bg-gray-50 rounded-xl p-4 mt-4 max-h-64 overflow-y-auto;
}

.activity-item {
  @apply flex items-start space-x-3 mb-3 last:mb-0;
}

.activity-icon {
  @apply w-6 h-6 rounded-full flex items-center justify-center
         text-xs flex-shrink-0 mt-1;
}

.activity-icon.ai { @apply bg-blue-100 text-blue-600; }
.activity-icon.user { @apply bg-green-100 text-green-600; }
.activity-icon.system { @apply bg-gray-100 text-gray-600; }

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-description {
  @apply text-sm text-gray-700 mb-1;
}

.activity-timestamp {
  @apply text-xs text-gray-500;
}

.activity-actions {
  @apply flex space-x-2 mt-2;
}

.activity-action {
  @apply text-xs text-blue-600 hover:text-blue-800
         cursor-pointer underline;
}
```

## Header Navigation

### Professional Header Design
```css
.app-header {
  @apply bg-white border-b border-gray-200 px-6 py-4
         flex items-center justify-between;
}

.header-left {
  @apply flex items-center space-x-6;
}

.app-logo {
  @apply flex items-center space-x-3;
}

.logo-icon {
  @apply w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600
         rounded-lg flex items-center justify-center text-white font-bold;
}

.app-title {
  @apply text-xl font-bold text-gray-800;
}

.song-meta {
  @apply flex items-center space-x-4 text-sm text-gray-600;
}

.header-center {
  @apply flex-1 max-w-md mx-8;
}

.quick-search {
  @apply w-full px-4 py-2 border border-gray-300 rounded-full
         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
         bg-gray-50 focus:bg-white transition-all duration-200;
}

.header-right {
  @apply flex items-center space-x-4;
}

.view-toggle {
  @apply flex bg-gray-100 rounded-lg p-1;
}

.toggle-button {
  @apply px-3 py-1 text-sm font-medium rounded-md
         text-gray-600 hover:text-gray-800
         transition-all duration-200 cursor-pointer;
}

.toggle-button.active {
  @apply bg-white text-indigo-600 shadow-sm;
}

.save-status {
  @apply flex items-center space-x-2 text-sm;
}

.save-indicator {
  @apply w-2 h-2 rounded-full;
}

.save-indicator.saved { @apply bg-green-400; }
.save-indicator.saving { @apply bg-amber-400 animate-pulse; }
.save-indicator.error { @apply bg-red-400; }
```

## Interactive Components

### Section Toolbar Enhancement
```typescript
interface SectionToolbarProps {
  onInsertSection: (sectionType: string) => void
  currentSection?: string
  prosodySettings: ProsodySettings
}

const sectionTypes = [
  { name: 'Verse 1', stability: 'mixed', suggested: true },
  { name: 'Chorus', stability: 'stable', suggested: true },
  { name: 'Verse 2', stability: 'mixed', suggested: false },
  { name: 'Bridge', stability: 'unstable', suggested: false },
  { name: 'Outro', stability: 'stable', suggested: false },
]
```

```css
.section-toolbar {
  @apply flex flex-wrap gap-2 p-4 bg-gradient-to-r
         from-gray-50 to-gray-100 rounded-lg border border-gray-200;
}

.section-button {
  @apply px-4 py-2 rounded-lg border border-gray-300
         bg-white hover:bg-gray-50 text-sm font-medium
         transition-all duration-200 cursor-pointer
         flex items-center space-x-2;
}

.section-button.suggested {
  @apply border-indigo-300 bg-indigo-50 text-indigo-700
         hover:bg-indigo-100;
}

.section-button:hover {
  @apply transform scale-105 shadow-sm;
}

.stability-indicator {
  @apply w-3 h-3 rounded-full;
}

.stability-indicator.stable { @apply bg-green-400; }
.stability-indicator.mixed { @apply bg-amber-400; }
.stability-indicator.unstable { @apply bg-red-400; }
```

### Enhanced Search Interface
```css
.advanced-search {
  @apply bg-white rounded-xl shadow-lg border border-gray-200 p-6;
}

.search-filters {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply text-sm font-medium text-gray-700;
}

.filter-select {
  @apply w-full p-2 border border-gray-300 rounded-lg
         focus:ring-2 focus:ring-indigo-500 focus:border-transparent;
}

.filter-tags {
  @apply flex flex-wrap gap-2;
}

.filter-tag {
  @apply px-3 py-1 bg-gray-100 text-gray-700 rounded-full
         text-sm cursor-pointer hover:bg-gray-200
         transition-colors duration-200;
}

.filter-tag.active {
  @apply bg-indigo-100 text-indigo-700;
}

.search-results-header {
  @apply flex justify-between items-center mb-4
         p-4 bg-gray-50 rounded-lg;
}

.results-count {
  @apply text-sm text-gray-600;
}

.sort-controls {
  @apply flex items-center space-x-2;
}

.sort-select {
  @apply text-sm border border-gray-300 rounded-lg px-3 py-1
         focus:ring-2 focus:ring-indigo-500;
}
```

## Mobile Responsiveness

### Breakpoint Strategy
```css
/* Mobile First Approach */
.responsive-grid {
  @apply grid grid-cols-1 gap-4;
}

@screen md {
  .responsive-grid {
    @apply grid-cols-2;
  }
}

@screen lg {
  .responsive-grid {
    @apply grid-cols-3;
  }
}

/* Panel Management */
.mobile-panel-toggle {
  @apply fixed bottom-4 right-4 z-50 md:hidden
         bg-indigo-600 text-white p-3 rounded-full
         shadow-lg hover:bg-indigo-700 transition-colors;
}

.mobile-panel-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden;
}

.mobile-panel {
  @apply fixed right-0 top-0 h-full w-80 bg-white
         shadow-2xl transform transition-transform duration-300 z-50;
}

.mobile-panel.closed {
  @apply translate-x-full;
}

/* Mobile Editor Optimization */
.mobile-editor {
  @apply text-base leading-relaxed;
}

.mobile-toolbar {
  @apply flex overflow-x-auto space-x-2 p-2;
}

.mobile-toolbar-button {
  @apply flex-shrink-0 px-3 py-2 bg-gray-100 rounded-lg
         text-sm font-medium whitespace-nowrap;
}
```

## Accessibility Features

### ARIA Integration
```typescript
interface AccessibilityProps {
  'aria-label': string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-controls'?: string
  role?: string
  tabIndex?: number
}

// Screen Reader Support
const prosodyAnnouncements = {
  stable: "Line marked as stable - creates resolution",
  unstable: "Line marked as unstable - creates tension",
  cliche: "Potential cliché detected - consider alternatives"
}
```

### Keyboard Navigation
```css
.keyboard-focusable {
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-500
         focus:ring-offset-2 rounded-lg;
}

.skip-link {
  @apply absolute -top-40 left-6 bg-indigo-600 text-white
         px-4 py-2 rounded-lg transition-all duration-200
         focus:top-6;
}

/* Focus visible for keyboard users only */
.focus-visible-only:focus-visible {
  @apply ring-2 ring-indigo-500 ring-offset-2;
}
```

### High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  .stability-indicator.stable { @apply bg-green-600; }
  .stability-indicator.unstable { @apply bg-orange-600; }
  .lyric-line.stable { @apply border-l-green-600 bg-green-100; }
  .lyric-line.unstable { @apply border-l-orange-600 bg-orange-100; }
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse { @apply animate-none; }
  .animate-bounce { @apply animate-none; }
  .transition-all { @apply transition-none; }
}
```

## State Management Architecture

### Redux Toolkit Structure
```typescript
interface AppState {
  song: {
    current: Song | null
    settings: SongSettings
    history: SongVersion[]
    isDirty: boolean
    saveStatus: 'saved' | 'saving' | 'error'
  }
  editor: {
    mode: 'wysiwyg' | 'source' | 'split'
    cursorPosition: number
    selection: TextSelection
    prosodyVisible: boolean
  }
  ai: {
    suggestions: AISuggestion[]
    isActive: boolean
    activityLog: AIActivity[]
  }
  ui: {
    leftPanelOpen: boolean
    rightPanelOpen: boolean
    activeToolTab: string
    searchQuery: string
    searchFilters: SearchFilters
  }
}

// Action Creators
const songSlice = createSlice({
  name: 'song',
  initialState,
  reducers: {
    updateLyrics: (state, action) => {
      state.current.lyrics = action.payload
      state.isDirty = true
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
      state.isDirty = true
    },
    saveSuccess: (state) => {
      state.isDirty = false
      state.saveStatus = 'saved'
    }
  }
})
```

## Performance Optimization

### Lazy Loading Strategy
```typescript
// Component Code Splitting
const RhymeWorkshop = lazy(() => import('./components/RhymeWorkshop'))
const ThesaurusPanel = lazy(() => import('./components/ThesaurusPanel'))
const AIAssistant = lazy(() => import('./components/AIAssistant'))

// Prosody Analysis Debouncing
const debouncedProsodyAnalysis = useMemo(
  () => debounce((lyrics: string) => {
    dispatch(analyzeProsody(lyrics))
  }, 500),
  [dispatch]
)
```

### Virtual Scrolling for Large Content
```typescript
interface VirtualizedEditorProps {
  lyrics: string
  lineHeight: number
  containerHeight: number
  onLyricsChange: (lyrics: string) => void
}

const VirtualizedEditor: React.FC<VirtualizedEditorProps> = ({
  lyrics,
  lineHeight,
  containerHeight,
  onLyricsChange
}) => {
  const lines = useMemo(() => lyrics.split('\n'), [lyrics])
  const visibleLines = Math.ceil(containerHeight / lineHeight) + 2

  // Implementation details...
}
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. Set up three-panel layout with responsive breakpoints
2. Implement basic WYSIWYG editor with source mode toggle
3. Create settings panel with narrative foundation fields
4. Add visual prosody indicators (line stability, basic rhyme scheme)

### Phase 2: Core Features (Weeks 3-4)
1. Implement story boxes system with drag-and-drop
2. Add rhyme workshop with keyword exploration
3. Create thesaurus integration with concept mapping
4. Build activity log and AI suggestion framework

### Phase 3: Advanced Tools (Weeks 5-6)
1. Implement cliché detection with alternative suggestions
2. Add advanced prosody analysis (line length matching, etc.)
3. Create comprehensive search with highlighting
4. Build mobile-responsive interface

### Phase 4: Polish & Testing (Week 7)
1. Accessibility audit and ARIA implementation
2. Performance optimization and lazy loading
3. Comprehensive testing suite
4. User experience refinement

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── EditorPanel.tsx
│   │   └── ToolsPanel.tsx
│   ├── editor/
│   │   ├── AdvancedWysiwygEditor.tsx
│   │   ├── SourceEditor.tsx
│   │   ├── SplitViewEditor.tsx
│   │   └── ProsodyIndicators.tsx
│   ├── tools/
│   │   ├── RhymeWorkshop.tsx
│   │   ├── ThesaurusPanel.tsx
│   │   ├── AIAssistant.tsx
│   │   └── ActivityLog.tsx
│   └── settings/
│       ├── NarrativeSettings.tsx
│       ├── StoryBoxes.tsx
│       ├── SixFriends.tsx
│       └── ProsodyControls.tsx
├── hooks/
│   ├── useProsodyAnalysis.ts
│   ├── useAIAssistant.ts
│   ├── useKeyboardShortcuts.ts
│   └── useAutoSave.ts
├── utils/
│   ├── prosodyAnalysis.ts
│   ├── clicheDetection.ts
│   ├── rhymeGeneration.ts
│   └── textAnalysis.ts
└── styles/
    ├── components.css
    ├── prosody.css
    └── responsive.css
```

This comprehensive design specification provides the foundation for building a professional songwriting application that seamlessly integrates creative and analytical processes, supporting the complete methodology outlined in the songwriting guide while maintaining an intuitive and inspiring user experience.
