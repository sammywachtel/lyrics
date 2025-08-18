# Test Organization Guide

This document provides comprehensive guidelines for organizing tests in the songwriting application, covering directory structure, test types, naming conventions, and best practices.

## Overview

The test suite is organized using a **centralized approach** where tests are grouped by type and layer, making them easier to find, maintain, and execute. This organization supports:

- **Clear separation** between unit, integration, and E2E tests
- **Consistent import paths** and module resolution
- **Efficient CI/CD execution** with targeted test running
- **Easy navigation** for developers working on specific features

## Directory Structure

```
/Users/samwachtel/PycharmProjects/lyrics/
│
├── frontend/tests/                 # Frontend test suite (Jest + React Testing Library)
│   ├── unit/                      # Unit tests - test individual components/functions in isolation
│   │   ├── components/            # Component unit tests
│   │   │   ├── *.test.tsx         # Main component tests (SectionToolbar.test.tsx)
│   │   │   ├── editor/            # Editor-specific component tests
│   │   │   │   └── *.test.tsx     # (ProsodyIndicators.test.tsx, SectionSidebar.test.tsx)
│   │   │   └── lexical/           # Lexical editor component tests
│   │   │       ├── *.test.tsx     # (SectionFormattingCommands.test.tsx)
│   │   │       └── ...            # Organized by lexical feature
│   │   ├── utils/                 # Utility function tests
│   │   │   └── *.test.ts          # (sectionUtils.test.ts, prosodyAnalysis.test.ts)
│   │   ├── hooks/                 # React hook tests
│   │   │   └── *.test.ts          # (usePanelState.test.ts, useProsodyAnalysis.test.ts)
│   │   ├── store/                 # Redux store tests
│   │   │   └── *.test.ts          # (songsSlice.test.ts, apiSlice.test.ts)
│   │   ├── services/              # Service layer tests
│   │   ├── contexts/              # React context tests
│   │   └── lib/                   # Library/API wrapper tests
│   │
│   ├── integration/               # Integration tests - test component interactions
│   │   ├── api/                   # API integration tests
│   │   ├── editor/                # Editor integration tests
│   │   ├── auth/                  # Authentication flow tests
│   │   └── workflows/             # Multi-component workflow tests
│   │
│   ├── fixtures/                  # Test data and mock objects
│   ├── __mocks__/                 # Jest mocks (Supabase, API, files)
│   │   ├── api.ts                # API client mocks
│   │   ├── supabase.ts           # Supabase client mocks
│   │   └── fileMock.js           # Static asset mocks
│   │
│   └── utils/                     # Shared test utilities and helpers
│       ├── setupTests.ts          # Global test setup configuration
│       ├── test-utils.tsx         # React Testing Library utilities
│       ├── test-helpers.ts        # General test helper functions
│       └── componentTestUtils.ts  # Component-specific test utilities
│
├── backend/tests/                 # Backend test suite (Pytest)
│   ├── unit/                     # Unit tests - test individual functions/classes
│   │   ├── api/                  # API endpoint unit tests
│   │   ├── auth/                 # Authentication unit tests
│   │   ├── models/               # Data model tests
│   │   ├── services/             # Service layer tests
│   │   ├── utils/                # Utility function tests
│   │   ├── test_main.py          # Main application tests
│   │   └── test_config.py        # Configuration tests
│   │
│   ├── integration/              # Integration tests - test component interactions
│   │   ├── database/             # Database integration tests
│   │   ├── auth/                 # Authentication integration tests
│   │   └── api_endpoints/        # Full API endpoint tests
│   │
│   ├── fixtures/                 # Test data and pytest fixtures
│   │   └── __init__.py
│   │
│   └── utils/                    # Shared test utilities and helpers
│       ├── test_helpers.py       # Python test helper functions
│       └── __init__.py
│
└── tests/e2e/                    # End-to-end tests (Playwright) - Full-stack workflows
    ├── features/                 # Feature-based E2E tests
    │   ├── core-functionality.spec.ts     # Basic app functionality
    │   ├── redux-integration.spec.ts      # Redux state management
    │   └── song-creation.spec.ts          # Complete song creation flow
    │
    ├── fixtures/                 # E2E test data
    ├── page-objects/             # Page object models for reusable interactions
    ├── utils/                    # E2E test utilities
    │   └── auth-helpers.ts       # Authentication helpers for E2E tests
    │
    └── README.md                 # E2E testing setup guide
```

