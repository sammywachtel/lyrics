# CLAUDE.md - Songwriting App Codebase Guide

This document provides a comprehensive guide for Claude instances working with the AI-assisted songwriting web application codebase.

## 🚨 CRITICAL FIXES ALERT

**MANDATORY: Review `CRITICAL_FIXES_DOCUMENTATION.md` before making ANY changes to:**
- Authentication system (`frontend/src/store/api/apiSlice.ts`)
- Lexical editor implementation (`frontend/src/components/CleanSongEditor.tsx`)
- API client patterns (`frontend/src/lib/api.ts`)

**These fixes resolve fundamental architectural issues. DO NOT REVERT without understanding the documented problems.**

## 📋 MASTER REQUIREMENTS DOCUMENT

**CRITICAL: Always consult `requirements.md` as the authoritative source for:**
- Complete feature specifications and implementation status
- Development priorities and critical warnings
- AI behavior constraints and philosophy
- Technical architecture decisions

**Requirements Document Maintenance:**
- **MANDATORY**: Update implementation status in requirements.md when completing features
- **MANDATORY**: Add new features to requirements.md before implementation
- **MANDATORY**: Mark drift warnings when deviating from specifications
- **MANDATORY**: Update development status from "❌ NOT YET IMPLEMENTED" to "🚧 IN PROGRESS" to "✅ COMPLETED"

The requirements.md file contains:
- ⚠️ Critical development drift warnings
- 🔴 High-priority missing features
- 🟡 Medium-priority implementation gaps
- ✅ Completed feature tracking
- Comprehensive AI constraints and behavior requirements

## 📚 DOCUMENTATION ARCHITECTURE

**Organized Documentation Structure:**
All supplementary documentation is now organized in the `docs/` directory for better maintainability:

- **`docs/design/specifications.md`** - Complete UI/UX design specifications and component details
- **`docs/deployment/docker.md`** - Local Docker development setup guide
- **`docs/deployment/cloud-run.md`** - Google Cloud Run deployment and CI/CD pipeline documentation
- **`docs/project/development-plan.md`** - Phased implementation roadmap and task breakdown
- **`docs/README.md`** - Navigation guide for all documentation

**Key Documentation Access:**
- **Design Requirements**: Always reference `docs/design/specifications.md` for UI/UX implementation details
- **Deployment Guide**: Use `docs/deployment/` for infrastructure and deployment procedures
- **Implementation Planning**: Check `docs/project/development-plan.md` for development phases and task priorities

## Project Overview

This is a full-stack web application for AI-assisted songwriting with the following architecture:

- **Frontend**: React 19 with TypeScript, Vite, and TailwindCSS
- **Backend**: Python FastAPI with Supabase integration
- **Database**: PostgreSQL via Supabase with Row-Level Security
- **Authentication**: Supabase GoTrue (email/password + OAuth)
- **Deployment**: Docker containers on Google Cloud Run
- **AI Integration**: Planned integration with OpenAI/Gemini APIs
- **Rich Text Editor**: Lexical-based WYSIWYG editor with structured section tagging

## Project Structure

```
/Users/samwachtel/PycharmProjects/lyrics/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── main.tsx            # Entry point
│   │   ├── components/         # React components
│   │   │   └── __tests__/      # Component test files
│   │   ├── utils/              # Utility functions
│   │   │   └── __tests__/      # Utility test files
│   │   ├── __mocks__/          # Jest mock files
│   │   ├── setupTests.ts       # Jest test setup
│   │   └── assets/             # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── jest.config.js          # Jest testing configuration
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # TailwindCSS configuration
│   └── tsconfig.json           # TypeScript configuration
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI application entry point
│   │   ├── config.py           # Application settings
│   │   └── __init__.py
│   └── requirements.txt        # Python dependencies
├── docs/                        # Organized documentation
│   ├── README.md               # Documentation navigation guide
│   ├── design/
│   │   └── specifications.md   # UI/UX design specifications
│   ├── deployment/
│   │   ├── docker.md           # Docker development guide
│   │   └── cloud-run.md        # Cloud Run deployment guide
│   └── project/
│       └── development-plan.md # Implementation roadmap
├── database-schema.sql          # Supabase PostgreSQL schema
├── docker-compose.yml           # Local development setup
├── Dockerfile.frontend          # Frontend Docker build
├── Dockerfile.backend           # Backend Docker build
├── nginx.conf                   # Nginx reverse proxy config
├── package.json                # Root package.json for scripts
├── CLAUDE.md                   # Comprehensive codebase guide (this file)
└── requirements.md              # Master requirements document
```

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Supabase account and project

