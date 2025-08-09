# Songwriting Web App Requirements

## ⚠️ CRITICAL DEVELOPMENT DRIFT WARNINGS

**This section identifies areas where current development has diverged from the master specifications in `.private_docs/songwriting_with_tools.md`. Address these immediately to prevent architectural drift.**

### 🔴 **AI Implementation Priority Critical Error**
- **Current Status**: AI integration listed as item #4 (not yet implemented)
- **Specification Requirement**: AI constraints and behavior must be established BEFORE implementation
- **Risk**: Implementing AI without proper guardrails violates core philosophy
- **Action Required**: Implement AI constraints framework first, then AI features

### 🟡 **Rich-Text Editor Development Misalignment**
- **Current Status**: WYSIWYG editor in development with basic formatting
- **Specification Requirement**: WYSIWYG must include integrated prosody visualization
- **Gap**: Missing prosody color-coding, stability indicators, rhyme scheme visualization
- **Action Required**: Integrate prosody system into current rich-text implementation

### 🟡 **Section Tagging Progress vs. Core Features**
- **Current Status**: Section tagging marked as "Active development"
- **Missing Dependencies**: Boxes system validation, prosody analysis, AI box-mismatch detection
- **Risk**: Section system without narrative validation framework
- **Action Required**: Implement Boxes system alongside section tagging

### 🔴 **Testing Infrastructure Gaps**
- **Current Status**: Some test files skipped (.skip extension)
- **CLAUDE.md Requirement**: Mandatory testing for all development
- **Risk**: Technical debt accumulation, feature regression
- **Action Required**: Fix skipped tests, maintain 100% test coverage for new features

## Implementation Status

### ✅ COMPLETED

1. **User Authentication & Account Management** - IMPLEMENTED
   - ✅ Users can create an account and log in securely via Supabase Auth
   - ✅ Support for email/password authentication
   - ✅ User sessions maintained across browser sessions
   - ✅ Logout functionality to clear session
   - ✅ JWT token validation and user context management
   - ✅ Automatic user record creation in database
   - 🔄 OAuth (Google, GitHub) - Planned for next phase

2. **Library Management** - IMPLEMENTED
   - ✅ Display a library of all user's songs with pagination, sorting, and filtering
   - ✅ Filter by status (draft, in_progress, completed, archived)
   - ✅ Users can create new songs, archive/unarchive existing songs, and delete songs
   - ✅ Full CRUD operations for songs with proper user isolation
   - 🔄 Search bar for song titles and tags - Basic filtering implemented, search UI pending

### 🚧 IN PROGRESS / PARTIALLY IMPLEMENTED

1. **Basic Song Editor** - PARTIALLY IMPLEMENTED
   - ✅ Basic song title and lyrics editing
   - ✅ Song metadata storage (artist, tags, status)
   - 🔄 Rich-text editor with formatting (bold, italics, underline) - WYSIWYG editor in development
   - 🔄 Section tagging with user-defined labels (Verse, Chorus, Bridge) - Active development
   - ❌ Inline keyword/category tagging
   - ❌ Real-time diff highlighting
   - ❌ AI suggestion acceptance/rejection interface
   - ❌ Prosody visualization system
   - ❌ WYSIWYG prosody indicators (stability, line length, rhyme scheme)

## 🏗️ ARCHITECTURE & SCALABILITY PRIORITIES

### Architecture Review Results: 8.5/10 (Production-Ready)
**Detailed Analysis**: See `docs/architecture/scalability-review.md`

#### 🔴 **HIGH PRIORITY - Scalability Improvements** (Implement First)
1. **Global State Management** - CRITICAL for scale
   - ❌ Implement Redux Toolkit + RTK Query for centralized state
   - ❌ Replace component-level state with global store
   - ❌ Add API response caching (60-80% reduction in API calls)
   - **Impact**: Supports 10x user growth, eliminates prop drilling
   - **Timeline**: 1-2 weeks

2. **Database Connection Optimization** - CRITICAL for concurrent users
   - ❌ Configure pgBouncer for connection pooling under high load
   - ❌ Optimize existing JSONB queries (already well-indexed)
   - **Impact**: Handle 10,000+ concurrent users vs current 1,000
   - **Timeline**: 1 week

