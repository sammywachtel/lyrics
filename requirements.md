# Songwriting Web App Requirements

## Comprehensive Requirements

1. **User Authentication & Account Management**  
   - Users must be able to create an account and log in securely.  
   - Support email/password and OAuth (Google, GitHub).  
   - User sessions should be maintained across browser sessions.  
   - Logout functionality to clear session.

2. **Library Management**  
   - Display a library of all user’s songs with pagination, sorting, and filtering.  
   - Filter by tags, keywords, creation date, modification date, and archive status.  
   - Users can create new songs, archive/unarchive existing songs, and delete songs.  
   - Search bar for song titles and tags.

3. **Editable Lyrics Window**  
   - Rich-text editor supporting undo, redo, copy, paste, and basic formatting (bold, italics, underline).  
   - Sections tagged with user-defined labels (e.g., Verse, Chorus, Bridge).  
   - Inline tagging of lines or blocks with keywords/categories.  
   - Real-time diff highlighting: color-coded additions (green), deletions (red strike), modifications (yellow).  
   - Manual text edits always preserved; AI suggestions can be accepted or rejected.

4. **Tagging & Keywords**  
   - Users can add, edit, and remove keywords for entire songs or specific lines.  
   - Keywords assist in filtering/searching songs.  
   - Keyword Manager panel always visible, showing lists of used vs. unused keywords.  
   - Related-word expansion via reverse dictionary logic (Roget-style), grouping suggestions by emotional, sonic, and metaphorical categories.  
   - Used keywords are visually marked (e.g., dimmed or checkmark); hover reveals usage locations.

5. **AI Assistant Integration**  
   - AI-powered assistant panel on the right sidebar or inline.  
   - Accept natural-language iteration prompts (e.g., “Make the chorus more intimate”).  
   - AI suggestions respect current song settings: tone, rhythm, rhyme type, narrative POV, genre, artist emulation.  
   - AI can generate line-level edits, section rewrites, or full-song drafts.  
   - AI suggests setting changes when mismatches are detected (e.g., uneven line lengths indicating instability), with explanations.  
   - AI persona defined by system prompt:  
     > “You are a songwriting expert, capable of writing in any style the user requests. You use the user’s configuration and compositional rules to produce lyrical drafts, suggestions, and commentary.”

6. **Iteration & Versioning**  
   - Automatic version creation on each AI iteration or manual save.  
   - Version list displayed in bottom panel with timestamps and version numbers.  
   - Color-coded diff view between any two versions.  
   - Bookmarking:  
     - Auto-bookmark on first version and after any settings change.  
     - Manual bookmarks with user-provided summary.  
     - Bookmark list accessible in version panel.  
   - Settings version history linked to associated lyric versions.

7. **Configuration & Settings**  
   - Song Settings panel in left sidebar with:  
     - Narrative POV (first-person, second-person, third-person, direct address).  
     - Structural “Boxes” progression (Box 1, Box 2, Box 3).  
     - Section structure (user-configurable labels and order).  
     - Line count and stress count targets per section.  
     - Rhyme scheme and rhyme-type preferences (perfect, family, additive, subtractive, assonance, consonance).  
     - Prosody parameters (rhythmic stability, front-heavy vs. back-heavy phrasing).  
     - Genre and list of artists/genres to emulate (stylistic guide).  
     - Central theme (“Why” question) and core “Six Best Friends” (Who, What, When, Where, Why, How).  
     - Keyword/Metaphor management settings.  
   - Settings changes create new configuration versions and auto-bookmark.

8. **Bookmarks & Navigation**  
   - Song-level bookmarks for favorite songs.  
   - Version-level bookmarks for key iterations.  
   - Quick navigation controls to jump between bookmarks.  
   - Search field for bookmarks by summary text.


9. **Collaboration & Sharing (v1 Optional)**  
   - Share songs with other users by email or user ID.  
   - Permission levels: read-only, read-write.  
   - Shared users see songs in their library view.  
   - Export options: PDF, Markdown, ChordPro.

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
- **State**: Redux Toolkit or Zustand  
- **Backend**: Node.js (Express) or Go + Supabase (GoTrue) for auth & Postgres  
- **Deployment**: Docker → Google Cloud Run  
- **Database**: Supabase (PostgreSQL) with RLS policies  
- **AI API**: OpenAI / Gemini (configurable)  
- **Auth**: Supabase GoTrue (email, OAuth)  
- **Storage**: Supabase Storage for exports

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
   - As a user, I want to type and structure lyrics into sections (Verse, Chorus, Bridge) so I can organize my song.  
   - Acceptance: Section labels added/edited; content persists; diff highlighting active on changes.

5. **Manage Keywords & Metaphors**  
   - As a user, I want to add keywords and see related-word suggestions so I can enrich my language.  
   - Acceptance: Keyword panel shows used/unused; expand action generates relevant words; usage tracked.

6. **Configure Song Settings**  
   - As a user, I want to define POV, Boxes, rhyme scheme, prosody, genre, and artist emulation so AI aligns with my style.  
   - Acceptance: Settings form saves configs; changes versioned and auto-bookmarked.

7. **AI-Driven Iteration**  
   - As a user, I want to request AI edits for lines, sections, or full drafts so I can iterate creatively.  
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