### Environment Variables

Create `.env` files in the backend directory:

```bash
# backend/.env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_publishable_key_here
```

### Database Setup

1. **Supabase Project Setup**:
   - Create a new Supabase project
   - Run the SQL schema from `/Users/samwachtel/PycharmProjects/lyrics/database-schema.sql`
   - Configure Row-Level Security policies (already included in schema)

2. **Database Schema includes**:
   - `users` table (extends Supabase auth.users)
   - `songs` table for lyric storage
   - `test_records` table for infrastructure testing
   - RLS policies for data security
   - Automatic timestamp triggers

### Running the Development Environment

#### Method 1: Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

This starts:
- Frontend on http://localhost:80 (via nginx)
- Backend on http://localhost:8001
- API proxied through nginx at /api/

#### Method 2: Manual Development Setup

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Root scripts (alternative)
npm run dev  # Runs both frontend and backend concurrently
```

#### Method 3: Using Root Package Scripts

```bash
# Install backend dependencies
npm run backend:install

# Run development environment (both frontend and backend)
npm run dev

# Build frontend only
npm run build

# Start production backend
npm start
```

### Available Scripts

From project root (`/Users/samwachtel/PycharmProjects/lyrics/package.json`):

- `npm run dev` - Start both frontend and backend in development mode
- `npm run frontend:dev` - Start frontend development server only
- `npm run backend:dev` - Start backend development server only
- `npm run build` - Build frontend for production
- `npm run backend:install` - Install Python backend dependencies
- `npm start` - Start production backend server
- `npm test` - Run all frontend tests once (delegates to frontend)
- `npm run test:watch` - Run tests in watch mode (delegates to frontend)
- `npm run test:coverage` - Run tests with coverage report (delegates to frontend)

From frontend directory (`/Users/samwachtel/PycharmProjects/lyrics/frontend/`):

- `npm run dev` - Start Vite development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run all tests once (Jest directly)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage report

## Testing Framework and Structure

### Testing Philosophy

**CRITICAL: Testing is mandatory for all feature development and changes.** Always consider testing when:
- Implementing new features
- Modifying existing functionality
- Refactoring code
- Fixing bugs

Tests should be written as part of the development process, not as an afterthought, to prevent technical debt accumulation.

### Frontend Testing Stack

- **Jest 29.7.0** - JavaScript testing framework
- **React Testing Library 16.0.0** - Component testing utilities
- **Jest DOM 6.1.4** - Custom Jest matchers for DOM elements
- **User Event 14.5.1** - User interaction simulation
- **ts-jest 29.1.1** - TypeScript support for Jest

### Test Organization

**✅ REORGANIZED (2024): Tests now use a centralized structure** for better maintainability and organization.

**📖 Complete Documentation**: See `docs/testing/test-organization.md` for comprehensive details on test structure, patterns, and best practices.

```
/Users/samwachtel/PycharmProjects/lyrics/
├── frontend/tests/              # Frontend test suite (Jest + React Testing Library)
│   ├── unit/                   # Unit tests - organized by feature type
│   │   ├── components/         # Component unit tests
│   │   │   ├── *.test.tsx      # Main component tests
│   │   │   ├── editor/         # Editor component tests
│   │   │   └── lexical/        # Lexical editor component tests
│   │   ├── utils/              # Utility function tests
│   │   ├── hooks/              # React hook tests
│   │   ├── store/              # Redux store tests
│   │   ├── services/           # Service layer tests
│   │   └── contexts/           # React context tests
│   ├── integration/            # Integration tests
│   ├── fixtures/               # Test data and mock objects
│   ├── __mocks__/              # Jest mocks (Supabase, API, files)
│   └── utils/                  # Shared test utilities
│
├── backend/tests/              # Backend test suite (Pytest)
│   ├── unit/                   # Unit tests by module
│   ├── integration/            # Integration tests
│   ├── fixtures/               # Test data and fixtures
│   └── utils/                  # Test helpers
│
└── tests/e2e/                  # End-to-end tests (Playwright)
    ├── features/               # Feature-based E2E tests
    ├── fixtures/               # E2E test data
    ├── page-objects/           # Page object models
    └── utils/                  # E2E test utilities