#### 🟡 **MEDIUM PRIORITY - Performance Enhancements**
3. **Background Job Processing** - Required for AI features
   - ❌ Implement Celery + Redis for heavy AI operations
   - ❌ Move AI suggestion generation to background tasks
   - **Impact**: Prevents API timeouts, improves user experience
   - **Timeline**: 2-3 weeks

4. **Frontend Code Splitting** - Reduces initial load time
   - ❌ Implement route-based lazy loading
   - ❌ Optimize bundle size (target 25% reduction)
   - **Impact**: Faster page loads, better mobile experience
   - **Timeline**: 1-2 weeks

### ❌ NOT YET IMPLEMENTED

2. **Advanced Lyrics Editor**
   - Rich-text editor supporting undo, redo, copy, paste, and basic formatting
   - Sections tagged with user-defined labels (e.g., Verse, Chorus, Bridge)
   - Inline tagging of lines or blocks with keywords/categories
   - Real-time diff highlighting: color-coded additions (green), deletions (red strike), modifications (yellow)
   - Manual text edits always preserved; AI suggestions can be accepted or rejected

3. **Tagging & Keywords System**
   - Users can add, edit, and remove keywords for entire songs or specific lines
   - Keywords assist in filtering/searching songs
   - Keyword Manager panel always visible, showing lists of used vs. unused keywords
   - Related-word expansion via reverse dictionary logic (Roget-style), grouping suggestions by emotional, sonic, and metaphorical categories
   - Used keywords are visually marked (e.g., dimmed or checkmark); hover reveals usage locations

4. **AI Assistant Integration**
   - AI-powered assistant panel on the right sidebar or inline
   - Accept natural-language iteration prompts (e.g., "Make the chorus more intimate")
   - AI suggestions respect current song settings: tone, rhythm, rhyme type, narrative POV, genre, artist emulation
   - AI can generate line-level edits, section rewrites, or full-song drafts
   - AI suggests setting changes when mismatches are detected (e.g., uneven line lengths indicating instability), with explanations
   - **CRITICAL AI CONSTRAINTS**:
     - AI MUST NOT volunteer to write entire lyrics for the user
     - AI MUST NOT take over the entire lyric writing process
     - AI MUST always hunt for clichés in its own suggestions and user lyrics
     - AI activity log panel for transparency and user approval of all changes
   - **Cliché Detection System**:
     - Toggle to highlight clichés in editor with explanations
     - Alternative phrasing suggestions for detected clichés
   - **Flexible Workflow Support**:.
     - Support users starting with nothing, just a title, or complete lyrics
     - Auto-fill song settings from existing lyrics (with user approval)
     - Optional AI-guided question system for song development
   - AI persona defined by system prompt:
     > "You are a songwriting expert, capable of writing in any style the user requests. You use the user's configuration and compositional rules to produce lyrical drafts, suggestions, and commentary."

5. **Iteration & Versioning System**
   - Automatic version creation on each AI iteration or manual save
   - Version list displayed in bottom panel with timestamps and version numbers
   - Color-coded diff view between any two versions
   - Bookmarking:
     - Auto-bookmark on first version and after any settings change
     - Manual bookmarks with user-provided summary
     - Bookmark list accessible in version panel
   - Settings version history linked to associated lyric versions

6. **Advanced Configuration & Settings**
   - Song Settings panel in left sidebar with:
     - Narrative POV (first-person, second-person, third-person, direct address)
     - Structural "Boxes" progression (Box 1, Box 2, Box 3)
     - Section structure (user-configurable labels and order)
     - Line count and stress count targets per section
     - Rhyme scheme and rhyme-type preferences (perfect, family, additive, subtractive, assonance, consonance)
     - Prosody parameters (rhythmic stability, front-heavy vs. back-heavy phrasing)
     - Genre and list of artists/genres to emulate (stylistic guide)
     - Central theme ("Why" question) and core "Six Best Friends" (Who, What, When, Where, Why, How)
     - Keyword/Metaphor management settings
   - Settings changes create new configuration versions and auto-bookmark

7. **Bookmarks & Navigation**
   - Song-level bookmarks for favorite songs
   - Version-level bookmarks for key iterations
   - Quick navigation controls to jump between bookmarks
   - Search field for bookmarks by summary text

8. **Collaboration & Sharing**
   - Share songs with other users by email or user ID
   - Permission levels: read-only, read-write
   - Shared users see songs in their library view
   - Export options: PDF, Markdown, ChordPro