## Test Types and Purpose

### 1. Unit Tests (`frontend/tests/unit/`, `backend/tests/unit/`)

**Purpose**: Test individual functions, components, or classes in complete isolation.

**Characteristics**:
- **Fast execution** (< 100ms each)
- **No external dependencies** (database, network, file system)
- **Focused scope** - test one specific behavior
- **Predictable results** - same inputs always produce same outputs

**Examples**:
- Testing a utility function like `parseSections()` with various input formats
- Testing a React component's rendering with different props
- Testing a Redux slice's action creators and reducers
- Testing a Python service class method with mocked dependencies

### 2. Integration Tests (`frontend/tests/integration/`, `backend/tests/integration/`)

**Purpose**: Test how components work together and interact with external systems.

**Characteristics**:
- **Moderate execution time** (< 1s each)
- **Limited real dependencies** (may use test database, real APIs in test mode)
- **Multi-component scope** - test interactions between components
- **Realistic scenarios** - test actual usage patterns

**Examples**:
- Testing how Redux store updates when API calls succeed/fail
- Testing how Lexical editor plugins work together
- Testing API endpoints with real database transactions
- Testing authentication flows with real auth providers

### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete user workflows from browser to backend.

**Characteristics**:
- **Slower execution** (< 30s each)
- **Full system dependencies** - real frontend, backend, database
- **User-focused scope** - test complete user journeys
- **Production-like environment** - test realistic deployment scenarios

**Examples**:
- User signs up, creates a song, edits lyrics, and saves
- User searches for songs and navigates between different pages
- User collaborates on a song with another user
- Admin manages user accounts and monitors system health

## Naming Conventions

### Test Files
- **Unit/Integration Tests**: `{ComponentName}.test.{ts|tsx}` or `{functionName}.test.{ts|tsx}`
- **E2E Tests**: `{feature-name}.spec.ts`

### Test Cases
Use descriptive names that explain the expected behavior:

```typescript
// ✅ Good - describes expected behavior and conditions
describe('SectionToolbar', () => {
  it('should call onInsertSection when section button is clicked', () => {
    // Test implementation
  })

  it('should display quick insert buttons for common sections', () => {
    // Test implementation
  })

  it('should show sections navigation when existing sections are present', () => {
    // Test implementation
  })
})

// ❌ Bad - vague or implementation-focused
describe('SectionToolbar', () => {
  it('should work', () => {}) // Too vague
  it('should call function', () => {}) // Which function? When?
  it('should render DOM elements', () => {}) // Implementation detail
})
```

### Test Structure Patterns
Follow the **Arrange-Act-Assert (AAA)** pattern:

```typescript
it('should update song title when input changes', async () => {
  // Arrange - Set up test data and conditions
  const mockSong = { id: 1, title: 'Original Title', content: 'Lyrics...' }
  const mockOnUpdate = jest.fn()
  render(<SongEditor song={mockSong} onUpdate={mockOnUpdate} />)

  // Act - Perform the action being tested
  const titleInput = screen.getByLabelText('Song Title')
  await userEvent.type(titleInput, 'New Title')

  // Assert - Verify the expected outcome
  expect(mockOnUpdate).toHaveBeenCalledWith({
    ...mockSong,
    title: 'New Title'
  })
})
```

## Import Path Standards

### Centralized Test Structure Import Patterns

With the centralized test organization, all imports use **absolute paths from the project source**:

```typescript
// ✅ Correct import patterns for centralized tests

// From frontend/tests/unit/components/*.test.tsx
import ComponentName from '../../../src/components/ComponentName'
import { utilityFunction } from '../../../src/utils/utilityName'
import type { TypeName } from '../../../src/types/TypeName'

// From frontend/tests/unit/components/editor/*.test.tsx
import EditorComponent from '../../../../src/components/editor/EditorComponent'

// From frontend/tests/unit/components/lexical/*.test.tsx
import { LexicalNode } from '../../../../src/components/lexical/nodes/NodeName'
import { LexicalCommand } from '../../../../src/components/lexical/commands/CommandName'

// From frontend/tests/unit/utils/*.test.ts
import { functionToTest } from '../../../src/utils/fileName'

// Test utilities and helpers
import { createTestEditor } from '../../utils/testUtils'  // Shared test utilities
import { mockApiClient } from '../../__mocks__/api'       // Test mocks
```

### Mock Import Patterns

```typescript
// Mock external dependencies with correct paths
jest.mock('../../../src/lib/api', () => ({
  apiClient: {
    getSong: jest.fn(),
    updateSong: jest.fn()
  }
}))

// Mock Supabase
jest.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn()
    }))
  }
}))
```

## Test Execution Commands

### Frontend Tests (Jest)
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm test -- --testPathPattern="unit/utils"        # Utils tests only
npm test -- --testPathPattern="unit/components"   # Component tests only
npm test -- --testPathPattern="integration"       # Integration tests only

# Run specific test files
npm test -- SectionToolbar                        # Specific component
npm test -- sectionUtils                          # Specific utility

# Run tests matching a pattern
npm test -- --testNamePattern="should render"     # Tests with specific names

# Debug specific test
npm test -- --testPathPattern="SectionToolbar" --verbose
```

### Backend Tests (Pytest)
```bash
# Navigate to backend directory
cd backend

# Run all backend tests
pytest

# Run specific test categories
pytest tests/unit                    # Unit tests only
pytest tests/integration             # Integration tests only

# Run with coverage
pytest --cov=app                     # Coverage report
pytest --cov=app --cov-report=html   # HTML coverage report

# Run specific test files
pytest tests/unit/test_songs.py      # Specific module tests
pytest tests/integration/database/   # Database integration tests

# Run tests with markers
pytest -m "not slow"                 # Skip slow tests
pytest -m integration                # Run only integration tests

# Verbose output
pytest -v tests/unit/test_songs.py   # Detailed test output
```

### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
npx playwright test

# Run specific test files
npx playwright test core-functionality.spec.ts
npx playwright test redux-integration.spec.ts

# Interactive UI mode
npx playwright test --ui             # Visual test runner

# Debug mode
npx playwright test --debug          # Step-by-step debugging

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

## When to Write Each Type of Test

### Write Unit Tests When:
- ✅ Testing pure functions with clear inputs/outputs
- ✅ Testing component rendering with different props
- ✅ Testing Redux action creators and reducers
- ✅ Testing utility functions and helper methods
- ✅ Testing error handling and edge cases
- ✅ Testing validation logic and business rules

### Write Integration Tests When:
- ✅ Testing API endpoints with database operations
- ✅ Testing authentication and authorization flows
- ✅ Testing React components with Redux state
- ✅ Testing Lexical editor with multiple plugins
- ✅ Testing file upload/download functionality
- ✅ Testing real-time features (WebSocket connections)

### Write E2E Tests When:
- ✅ Testing critical user workflows (sign up, create song, save)
- ✅ Testing cross-browser compatibility
- ✅ Testing responsive design across devices
- ✅ Testing complete feature flows (search → view → edit → save)
- ✅ Testing error scenarios users might encounter
- ✅ Testing accessibility features

## Test Data and Fixtures

### Frontend Test Data

**Location**: `frontend/tests/fixtures/`

Create reusable test data for consistent testing:

```typescript
// fixtures/songs.ts
export const mockSongs = {
  basic: {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    content: '[Verse 1]\nTest lyrics here\n\n[Chorus]\nTest chorus',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },

  empty: {
    id: 2,
    title: '',
    artist: '',
    content: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },

  complex: {
    id: 3,
    title: 'Complex Song Structure',
    artist: 'Advanced Artist',
    content: `[Intro]
Instrumental opening

[Verse 1]
First verse lyrics here
With multiple lines

[Pre-Chorus]
Building up the energy

[Chorus]
Main hook goes here
Repeating theme

[Verse 2]
Second verse content

[Bridge]
Different melody and feel

[Outro]
Fade out ending`,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
}

// fixtures/users.ts
export const mockUsers = {
  standard: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
  },

  admin: {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin'
  }
}
```

### Backend Test Data

**Location**: `backend/tests/fixtures/`

Use pytest fixtures for database and API testing:

```python
# fixtures/__init__.py
import pytest
from datetime import datetime, timezone
from app.models import Song, User