```

**Key Improvements**:
- **Centralized structure** - No more scattered `__tests__/` directories
- **Consistent import paths** - All tests use absolute paths from `src/`
- **Better CI/CD integration** - Tests can be run by category (unit/integration/e2e)
- **Easier maintenance** - Predictable locations and patterns

### Test Configuration

**Jest Configuration** (`frontend/jest.config.js`):
- ESM module support for modern JavaScript
- TypeScript compilation with ts-jest
- jsdom environment for React component testing
- CSS and asset mocking
- Coverage reporting

**Test Setup** (`frontend/tests/utils/setupTests.ts`):
- Jest DOM matchers import
- Window object mocking (matchMedia, scrollTo, ResizeObserver)
- Global test utilities and configuration

### Running Tests

**From project root (recommended for consistency):**
```bash
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode (recommended for development)
npm run test:coverage      # Run tests with coverage report
```

**From frontend directory (for direct Jest access):**
```bash
cd frontend
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Run specific test file
npm test ComponentName.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"

# Run tests for specific component
npm test -- --testPathPattern="SectionToolbar"
```

### Test Types and Examples

#### 1. Utility Function Tests
Test pure functions with various inputs and edge cases:

```typescript
// Example: frontend/tests/unit/utils/sectionUtils.test.ts
import { parseSections } from '../../../src/utils/sectionUtils'

describe('parseSections', () => {
  it('should parse multiple sections correctly', () => {
    const lyrics = `[Verse 1]\nContent\n[Chorus]\nMore content`
    const sections = parseSections(lyrics)
    expect(sections).toHaveLength(2)
    expect(sections[0].name).toBe('Verse 1')
  })
})
```

#### 2. Component Tests
Test component rendering, user interactions, and prop handling:

```typescript
// Example: frontend/tests/unit/components/SectionToolbar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import SectionToolbar from '../../../src/components/SectionToolbar'