9. **Song Notes & Ideas System**
   - Song-specific notes and ideas that inform AI assistant suggestions
   - Notes input field in song editor for capturing creative direction (e.g., "I want to try to use the phrase 'digging through the ground' somewhere in the song, but I don't know how to work it in yet")
   - AI assistant considers notes alongside other song settings when providing suggestions
   - Notes are suggestions, not requirements - AI uses them contextually rather than prioritizing them unless explicitly marked as priority
   - Notes persist with song versions and can be edited/updated as the song evolves

10. **Idea Library & Capture System**
   - Dedicated "Idea Library" for capturing and managing song concepts and inspirations
   - Quick capture interface optimized for mobile to record ideas on-the-go
   - AI integration for new song creation:
     - When creating new songs, AI suggests relevant ideas from the library as potential starting points
     - User can choose to start with a blank song or use an idea as foundation
     - AI helps populate initial song settings (title, theme, etc.) based on selected idea
   - AI reminder system during songwriting:
     - AI contextually suggests relevant ideas from library while writing that might fit current song
     - Helps prevent forgotten ideas and increases idea utilization
     - Subtle integration to avoid interrupting creative flow
   - Idea management features: categorization, search, archive, and delete unused ideas

11. **WYSIWYG Prosody Visualization System** 🚧 IN PROGRESS
   - ✅ **Basic Stress Mark Visualization**: Visual stress marks using React Portals with perfect positioning
   - ✅ **Timer-Based Analysis**: 2-second debounce after typing stops for non-disruptive stress detection
   - ✅ **Multi-Syllable Word Detection**: Dictionary-based stress patterns for complex words
   - 🚧 **Function-Based Stress Detection**: NEW CRITICAL REQUIREMENT from songwriting pedagogy
     - **Single-Syllable Word Classification**: Part-of-speech detection for grammatical vs. semantic function
       - STRESSED: Nouns, Verbs, Adjectives, Adverbs (meaning function)
       - UNSTRESSED: Articles (the, a, an), Conjunctions (and, but, or), Prepositions (in, on, at, to, into, before, after...), Personal Pronouns (I, you, he, she, it, they, us, them)
     - **Contextual Analysis**: Words like "there" can be unstressed (preposition) OR stressed (demonstrative pronoun)
     - **Natural Speech Rhythm**: "Always say the lyrics out loud, just saying them. Listen to the natural stresses as you speak"
   - ❌ **Line-by-Line Syllable Counting**: Display total syllables and stressed syllables per line
     - **Critical Insight**: "Line length is determined not by the number of syllables, but the number of stressed syllables"
     - Show format: "Line 1 (8/5)" = 8 total syllables, 5 stressed syllables
   - ❌ **Manual Override System**: Fix broken user override functionality for stress adjustments
   - **Line-by-Line Analysis**:
     - Line numbering within each section (only lines with text)
     - Line length stability visualization in context of surrounding lines
     - Visual rhyme scheme indicators on the interface
     - Rhyme type identification and tagging (perfect, family, additive, assonance, consonance)
   - **Interactive Prosody Controls**:
     - Users can mark words for rhyming with visual connections
     - AI tags rhyme types automatically with user approval
     - Toggle visual prosody aids on/off for experienced users
     - Contextual tooltips explaining prosody principles

12. **Development Engine - "Boxes" System** ⚠️ CRITICAL MISSING FEATURE
   - **Configurable Story Boxes**: 1-5 boxes (default 3) for narrative progression
   - **Box Content Management**:
     - Box 1 (smallest): Foundational idea/question
     - Box 2 (adds weight): Complexity/context expansion
     - Box 3+ (biggest/climax): Core "Why" delivery
   - **Box Validation & Highlighting**:
     - Visual indicators when lyrics don't match established boxes
     - AI suggests box updates when lyrics change significantly
     - User approval required for all box modifications
   - **Auto-Fill from Lyrics**: AI can suggest boxes based on existing lyrics with user confirmation

13. **Worksheet Development System** ⚠️ CRITICAL MISSING FEATURE
   - **Sound Audition Feature**: Hear rhymed words spoken/sung before insertion
   - **Rhyme Columns Organization**: Keyword-based columns with different rhyme types
   - **Dynamic Column Generation**: AI proposes new rhyme columns based on evolving lyrics
   - **Neighbor Ideas Exploration**: Roget's Thesaurus-style category browsing for concept expansion
   - **Rhyme Type Exploration**: Systematic exploration of perfect, family, additive, assonance, consonance rhymes

