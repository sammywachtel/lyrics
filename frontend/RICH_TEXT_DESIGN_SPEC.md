# Rich-Text Lyrics Editor - Visual Design Specification

## Design Philosophy

The rich-text lyrics editor maintains the existing aesthetic while adding sophisticated songwriting tools. The design focuses on:

- **Gradient-based beauty**: Consistent with existing primary/creative color scheme
- **Contextual revelation**: Advanced features appear when needed
- **Progressive disclosure**: Simple by default, powerful when explored
- **Mobile-first responsive**: Touch-friendly interactions on all devices

## Layout Architecture

```
┌─ Rich-Text Editor Layout ─────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Formatting Toolbar (collapsible) ────────────────────────────────────┐ │
│  │  [B] [I] [U] [S] | ○●○ 🎵 🎤 | ⚙️ More                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Section Toolbar (existing) ───────────────────────────────────────────┐ │
│  │  📝 Verse  🎵 Chorus  ✨ Pre-Chorus  🌉 Bridge                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Main Editor Area ─────────────────────────────────────┬─ Sidebar ────┐ │
│  │                                                         │              │ │
│  │  ├ Verse 1 ──────────  [Rich Text Content Area]       │ 📂 Sections  │ │
│  │  │ **Bold** lyrics     with floating labels,          │              │ │
│  │  │ *Italic* words      prosody indicators,            │ ○●○ Features │ │
│  │  │ Syllable: hy•phen   and rhyme scheme               │              │ │
│  │  │                                                     │ Quick Nav    │ │
│  │  ├ Chorus ────────────                                │              │ │
│  │  ● Rhyme indicators   🎵 Prosody: ○●○●○● [a]          │              │ │
│  │  │ More content...                                     │              │ │
│  │                                                         │              │ │
│  └─────────────────────────────────────────────────────────┴──────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Component Visual Specifications

### 1. Formatting Toolbar
```css
/* Base appearance */
background: linear-gradient(90deg, rgba(250, 250, 249, 0.8), rgba(255, 255, 255, 0.6))
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(255, 255, 255, 0.3)
padding: 16px
```

**Format Buttons:**
- **Bold Button**: Bold "𝐁" icon, primary-100 when active
- **Italic Button**: Italic "𝐼" icon, primary-100 when active  
- **Underline Button**: "𝐔" icon with underline, primary-100 when active
- **Strikethrough Button**: "𝐒" with strikethrough, primary-100 when active

**Songwriting Tools:**
- **Syllable Marking**: "○●○" icon, warm-100 when active
- **Prosody Analysis**: "🎵" icon, primary-100 when active
- **Rhyme Scheme**: "🎤" icon, creative-100 when active

### 2. Section Labels (Visual Cues)

**Left Margin Labels:**
```css
.section-border {
  margin: 24px 0 16px 0;
  height: 1px;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
}