@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    return User(
        id="user-123",
        email="test@example.com",
        name="Test User",
        created_at=datetime.now(timezone.utc)
    )

@pytest.fixture
def mock_song(mock_user):
    """Create a mock song for testing."""
    return Song(
        id=1,
        title="Test Song",
        artist="Test Artist",
        content="[Verse 1]\nTest lyrics\n\n[Chorus]\nTest chorus",
        user_id=mock_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

@pytest.fixture
def api_client():
    """Create a test API client."""
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
```

### E2E Test Data

**Location**: `tests/e2e/fixtures/`

Create realistic test scenarios:

```typescript
// fixtures/testData.ts
export const e2eTestData = {
  users: {
    testUser: {
      email: 'sa_tester@example.com',
      password: process.env.TEST_PASSWORD || 'secure_test_password_123'
    }
  },

  songs: {
    simpleSong: {
      title: 'E2E Test Song',
      artist: 'Playwright Tester',
      content: '[Verse 1]\nThis is an E2E test\nTo verify song creation\n\n[Chorus]\nEverything works as expected'
    }
  }
}
```

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   ```typescript
   // ✅ Good - tests the behavior
   it('should update song title when user types in title field', () => {
     // Test focuses on user interaction and result
   })

   // ❌ Bad - tests implementation details
   it('should call setState with new title value', () => {
     // Test focuses on internal React implementation
   })
   ```

2. **One Assertion Per Test (When Possible)**
   ```typescript
   // ✅ Good - focused single assertion
   it('should display error message when title is empty', () => {
     render(<SongForm title="" onSave={mockSave} />)
     expect(screen.getByText('Title is required')).toBeInTheDocument()
   })

   it('should disable save button when title is empty', () => {
     render(<SongForm title="" onSave={mockSave} />)
     expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
   })
   ```

3. **Descriptive Test Names**
   ```typescript
   // ✅ Good - clearly describes expected behavior and conditions
   describe('SectionToolbar', () => {
     describe('when no existing sections are present', () => {
       it('should not display sections navigation button', () => {})
     })

     describe('when existing sections are present', () => {
       it('should display sections navigation button', () => {})
       it('should open section navigation when button is clicked', () => {})
     })
   })
   ```

### Frontend Testing Best Practices

1. **Use Semantic Queries**
   ```typescript
   // ✅ Good - semantic and accessible
   screen.getByRole('button', { name: 'Save Song' })
   screen.getByLabelText('Song Title')
   screen.getByText('Welcome to Song Editor')

   // ❌ Bad - brittle and not semantic
   screen.getByTestId('save-btn-123')
   screen.getByClassName('title-input')
   ```

2. **Mock External Dependencies**
   ```typescript
   // Mock API calls
   jest.mock('../../../src/lib/api', () => ({
     apiClient: {
       getSongs: jest.fn(() => Promise.resolve(mockSongs)),
       saveSong: jest.fn(() => Promise.resolve({ success: true }))
     }
   }))

   // Mock complex components in unit tests
   jest.mock('../../../src/components/LexicalEditor', () => {
     return function MockLexicalEditor({ onChange }: any) {
       return (
         <textarea
           data-testid="mock-lexical-editor"
           onChange={(e) => onChange(e.target.value)}
         />
       )
     }
   })
   ```

3. **Test User Interactions**
   ```typescript
   import userEvent from '@testing-library/user-event'

   it('should save song when user clicks save button', async () => {
     const user = userEvent.setup()
     const mockSave = jest.fn()

     render(<SongEditor onSave={mockSave} />)

     // Simulate real user interactions
     await user.type(screen.getByLabelText('Title'), 'New Song')
     await user.click(screen.getByRole('button', { name: 'Save' }))

     expect(mockSave).toHaveBeenCalledWith({
       title: 'New Song'
     })
   })
   ```

### Backend Testing Best Practices

1. **Use Fixtures for Setup**
   ```python
   def test_create_song(api_client, mock_user):
       """Test song creation endpoint."""
       song_data = {
           "title": "Test Song",
           "artist": "Test Artist",
           "content": "Test lyrics"
       }

       response = api_client.post(
           "/api/songs",
           json=song_data,
           headers={"Authorization": f"Bearer {mock_user.token}"}
       )

       assert response.status_code == 201
       assert response.json()["title"] == song_data["title"]
   ```

2. **Test Error Conditions**
   ```python
   def test_create_song_unauthorized(api_client):
       """Test song creation without authentication."""
       song_data = {"title": "Test Song"}

       response = api_client.post("/api/songs", json=song_data)

       assert response.status_code == 401
       assert "authentication required" in response.json()["detail"].lower()
   ```

3. **Test Data Validation**
   ```python
   @pytest.mark.parametrize("invalid_data,expected_error", [
       ({"title": ""}, "title cannot be empty"),
       ({"title": "x" * 1000}, "title too long"),
       ({"artist": None}, "artist is required"),
   ])
   def test_song_validation(api_client, mock_user, invalid_data, expected_error):
       """Test song data validation."""
       response = api_client.post(
           "/api/songs",
           json=invalid_data,
           headers={"Authorization": f"Bearer {mock_user.token}"}
       )

       assert response.status_code == 422
       assert expected_error in str(response.json())
   ```

### E2E Testing Best Practices

1. **Use Page Object Models**
   ```typescript
   // page-objects/SongEditorPage.ts
   export class SongEditorPage {
     constructor(private page: Page) {}

     async navigateToEditor(songId?: string) {
       const url = songId ? `/songs/${songId}/edit` : '/songs/new'
       await this.page.goto(url)
     }

     async fillTitle(title: string) {
       await this.page.getByLabel('Song Title').fill(title)
     }

     async fillLyrics(lyrics: string) {
       await this.page.getByLabel('Lyrics').fill(lyrics)
     }

     async save() {
       await this.page.getByRole('button', { name: 'Save Song' }).click()
     }

     async expectSaveSuccess() {
       await expect(this.page.getByText('Song saved successfully')).toBeVisible()
     }
   }
   ```

2. **Keep Tests Independent**
   ```typescript
   import { test, expect } from '@playwright/test'
   import { SongEditorPage } from '../page-objects/SongEditorPage'

   test.beforeEach(async ({ page }) => {
     // Each test starts with a clean state
     await signInWithTestAccount(page)
   })

   test('should create and save new song', async ({ page }) => {
     const editor = new SongEditorPage(page)

     await editor.navigateToEditor()
     await editor.fillTitle('Test Song')
     await editor.fillLyrics('[Verse 1]\nTest lyrics')
     await editor.save()

     await editor.expectSaveSuccess()
   })
   ```

3. **Test Critical User Paths**
   ```typescript
   test('complete song creation workflow', async ({ page }) => {
     // Test the full user journey
     await signInWithTestAccount(page)

     // Navigate to create song
     await page.getByRole('link', { name: 'New Song' }).click()

     // Fill in song details
     await page.getByLabel('Title').fill('Complete Workflow Test')
     await page.getByLabel('Artist').fill('E2E Tester')

     // Add lyrics with sections
     await page.getByLabel('Lyrics').fill(`
       [Verse 1]
       This is a complete test
       Of the song creation flow

       [Chorus]
       Everything should work
       From start to finish now
     `)

     // Save the song
     await page.getByRole('button', { name: 'Save Song' }).click()
     await expect(page.getByText('Song saved successfully')).toBeVisible()

     // Navigate back to song list
     await page.getByRole('link', { name: 'My Songs' }).click()

     // Verify song appears in list
     await expect(page.getByText('Complete Workflow Test')).toBeVisible()
   })
   ```

## Performance and Reliability

### Test Performance Guidelines

- **Unit Tests**: < 100ms each (total suite should run in < 30 seconds)
- **Integration Tests**: < 1s each (total suite should run in < 5 minutes)
- **E2E Tests**: < 30s each (total suite should run in < 15 minutes)

### Reliability Best Practices

1. **Avoid Test Flakiness**
   ```typescript
   // ✅ Good - wait for elements properly
   await waitFor(() => {
     expect(screen.getByText('Loading complete')).toBeInTheDocument()
   })

   // ❌ Bad - timing-dependent
   setTimeout(() => {
     expect(screen.getByText('Loading complete')).toBeInTheDocument()
   }, 1000)
   ```

2. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks()
     cleanup() // React Testing Library cleanup
   })

   beforeEach(() => {
     // Reset any global state
     localStorage.clear()
     sessionStorage.clear()
   })
   ```

3. **Use Stable Selectors**
   ```typescript
   // ✅ Good - stable, semantic selectors
   screen.getByRole('button', { name: 'Save Song' })
   screen.getByLabelText('Song Title')

   // ❌ Bad - brittle selectors
   screen.getByClassName('btn-primary-123')
   page.locator('#save-btn-dynamic-id')
   ```

## Troubleshooting Common Issues

### Import Resolution Problems

```typescript
// Problem: "Cannot find module" errors after test reorganization
// Solution: Update import paths to use absolute paths from src

// ❌ Old scattered approach
import { sectionUtils } from '../sectionUtils'

// ✅ New centralized approach
import { sectionUtils } from '../../../src/utils/sectionUtils'
```

### Mock Configuration Issues

```typescript
// Problem: Mocks not working properly
// Solution: Ensure mock paths match import paths exactly

// If your component imports:
import { apiClient } from '../../../src/lib/api'

// Your mock should be:
jest.mock('../../../src/lib/api', () => ({
  apiClient: {
    // mock implementation
  }
}))
```

### ESM Module Issues

```javascript
// Problem: "Cannot use import statement outside a module"
// Solution: Update Jest config for ESM support

// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase)/)'  // Transform specific ESM modules
  ]
}
```

### Test Environment Issues

```typescript
// Problem: Tests fail due to missing browser APIs
// Solution: Add proper mocks in setupTests.ts

// setupTests.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
})
```

## Migration Notes

### From Scattered to Centralized Tests

When migrating from scattered `__tests__/` directories to centralized structure:

1. **Move test files** to appropriate centralized locations
2. **Update import paths** to use absolute paths from `src/`
3. **Update Jest configuration** to find tests in new locations
4. **Fix mock paths** to match new import structure
5. **Remove empty `__tests__/` directories**
6. **Run full test suite** to verify everything works

### Breaking Changes

- **Import paths changed**: All relative imports now use absolute paths from `src/`
- **Test file locations changed**: Tests moved from scattered to centralized directories
- **Mock paths changed**: Mock configurations updated to match new import paths

## Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Run different test types separately
      - name: Install dependencies
        run: npm install
        working-directory: ./frontend

      - name: Run unit tests
        run: npm test -- --testPathPattern="unit" --coverage
        working-directory: ./frontend

      - name: Run integration tests
        run: npm test -- --testPathPattern="integration"
        working-directory: ./frontend

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt
        working-directory: ./backend

      - name: Run unit tests
        run: pytest tests/unit --cov=app
        working-directory: ./backend

      - name: Run integration tests
        run: pytest tests/integration
        working-directory: ./backend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [frontend-tests, backend-tests]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright
        run: npx playwright install

      - name: Run E2E tests
        run: npx playwright test
```

## Summary

This reorganized test structure provides:

- **✅ Clear organization** - Tests are easy to find and maintain
- **✅ Consistent patterns** - All tests follow the same import and structure patterns
- **✅ Efficient execution** - Tests can be run by type or scope as needed
- **✅ Better CI/CD integration** - Test categories can be run independently
- **✅ Improved developer experience** - Predictable locations and patterns

The centralized approach eliminates the confusion of scattered test directories and provides a solid foundation for scaling the test suite as the application grows.