14. **Advanced User Control Features** ⚠️ CRITICAL MISSING FEATURE
   - **Line Freezing**: Mark specific lines to prevent AI suggestions
   - **Revision History Panel**: Track all changes with rollback and comparison capabilities
   - **User Control Toggles**: Disable automatic AI setting updates, prosody indicators, or other features
   - **Contextual Learning**: Tooltips and legends explaining prosody and songwriting principles
   - **AI Suggestion Freeze**: Prevent AI from modifying specific elements during drafting

## Subscription & Billing Provisioning

To prepare for a future subscription-based business model, the following provisions and scaffolding should be built into the application now:

### 1. Data Model & Feature-Gating
1. **Plans Table**
   - Fields: `id`, `name`, `slug`, `currency_code` (ISO 4217), `price_cents` (integer, minor units), `interval` (e.g., "month", "year"), `feature_flags` (JSON or array of strings).
2. **Subscriptions Table**
   - Fields: `id`, `user_id`, `plan_id`, `status` ("active", "paused", "canceled"), `current_period_start`, `current_period_end`, `trial_ends_at` (optional), `external_subscription_id` (e.g. Stripe ID).
3. **Invoices or Usage Records** (optional)
   - For metered billing or overage tracking: `id`, `subscription_id`, `amount_cents`, `description`, `timestamp`.
4. **User Entitlements**
   - Augment the `users` table with `subscription_id` or `role`/`flags` to represent access level (e.g., "free", "pro", "enterprise").
5. **Feature Flag Checks**
   - Wrap premium features (e.g., full-song AI drafts, bulk exports) in server- and client-side checks against the user's active plan’s feature_flags.

### 2. API & Billing Integration
1. **Billing Endpoints (stubbed)**
   - `GET /plans` — list available subscription tiers.
   - `POST /users/{userId}/subscription` — start or change a subscription.
   - `GET /users/{userId}/subscription` — retrieve subscription status.
   - `POST /users/{userId}/subscription/cancel` — cancel or pause a subscription.
2. **Webhooks & Sync**
   - `POST /webhooks/billing` — endpoint to receive events (e.g., `invoice.paid`, `subscription.updated`, `payment_failed`).
   - Background sync process to reconcile local `Subscriptions` table with external billing provider state.

### 3. UI/UX Hooks
1. **Pricing & Upgrade Flow**
   - Placeholder "Pricing" or "Upgrade" page in the nav.
   - Plan selection modal/dialog displaying plan cards fetched from `GET /plans`.
2. **Paywall Components**
   - Consistent UI component to block access to gated features, with CTA to upgrade.
3. **Account & Billing Tab**
   - In user settings, add a "Billing" tab showing current plan, next billing date, payment method, and actions to change/cancel plan.

### 4. Configuration & Ops
1. **Environment Variables**
   - Define placeholders for `PAYMENT_PROVIDER_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET`, and plan IDs per environment.
2. **Sandbox/Test Mode**
   - Enable a development mode with fake plan data and stubbed billing responses for end-to-end testing.
3. **Monitoring & Analytics**
   - Track key events: plan views, checkout starts, subscription creations, cancellations, and payment failures.
   - Set up alerts for unusual billing errors or webhook failures.

### 5. Roadmap & Roll-Out Strategy
1. **Free vs. Paid Feature Matrix**
   - Document which features remain free (basic editor, library browsing) and which become paid (AI full-song iterations, exports, collaboration advanced features).
2. **Trial Period Implementation**
   - Use the `trial_ends_at` field for limited-time access; display trial countdown in UI.
3. **Graceful Degradation**
   - Ensure that if billing is disabled or misconfigured, the app continues functioning in free mode without errors.

## Design Document

### Overview
A web-based AI-assisted lyric-writing tool combining structured songwriting methodology with flexible editing and version control.

### Core Features

- **User Account**: Secure login, OAuth, session management.
- **Library**: Song list with create, archive, delete, search, sort, filter.
- **Lyrics Editor**: Rich-text with section tagging, inline diff highlighting, AI suggestion acceptance.
- **Versioning**: Automatic and manual saves, diff viewer, bookmarks, version history.
- **Song Settings**: Detailed compositional controls (POV, Boxes, structure, prosody, rhyme, keywords, genre, artist emulation).
- **AI Assistant**: Interactive generation and editing, contextual to song settings, system-prompt persona.
- **Brainstorming & Guidance Panel**: Always-visible tools for core questions, Boxes, Six Best Friends, and keyword expansion.