.section-border::after {
  background: linear-gradient(90deg, transparent, #3B82F6, transparent);
  width: 40px;
  height: 2px;
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
}
```

**Section Tag Design:**
```css
.section-tag {
  background: linear-gradient(90deg, var(--color-primary-100), var(--color-creative-100));
  color: var(--color-primary-800);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(var(--color-primary-200), 0.5);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(4px);
}
```

### 3. Rich-Text Content Styling

```css
/* Bold text */
.lexical-text-bold {
  font-weight: 700;
  color: var(--color-primary-800);
}

/* Italic text */
.lexical-text-italic {
  font-style: italic;
  color: var(--color-creative-700);
}

/* Underlined text */
.lexical-text-underline {
  text-decoration: underline;
  text-decoration-color: var(--color-primary-500);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

/* Strikethrough text */
.lexical-text-strikethrough {
  text-decoration: line-through;
  text-decoration-color: var(--color-neutral-400);
  text-decoration-thickness: 2px;
}
```

### 4. Syllable Marking Visual Design

```css
.syllable-mark-node {
  display: inline-flex;
  align-items: baseline;
  position: relative;
  cursor: pointer;
}

.syllable {
  position: relative;
  transition: all 0.2s ease;
}

.syllable.stressed {
  font-weight: 600;
  color: var(--color-primary-700);
}

.syllable-separator {
  margin: 0 2px;
  color: var(--color-creative-500);
  font-size: 0.75rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.syllable-mark-node:hover .syllable-separator {
  opacity: 1;
  color: var(--color-creative-500);
}

/* Stress indicators (appear on hover) */
.stress-indicator {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  transition: opacity 0.2s ease;
  opacity: 0;
}

.syllable-mark-node:hover .stress-indicator {
  opacity: 1;
}

.stress-indicator.stressed {
  color: var(--color-primary-500);
}

.stress-indicator.unstressed {
  color: var(--color-neutral-400);
}
```

### 5. Prosody Analysis Visualization

```css
.prosody-line-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 24px;
  position: relative;
  transition: background-color 0.2s ease;
  padding: 8px 0;
}

.prosody-line-wrapper:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.line-number-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  border-left: 4px solid;
  padding-left: 8px;
  font-size: 0.75rem;
  color: var(--color-neutral-500);
  font-family: var(--font-mono);
}

/* Line stability colors */
.line-stable {
  border-left-color: var(--color-success-500);
}

.line-mixed {
  border-left-color: var(--color-warm-500);
}

.line-unstable {
  border-left-color: #ef4444;
}

/* Stress pattern visualization */
.stress-pattern-visual {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
}

.stress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.stress-dot.stressed {
  background-color: var(--color-primary-500);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stress-dot.unstressed {
  background-color: var(--color-neutral-300);
}
```

### 6. Rhyme Scheme Indicators

```css
.rhyme-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 10;
  transition: all 0.2s ease;
}

.rhyme-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Rhyme scheme colors */
.rhyme-a { background-color: var(--color-primary-500); }
.rhyme-b { background-color: var(--color-success-500); }
.rhyme-c { background-color: var(--color-creative-500); }
.rhyme-d { background-color: var(--color-warm-500); }
.rhyme-e { background-color: #ef4444; }
.rhyme-f { background-color: #ec4899; }
.rhyme-g { background-color: #14b8a6; }
.rhyme-h { background-color: #f97316; }
```

### 7. Enhanced Section Sidebar

```css
.rich-text-section-sidebar {
  width: 288px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-strong);
  display: flex;
  flex-direction: column;
}

.section-item {
  border-radius: 12px;
  border: 1px solid rgba(var(--color-neutral-200), 0.5);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}

.section-item.active {
  background: linear-gradient(90deg, var(--color-primary-100), var(--color-creative-100));
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-soft);
}

.section-item:hover {
  background: white;
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-soft);
}

/* Analysis tools toggle area */
.analysis-tools {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(90deg, rgba(250, 250, 249, 0.8), rgba(255, 255, 255, 0.6));
}

.feature-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.feature-toggle.active {
  background: var(--color-warm-100);
  color: var(--color-warm-800);
  border: 1px solid var(--color-warm-200);
}

.feature-toggle:not(.active) {
  background: rgba(255, 255, 255, 0.6);
  color: var(--color-neutral-700);
  border: 1px solid rgba(var(--color-neutral-200), 0.5);
}
```

## 4. User Interaction Flows

### Text Formatting Flow
1. **Selection**: User selects text → Mini floating toolbar appears
2. **Format**: Click format button → Text gets formatted with visual feedback
3. **Persistence**: Formatting is maintained in editor state and saved

### Section Management Flow
1. **Creation**: User clicks section button → Section tag inserted with smart numbering
2. **Navigation**: Click section in sidebar → Editor scrolls and highlights section
3. **Editing**: Double-click section name → Inline edit mode with validation

### Advanced Feature Flow
1. **Enable**: User toggles feature in sidebar → Analysis begins
2. **Visualization**: Results appear as overlays/indicators
3. **Interaction**: Hover/click for detailed information
4. **AI Integration**: (Future) Click for AI suggestions

## 5. Accessibility Considerations

### Keyboard Navigation
```typescript
// Keyboard shortcuts
const shortcuts = {
  'Ctrl+B': 'Bold formatting',
  'Ctrl+I': 'Italic formatting', 
  'Ctrl+U': 'Underline formatting',
  'Ctrl+Shift+Enter': 'Insert new section',
  'F6': 'Navigate between editor regions',
  'Tab': 'Navigate toolbar buttons',
  'Escape': 'Close modals/cancel edit'
}
```

### Screen Reader Support
```html
<!-- Section tags are properly announced -->
<div class="section-border" aria-label="Section: Verse 1" role="separator">
  
<!-- Prosody indicators have descriptions -->
<span class="stress-indicator" aria-label="Stressed syllable">●</span>

<!-- Feature toggles are clearly labeled -->
<button aria-label="Toggle syllable marking analysis" aria-pressed="false">
```

### Color Contrast
- All text maintains WCAG AA contrast ratios (4.5:1 minimum)
- Rhyme scheme colors are distinguishable for colorblind users
- Hover states provide sufficient contrast changes

### Touch Targets
- All interactive elements are minimum 44px touch targets
- Buttons have adequate spacing (8px minimum)
- Hover states work on touch devices

## 6. Mobile Responsiveness Approach

### Breakpoint Strategy
```css
/* Mobile First Design */
.formatting-toolbar {
  /* Base: Mobile styles */
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

@media (min-width: 768px) {
  .formatting-toolbar {
    /* Tablet: Single row layout */
    flex-wrap: nowrap;
    gap: 12px;
    padding: 16px;
  }
}

@media (min-width: 1024px) {
  .formatting-toolbar {
    /* Desktop: Full features visible */
    justify-content: space-between;
  }
}
```

### Mobile-Specific Features
1. **Collapsible Toolbar**: Formatting tools collapse to "Format" button on mobile
2. **Swipe Gestures**: Swipe left/right between sections
3. **Touch-Optimized**: Larger touch targets, simplified interactions
4. **Bottom Sheet**: Section navigation uses bottom sheet on mobile
5. **Adaptive Layout**: Sidebar becomes slide-over panel on mobile

### Progressive Enhancement
- Core editing works without advanced features
- Rich-text formatting gracefully degrades to markdown
- Touch interactions enhance but don't replace keyboard/mouse

This design specification ensures the rich-text editor maintains the beautiful, professional aesthetic while adding powerful songwriting capabilities that work seamlessly across all devices and use cases.