describe('SectionToolbar', () => {
  it('should call onInsertSection when button clicked', () => {
    const mockInsert = jest.fn()
    render(<SectionToolbar onInsertSection={mockInsert} />)

    fireEvent.click(screen.getByRole('button', { name: 'Verse 1' }))
    expect(mockInsert).toHaveBeenCalledWith('[Verse 1]')
  })
})
```

### Test Coverage Goals

- **Utility Functions**: 100% coverage for all pure functions
- **Components**: Test all user interactions, prop variations, and conditional rendering
- **Integration**: Test component interactions and data flow
- **Edge Cases**: Handle empty states, error conditions, and boundary values

### Current Test Status

**✅ REORGANIZATION COMPLETE**: 271 tests passing in centralized structure

**Test Suite Summary** (after reorganization):
- **Frontend Unit Tests**: 22 test suites with comprehensive coverage
  - ✅ `utils/*` - 4 test files (121 tests total) - Core utility functions
  - ✅ `components/*` - 16 test files - Component behavior and rendering
  - ✅ `hooks/*` - 1 test file - Custom React hooks
  - ✅ `store/*` - 2 test files - Redux state management (1 has ESM config issue)
- **Backend Tests**: Properly organized in `backend/tests/unit/` and `backend/tests/integration/`
- **E2E Tests**: Centralized in `tests/e2e/features/` with 2 feature test files

**Key Test Files**:
- ✅ `sectionUtils.test.ts` - 36 tests covering section parsing and manipulation
- ✅ `SectionToolbar.test.tsx` - 8 tests covering section insertion UI
- ✅ `FormattedTextPreview.test.tsx` - 14 tests covering text formatting display
- ✅ `prosodyAnalysis.test.ts` - Comprehensive prosody and rhyme analysis testing

### Testing Best Practices

1. **Write Tests First**: Consider test cases while implementing features
2. **Test Behavior, Not Implementation**: Focus on what the component does, not how
3. **Use Descriptive Names**: Test names should clearly describe the expected behavior
4. **Mock External Dependencies**: Use Jest mocks for APIs, external libraries
5. **Test Edge Cases**: Empty states, error conditions, boundary values
6. **Maintain Tests**: Update tests when changing functionality

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Debug specific test file
npm test -- --testPathPattern="ComponentName" --verbose

# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest ComponentName.test.tsx
```

## Technology Stack Details

### Frontend Stack

- **React 19.1.0** - Latest React with TypeScript
- **Vite 7.0.4** - Fast build tool and dev server
- **TailwindCSS 4.1.11** - Utility-first CSS framework
- **TypeScript** - Type safety and better developer experience

### Backend Stack

- **FastAPI 0.116.1** - Modern Python web framework (latest stable)
- **Uvicorn 0.35.0** - ASGI server for FastAPI
- **Pydantic 2.11.7** - Data validation and settings management
- **Pydantic Settings 2.10.1** - Environment-based configuration
- **Supabase Python Client 2.17.0** - Database and auth integration (latest)
- **HTTPX 0.28.1** - Async HTTP client for API calls
- **python-dotenv** - Environment variable management

### Infrastructure Stack

- **Supabase** - PostgreSQL database with built-in auth
- **Docker** - Containerization for consistent deployments
- **Nginx** - Reverse proxy and static file serving
- **Google Cloud Run** - Serverless container deployment

## Key Configuration Files

### Frontend Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/vite.config.ts`** - Vite build configuration
- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/tailwind.config.js`** - TailwindCSS customization
- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/tsconfig.json`** - TypeScript compiler options

### Backend Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/backend/app/config.py`** - Application settings using Pydantic Settings with modern SettingsConfigDict
- **`/Users/samwachtel/PycharmProjects/lyrics/backend/app/main.py`** - FastAPI app with CORS and Supabase client (updated for modern datetime handling)

### Docker Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/docker-compose.yml`** - Multi-service development environment
- **`/Users/samwachtel/PycharmProjects/lyrics/Dockerfile.frontend`** - Multi-stage build for React app
- **`/Users/samwachtel/PycharmProjects/lyrics/Dockerfile.backend`** - Python FastAPI container
- **`/Users/samwachtel/PycharmProjects/lyrics/nginx.conf`** - Reverse proxy configuration

## API Architecture

### Current API Endpoints

The backend currently provides basic infrastructure endpoints:

- `GET /` - Root endpoint with API information
- `GET /health` - Health check with database connectivity test
- `GET /api/test` - Test endpoint that writes to database

### Planned API Structure

Based on requirements.md, the full API will include:

- **Authentication**: `/auth/*` - Login, signup, OAuth
- **Users**: `/users/*` - Profile management
- **Songs**: `/songs/*` - CRUD operations for songs
- **Versions**: `/songs/{id}/versions/*` - Version control
- **AI**: `/ai/*` - AI-assisted editing and generation
- **Export**: `/songs/{id}/export/*` - Export songs in LLM-friendly formats
- **Billing**: `/billing/*` - Subscription management (future)

## Database Schema

The current schema (`/Users/samwachtel/PycharmProjects/lyrics/database-schema.sql`) includes:

- **users** table extending Supabase auth
- **songs** table for lyric storage with metadata JSONB field
- **Row-Level Security** policies for data isolation
- **Automatic timestamps** via triggers
- **Performance indexes** on common query patterns

## Deployment

### Docker Deployment

The application is designed for containerized deployment:

1. **Frontend Container**: Multi-stage build with nginx serving static files
2. **Backend Container**: Python FastAPI with uvicorn server
3. **Networking**: Docker compose creates shared network for service communication

### Google Cloud Run Deployment

The app is configured for Google Cloud Run deployment:

- Frontend and backend as separate services
- Environment variables for Supabase configuration
- Health check endpoints for container orchestration

## Development Workflow

### Standard Development Process

**CRITICAL: Always follow this testing workflow for any changes:**

1. **Consult Requirements**: Check `requirements.md` for specifications and current status
2. **Update Implementation Status**: Change status from "❌ NOT YET IMPLEMENTED" to "🚧 IN PROGRESS"
3. **Plan Implementation**: Consider test cases and edge scenarios during design
4. **Make Changes**: Edit files in appropriate directories
5. **Write/Update Tests**: Create or modify tests for your changes
6. **Run Unit Tests**: Execute `npm test` to ensure all tests pass
7. **Run E2E Tests**: Execute `npx playwright test` to verify end-to-end functionality
8. **Manual Testing**: Verify functionality in browser if needed
9. **Update Requirements**: Mark feature as "✅ COMPLETED" in requirements.md
10. **Code Review**: Check that tests cover the implemented functionality

**⚠️ MANDATORY: E2E testing must be run after every change to ensure no regressions are introduced.**

**Requirements Document Updates:**
- **Before starting**: Update status to "🚧 IN PROGRESS"
- **During development**: Add drift warnings if deviating from specifications
- **After completion**: Update to "✅ COMPLETED" with implementation notes
- **For new features**: Add complete specification to requirements.md first

### Making Changes

1. **Frontend Changes**: Edit files in `/Users/samwachtel/PycharmProjects/lyrics/frontend/src/`
   - **Always write tests** for new components in `__tests__/` folders
   - **Update existing tests** when modifying components
   - **Run `npm test`** before considering changes complete
2. **Backend Changes**: Edit files in `/Users/samwachtel/PycharmProjects/lyrics/backend/app/`
   - **Write unit tests** for new functionality (when backend testing is implemented)
   - **Test API endpoints** manually and with automated tests
3. **Database Changes**: Update schema in Supabase dashboard or via SQL migrations
4. **Docker Changes**: Modify Dockerfiles or docker-compose.yml as needed

### Testing Verification

**Before completing any development task:**

```bash
# Run unit tests (from project root)
npm test

# Run E2E tests (MANDATORY after any change)
npx playwright test --config=playwright.e2e.config.ts  # Run from project root

# Verify test coverage
npm run test:coverage

# Check manual functionality
npm run dev  # Test in browser

# OR run from frontend directory
cd frontend && npm test

# Verify test coverage
npm run test:coverage

# Check manual functionality
npm run dev  # Test in browser
```

### Environment Testing

- **Backend Health Check**: http://localhost:8001/health
- **Frontend Development**: http://localhost:5173 (Vite dev server)
- **Full Stack**: http://localhost:80 (Docker compose)
- **Test Suite**: `npm test` (must pass before any task completion)

## Current Implementation Status

### ✅ Implemented

- Basic FastAPI backend with Supabase integration
- React frontend with TypeScript and TailwindCSS
- Docker containerization for both services
- Database schema with RLS policies
- Development environment setup
- Health check endpoints
- **Comprehensive testing infrastructure** (Jest, React Testing Library, 46 tests)
- **Section tagging feature** with full test coverage
- Song CRUD operations with UI components

### 🚧 In Progress / Placeholder

- Frontend UI is currently the default Vite React template
- API endpoints are minimal (only health check and test endpoint)
- No authentication flow implemented yet
- No AI integration implemented yet

### 📋 Planned Features

Based on `/Users/samwachtel/PycharmProjects/lyrics/requirements.md`:

- User authentication and account management
- Song library with CRUD operations
- Rich-text lyrics editor with section tagging
- AI assistant integration for lyric generation
- Version control and diff highlighting
- Keyword and metaphor management
- Collaboration and sharing features
- Subscription and billing system

## 🚨 CRITICAL: Lexical Framework Anti-Patterns Guide

**MANDATORY READING**: This application uses Lexical.js as the rich text editor framework. Violating these patterns can cause editor corruption, data loss, and serious bugs that won't show up in linting but will break the application in production.

### **NEVER DO THESE (Critical Anti-Patterns)**

#### 1. **❌ NEVER Manipulate DOM Directly**
```typescript
// ❌ ABSOLUTELY FORBIDDEN - Breaks Lexical's reconciliation
element.classList.add('some-class')
element.scrollIntoView()
element.style.color = 'red'
element.innerHTML = 'text'

// ✅ CORRECT - Use Lexical commands and decorators
editor.dispatchCommand(SOME_COMMAND, payload)
// OR use decorators and data attributes with CSS
element.setAttribute('data-highlight', 'true')
```

#### 2. **❌ NEVER Access Private APIs**
```typescript
// ❌ FORBIDDEN - Private API usage
editor.getEditorState()._nodeMap.get(key)
editorState._nodeMap.size
node._parentKey

// ✅ CORRECT - Use public APIs only
editor.getEditorState().read(() => {
  const node = $getNodeByKey(key)
  const root = $getRoot()
  const children = root.getChildren()
})
```

#### 3. **❌ NEVER Create Race Conditions with Nested Updates**
```typescript
// ❌ DANGEROUS - Race conditions
editor.update(() => {
  // First update
}, { tag: 'update1' })

setTimeout(() => {
  editor.update(() => {
    // Second update - RACE CONDITION!
  }, { tag: 'update2' })
}, 100)

// ✅ CORRECT - Atomic updates
editor.update(() => {
  // Combine all operations in single update
  // All changes happen atomically
}, { tag: 'combined-update' })
```

#### 4. **❌ NEVER Store Plugin State Outside Lexical**
```typescript
// ❌ ANTI-PATTERN - Global state outside Lexical
let activePluginId: string | null = null

// ✅ CORRECT - Use Lexical's command system
const REGISTER_PLUGIN_COMMAND = createCommand<string>('REGISTER_PLUGIN')
// Handle state through commands and editor state
```

### **Required Patterns (Always Use These)**

#### 1. **✅ Always Use Read/Update Boundaries**
```typescript
// ✅ CORRECT - Read operations
editor.getEditorState().read(() => {
  const root = $getRoot()
  const selection = $getSelection()
  // Only read operations here
})

// ✅ CORRECT - Update operations
editor.update(() => {
  const root = $getRoot()
  // Modify editor state here
}, { tag: 'descriptive-tag' })
```

#### 2. **✅ Always Use Proper Node Creation**
```typescript
// ✅ CORRECT - Node creation with replacement
export function $createCustomNode(): CustomNode {
  const node = new CustomNode()
  return $applyNodeReplacement(node)
}
```

#### 3. **✅ Always Use Command System for Communication**
```typescript
// ✅ CORRECT - Plugin communication
const CUSTOM_COMMAND = createCommand<PayloadType>('CUSTOM_COMMAND')

// Register handler
editor.registerCommand(
  CUSTOM_COMMAND,
  (payload: PayloadType) => {
    // Handle command
    return false // Let other handlers process too
  },
  COMMAND_PRIORITY_LOW
)

// Dispatch command
editor.dispatchCommand(CUSTOM_COMMAND, payload)
```

#### 4. **✅ Always Handle Errors in Node Operations**
```typescript
// ✅ CORRECT - Safe node access
try {
  const node = $getNodeByKey(nodeKey)
  if (node && $isCustomNode(node)) {
    // Safe to use node
  }
} catch (error) {
  console.warn('Node no longer exists:', error)
  // Handle gracefully
}
```

#### 5. **✅ Always Use Type Guards**
```typescript
// ✅ CORRECT - Type safety
if ($isTextNode(node)) {
  // TypeScript knows node is TextNode
  const text = node.getTextContent()
}

if ($isElementNode(node)) {
  // TypeScript knows node is ElementNode
  const children = node.getChildren()
}
```

### **Plugin Development Rules**

1. **Use `useLexicalComposerContext()`** - Never store editor reference differently
2. **Cleanup in useEffect return** - Always remove listeners and clear timeouts
3. **Use tags for updates** - Always provide descriptive tags for `editor.update()`
4. **Avoid frequent updates** - Debounce/throttle user interactions
5. **Handle selection carefully** - Selection can be null or invalid

### **Node Development Rules**

1. **Override `updateDOM()` correctly** - Return boolean indicating if DOM update is needed
2. **Handle serialization** - Implement `exportJSON()` and `importJSON()` properly
3. **Use `getWritable()` for mutations** - Never mutate nodes directly
4. **Type node checks** - Always use `$isNodeType()` functions

### **Performance Guidelines**

1. **Batch DOM measurements** - Don't call `getBoundingClientRect()` in loops
2. **Use `React.memo`** - For expensive plugin components
3. **Debounce API calls** - Don't make requests on every keystroke
4. **Cache computed values** - Use `useMemo` for expensive calculations

### **Debugging Guidelines**

1. **Use descriptive tags** - `{ tag: 'stress-analysis-update' }`
2. **Log with NODE_ENV checks** - Only log in development
3. **Use Lexical DevTools** - Install browser extension for debugging
4. **Test with React StrictMode** - Catches many Lexical issues

### **Common Lexical Patterns**

```typescript
// Reading current selection
editor.getEditorState().read(() => {
  const selection = $getSelection()
  if ($isRangeSelection(selection)) {
    const selectedText = selection.getTextContent()
  }
})

// Creating custom nodes
const paragraph = $createParagraphNode()
const text = $createTextNode('Hello')
paragraph.append(text)
root.append(paragraph)

// Safe node replacement
const oldNode = existingNode
const newNode = $createCustomNode()
oldNode.replace(newNode)

// Plugin cleanup pattern
useEffect(() => {
  if (!enabled) return

  const removeListener = editor.registerCommand(COMMAND, handler, PRIORITY)

  return () => {
    removeListener()
    // Clear any other resources
  }
}, [editor, enabled])
```

**Remember: Lexical anti-patterns cause subtle bugs that are hard to debug and can corrupt user data. When in doubt, always prefer Lexical's built-in patterns over custom solutions.**

## Important Notes for Claude Instances

1. **Requirements Document is Master**: ALWAYS consult `requirements.md` before starting any work. It contains critical development warnings, AI constraints, and complete feature specifications.
2. **Update Requirements Continuously**: Mark implementation status changes in requirements.md throughout development. This prevents drift and ensures accurate project tracking.
3. **Testing is Mandatory**: Always write comprehensive tests for any new features, modifications, or bug fixes. Run `npm test` before considering any development task complete. Testing prevents technical debt and ensures code quality.
4. **AI Implementation Constraints**: Follow the critical AI behavior requirements in requirements.md - AI MUST NOT write entire lyrics or take over the writing process.
5. **Database Access**: Always use Supabase client through the FastAPI backend, never direct database connections
6. **Authentication**: Implement auth using Supabase GoTrue, not custom JWT handling
7. **Environment Variables**: All secrets should go in backend/.env, never commit these files
8. **CORS**: Already configured for development ports (3000, 5173), update for production
9. **API Design**: Follow REST conventions, use Pydantic models for request/response validation
10. **Frontend State**: Plan for Redux Toolkit or Zustand for state management as the app grows
11. **Mobile Support**: Design with responsive-first approach using TailwindCSS breakpoints
12. **Modern Python**: Code uses latest stable versions - datetime.now(timezone.utc) instead of datetime.utcnow(), SettingsConfigDict for Pydantic settings
13. **Supabase Keys**: Use publishable key (not legacy anon key) for SUPABASE_KEY environment variable
14. **Test-Driven Development**: When implementing new features, consider test cases during design phase and write tests alongside implementation, not as an afterthought

## Getting Help

- **Requirements**: See `/Users/samwachtel/PycharmProjects/lyrics/requirements.md` for comprehensive feature specifications
- **Frontend Docs**: React/Vite/TypeScript documentation
- **Backend Docs**: FastAPI documentation and Supabase Python client docs
- **Database**: Supabase PostgreSQL documentation for advanced queries
- **Deployment**: Docker and Google Cloud Run documentation

This codebase is set up for rapid development of a comprehensive AI-assisted songwriting application with proper separation of concerns, scalable architecture, and modern development practices.

## AI Integration Architecture

### Rich Text Editor Structure

The application uses **Lexical.js** as the rich text editor framework, which stores content in a structured JSON format that enables seamless AI integration:

#### Lexical Data Structure
```json
{
  "root": {
    "children": [
      {
        "children": [{"text": "Lyric line content", "type": "text"}],
        "type": "section-paragraph",
        "sectionType": "verse",  // Key identifier for AI processing
        "direction": "ltr",
        "format": "",
        "indent": 0
      }
    ]
  }
}
```

#### Section Type Identification
Songs are structured using `sectionType` fields that identify different parts:
- `"verse"` - Song verses
- `"chorus"` - Chorus/refrain sections
- `"bridge"` - Bridge sections
- `"hook"` - Hook/catchy phrases
- `"outro"` - Ending sections
- `"intro"` - Opening sections

### LLM Integration Strategy

#### Data Conversion for AI Processing
When sending content to LLMs for feedback, analysis, or generation, the Lexical JSON is converted to a structured text format:

```
[Verse]
Would you mind if I stayed over tonight?
Don't worry, I'm fine, just don't wanna be alone
No, I don't think there's anything wrong with me
But maybe I'm wrong

[Chorus]
What if there's no cure?
My fear erodes a fragile peace
That's what denial's for
It's a way to bring uneasy sleep

[Verse]
My eyes can't see enough to find their way back home
Faith is blind, it wants to see me through
```

#### Conversion Process
1. **Extract Text Content**: Parse Lexical JSON to extract text from nested text nodes
2. **Group by Section**: Consecutive paragraphs with the same `sectionType` are grouped together
3. **Apply Section Labels**: Convert `sectionType` values to readable labels (e.g., `"verse"` → `[Verse]`)
4. **Preserve Order**: Maintain the original sequence of sections and lines
5. **Add Context**: Include section numbering logic for repeated sections (Verse 1, Verse 2, etc.)

#### Implementation Requirements
- **Section Grouping Function**: Utility to group consecutive paragraphs by `sectionType`
- **Text Extraction**: Function to extract plain text from Lexical text nodes
- **Format Conversion**: Transform structured sections into LLM-friendly format
- **Reverse Conversion**: Parse LLM responses back into Lexical structure (for AI suggestions)

#### AI Response Processing
When receiving responses from LLMs:
1. **Parse Section Headers**: Identify `[Verse]`, `[Chorus]` patterns
2. **Map to sectionType**: Convert labels back to internal `sectionType` values
3. **Create Lexical Nodes**: Generate appropriate section-paragraph nodes
4. **Preserve Formatting**: Maintain line breaks and text structure

This architecture ensures that AI interactions maintain the song's structural integrity while providing clear context for meaningful feedback and suggestions.

## Architecture & Scalability Assessment

### Current Architecture Score: 8.5/10 (Production-Ready)

**Status**: The application has an excellent architectural foundation with modern best practices and scalability-ready infrastructure.

#### ✅ **Architectural Strengths**
- **Modern Tech Stack**: React 19 + FastAPI + PostgreSQL with comprehensive testing (46 tests)
- **Security-First**: Row-Level Security, JWT auth, vulnerability scanning in CI/CD
- **Scalable Infrastructure**: Cloud Run auto-scaling (0-10 instances), Docker containerization
- **Database Excellence**: Optimized JSONB indexing, automatic version control, performance indexes

#### 🎯 **Priority Scalability Recommendations**

##### Immediate (High Impact - 1-2 weeks):
1. **Global State Management**: Implement Redux Toolkit + RTK Query for centralized state and API caching
2. **API Response Caching**: Add React Query/TanStack Query (60-80% reduction in API calls)
3. **Database Connection Optimization**: Configure pgBouncer for high-load scenarios

##### Medium-Term (2-3 weeks):
4. **Background Job Processing**: Implement Celery + Redis for AI operations
5. **Frontend Code Splitting**: Route-based lazy loading to reduce bundle size
6. **Performance Monitoring**: Add OpenTelemetry + Cloud Monitoring

#### 📊 **Scalability Projections**
- **Current**: ~1,000 concurrent users, ~10,000 RPM
- **With Improvements**: ~10,000 concurrent users, ~100,000 RPM, <200ms response time

For detailed analysis and implementation guidance, see `docs/architecture/scalability-review.md`.

## Getting Help

- **Requirements**: See `requirements.md` for comprehensive feature specifications and implementation status
- **Architecture Review**: Check `docs/architecture/scalability-review.md` for detailed scalability analysis and recommendations
- **Design Guidelines**: Reference `docs/design/specifications.md` for UI/UX implementation details
- **Development Planning**: Check `docs/project/development-plan.md` for phased implementation roadmap
- **Deployment Setup**: Use `docs/deployment/docker.md` for local development or `docs/deployment/cloud-run.md` for production deployment
- **Documentation Navigation**: Start with `docs/README.md` for organized access to all project documentation
- **Frontend Docs**: React/Vite/TypeScript documentation
- **Backend Docs**: FastAPI documentation and Supabase Python client docs
- **Database**: Supabase PostgreSQL documentation for advanced queries
- **Infrastructure**: Docker and Google Cloud Run documentation

This codebase is set up for rapid development of a comprehensive AI-assisted songwriting application with proper separation of concerns, scalable architecture, and modern development practices. The architecture review shows excellent scalability potential with targeted improvements.