### Interface Components

- **Left Sidebar**
  - Song Library
  - Settings Panel (collapsible)
  - Brainstorming Tools (Boxes, Six Best Friends)

- **Center Editor**
  - Lyrics editing area with section boundaries
  - Diff highlights toggle

- **Right Sidebar**
  - AI Assistant chat/input
  - Keyword & Metaphor Manager (used/unused indicators, expand button)

- **Bottom Panel**
  - Version History Timeline
  - Bookmark Controls & List
  - Settings Version Tracker

### User Flow

1. Authenticate (login/signup).
2. Select or create a song.
3. Configure initial song settings.
4. Draft lyrics manually or via AI.
5. Review AI suggestions, accept/reject edits.
6. Save iteration → new version created.
7. Bookmark important versions or auto-bookmark on settings change.
8. Navigate versions/bookmarks as needed.
9. Adjust settings and repeat drafting/iteration.


### Architecture & Tech Stack

- **Frontend**: React (Vite) + TypeScript + TailwindCSS
- **State Management**: Redux Toolkit or Zustand
- **Backend**: Python 3.10+ using FastAPI framework and Uvicorn ASGI server
  - FastAPI for async request handling, dependency injection, and auto-generated OpenAPI/Swagger documentation
  - Pydantic for data validation, settings management, and type-safe request/response models
  - SQLAlchemy (or Tortoise ORM) for database modeling and migrations
  - supabase-py client for auth (GoTrue) and database interactions, including real-time subscriptions if needed
  - HTTPX or aiohttp for any additional async HTTP calls (AI APIs, webhooks)
- **Deployment**: Docker → Google Cloud Run
  - Use a slim Python base image (e.g., `python:3.10-slim`)
  - Include multi-stage builds to minimize image size
- **Database**: Supabase (PostgreSQL) with Row-Level Security policies
- **AI Integration**: Official OpenAI/Gemini Python SDKs for async calls
- **Authentication**: Supabase GoTrue via supabase-py for email/password and OAuth flows
- **Storage**: Supabase Storage (via supabase-py) for exports, attachments, and media
- **Background Tasks**: Celery or FastAPI BackgroundTasks for webhooks reconciliation and billing sync jobs

## Responsive & Mobile Design

The application is designed with a "responsive-first" philosophy, ensuring seamless usability across desktop, tablet, and mobile devices. The primary experience is optimized for desktop/web, with a focused, trimmed-down mobile interface for on-the-go editing and review.

### 1. Desktop/Web Version (Primary Experience)

**Layout & Navigation:**
- Multi-panel layout: left sidebar (library, settings, brainstorming), center editor, right sidebar (AI, keywords), and bottom panel (versioning, bookmarks).
- Panels can be collapsed/expanded for workspace customization.
- Persistent navigation for quick switching between songs, versions, and settings.

**Interactions:**
- Rich drag-and-drop, keyboard shortcuts, hover tooltips, and context menus.
- Full-featured text editing, tagging, and AI interaction panels visible by default.
- Real-time feedback for AI suggestions, diff highlighting, and keyword expansion.

**Design Patterns:**
- Uses familiar web-app conventions (sidebars, modal dialogs, tabbed panels).
- Responsive grids and flex layouts for resizing.
- Tooltips and overlays for detailed information (e.g., keyword usage).

**Pros:**
- Maximum productivity for writing, editing, and managing large song libraries.
- All advanced features available in one view.
- Rich visualizations (diffs, bookmarks, version timeline).

**Cons:**
- High information density may overwhelm on small screens.
- Not all features translate well to touch interfaces.

### 2. Mobile Version (Secondary, Focused Experience)

**Core Mobile Views:**
1. **Library & Search:**
   - Streamlined list view with search and filter.
   - Tap to open song, swipe for quick actions (archive, delete).
2. **Lyrics Reader & Minor Editor:**
   - Full-screen lyrics display with minimal rich-text editing (bold, italics, section labels).
   - Tap lines to tag or edit; swipe gestures for navigation.
   - AI suggestions accessible via floating action button or bottom sheet.
3. **Settings & Details:**
   - Collapsible settings panel; core configuration only (POV, structure, genre).
   - Details and version history in accordion or modal overlays.

**Interaction Patterns:**
- Bottom navigation bar for Library, Editor, Settings.
- Swipe and tap gestures for navigation and quick actions.
- Floating action buttons for AI, new song, or export.
- Panels and modals optimized for touch and single-handed use.

**Trimmed-Down Mobile Feature Set:**
- Focus on reading, minor edits, AI suggestions, and quick bookmarking.
- Advanced features (diff viewer, detailed keyword manager, deep configuration) are minimized or accessible via secondary menus.
- Reduced visual clutter; large tap targets and simplified menus.

### 3. Responsive-First Tech Approach

- **Single Codebase:** Uses a unified codebase (Vue or React + TailwindCSS) with responsive utilities.
- **Breakpoints:** Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) drive layout changes:
  - Desktop: Multi-panel, sidebars visible
  - Tablet: Collapsible panels, stacked layouts
  - Mobile: Single-column, tabbed or bottom-drawer navigation
- **Component Strategy:**
  - Panels/components are modular, can be shown/hidden or rendered as overlays/modals on mobile.
  - Use of conditional rendering and CSS utility classes to adapt features per device.
- **Optional PWA Shell:**
  - Can be installed as a Progressive Web App for offline/standalone use.
  - Home screen icon, splash screen, offline caching for key assets.

### 4. Summary & Recommendations

- The application prioritizes a rich, desktop-centric interface for power users, with a responsive, focused mobile experience for quick edits and review.
- Maintain a single codebase leveraging TailwindCSS and component-driven frameworks to minimize duplication and ensure consistency.
- Design advanced features (diff, versioning, keyword management) to degrade gracefully or become optional on mobile.
- Use responsive design patterns (collapsible panels, bottom navigation, modals) and touch-friendly controls for mobile.
- Consider a PWA wrapper for offline/standalone access, especially for mobile users.
- Regularly test across device sizes to ensure usability and accessibility.


1. **User Login**
   - As a user, I want to sign up/login via email or OAuth so my data is secure.
   - Acceptance: Auth flow works; JWT obtained and stored; API access gated by token.

2. **View & Search Library**
   - As a user, I want to see and search my song library with filters so I can quickly find projects.
   - Acceptance: Library displays songs with title, tags, status; filters by keyword, date, tag.

3. **Create & Open Song**
   - As a user, I want to create a new song or open an existing one so I can start editing.
   - Acceptance: “New Song” button; clicking opens blank editor or loaded content.

4. **Edit Lyrics with Section Tagging**
   - As a user, I want to type and structure lyrics into sections (Verse, Chorus, Bridge, etc) so I can organize my song.
   - Acceptance: Section labels added/edited; content persists; diff highlighting active on changes.

5. **Manage Keywords & Metaphors**
   - As a user, I want to add keywords and see related-word suggestions so I can enrich my language.
   - Acceptance: Keyword panel shows used/unused; expand action generates relevant words; usage tracked.

6. **Configure Song Settings**
   - As a user, I want to define POV, Boxes, rhyme scheme, prosody, genre, and artist emulation so AI aligns with my style.
   - Acceptance: Settings form saves configs; changes versioned and auto-bookmarked.

7. **AI-Driven Iteration**
   - As a user, I want to request AI suggestions based on the song settings, including prosody. I do not want the AI to try to write for me.
   - Acceptance: Prompt input accepted; AI returns suggestions; user can accept/reject; new version created.

8. **Auto & Manual Versioning**
   - As a user, I want my edits and settings changes automatically saved as versions so I can revert or compare.
   - Acceptance: Version appears in timeline; diff viewer works; manual save/bookmark options available.

9. **Bookmark & Navigate Versions**
   - As a user, I want to bookmark key versions with summaries and jump between them quickly.
   - Acceptance: Bookmark creation UI; list shows summaries; click navigates to version.

10. **Collaborate & Share**
    - As a user, I want to share songs with read or write permissions so collaborators can contribute.
    - Acceptance: Share dialog to invite by email; permissions applied; shared songs visible to collaborators.

11. **Export Content**
    - As a user, I want to export lyrics as PDF, Markdown, or ChordPro so I can print or import into other tools.
    - Acceptance: Export menu generates files in appropriate formats.

12. **Responsive & Mobile-Friendly**
    - As a user, I want the UI to adapt to different screen sizes so I can edit on tablet or phone.
    - Acceptance: Layout adjusts; panels collapse appropriately; editor remains usable.
