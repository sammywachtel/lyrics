# Testing Framework and Standards

This document outlines the comprehensive testing strategy and standards for the songwriting application.

## 📋 Quick Start

For complete details on test organization, directory structure, and best practices, see:
**[📖 Test Organization Guide](./test-organization.md)** - Comprehensive guide covering all aspects of test structure and conventions.

## Overview

Our testing approach follows a **centralized three-tier strategy** that has been fully reorganized for better maintainability:

- **Unit Tests**: Test individual functions, components, and modules in `frontend/tests/unit/` and `backend/tests/unit/`
- **Integration Tests**: Test component interactions and API integrations in `frontend/tests/integration/` and `backend/tests/integration/`
- **End-to-End Tests**: Test complete user workflows in centralized `tests/e2e/` directory

## Recent Reorganization (2024)

**✅ Test structure has been completely reorganized** from scattered `__tests__/` directories to a centralized approach:

- **Before**: Tests scattered throughout `frontend/src/components/__tests__/`, `frontend/src/utils/__tests__/`, etc.
- **After**: All tests centralized in `frontend/tests/`, `backend/tests/`, and `tests/e2e/`
- **Benefits**: Better organization, consistent import paths, easier CI/CD integration, improved maintainability

See [Test Organization Guide](./test-organization.md) for complete migration details and new patterns.

## Directory Structure

```
/Users/samwachtel/PycharmProjects/lyrics/
├── frontend/tests/              # Frontend test suite (Jest + React Testing Library)
│   ├── unit/                   # Unit tests organized by feature
│   │   ├── components/         # Component unit tests
│   │   │   ├── lexical/        # Lexical editor component tests
│   │   │   ├── editor/         # Editor component tests
│   │   │   ├── layout/         # Layout component tests
│   │   │   └── ...             # Other component categories
│   │   ├── utils/              # Utility function tests
│   │   ├── hooks/              # React hook tests
│   │   ├── store/              # Redux store tests
│   │   ├── services/           # Service layer tests
│   │   └── contexts/           # React context tests
│   ├── integration/            # Integration tests
│   │   ├── api/                # API integration tests
│   │   ├── editor/             # Editor integration tests
│   │   └── auth/               # Authentication flow tests
│   ├── fixtures/               # Test data and fixtures
│   ├── __mocks__/              # Jest mocks (Supabase, API, files)
│   └── utils/                  # Shared test utilities and helpers
│
├── backend/tests/              # Backend test suite (Pytest)
│   ├── unit/                   # Unit tests organized by module
│   │   ├── api/                # API endpoint unit tests
│   │   ├── auth/               # Authentication unit tests
│   │   ├── models/             # Data model tests
│   │   ├── services/           # Service layer tests
│   │   └── utils/              # Utility function tests
│   ├── integration/            # Integration tests
│   │   ├── database/           # Database integration tests
│   │   ├── auth/               # Authentication integration tests
│   │   └── api_endpoints/      # Full API endpoint tests
│   ├── fixtures/               # Test data and pytest fixtures
│   └── utils/                  # Shared test utilities and helpers
│
└── tests/e2e/                  # End-to-end tests (Playwright)
    ├── features/               # Feature-based E2E tests
    ├── fixtures/               # E2E test data
    ├── utils/                  # E2E test utilities
    └── page-objects/           # Page object models
```

## Test Types and Conventions

### Unit Tests

**Purpose**: Test individual functions, components, or modules in isolation.

**Naming Convention**:
- **Files**: `ComponentName.test.tsx` or `functionName.test.ts`
- **Test Cases**: `should [expected behavior] when [condition]`

**Example**:
```typescript
// frontend/tests/unit/components/SectionToolbar.test.tsx
describe('SectionToolbar', () => {
  it('should render all section buttons', () => {
    // Test implementation
  });

  it('should call onInsertSection when button clicked', () => {
    // Test implementation
  });
});
```

### Integration Tests

**Purpose**: Test interactions between components, modules, or external services.

**Naming Convention**:
- **Files**: `FeatureName.integration.test.tsx` or `ServiceName.integration.test.ts`
- **Test Cases**: `should [integrate behavior] between [components/services]`

**Example**:
```typescript
// frontend/tests/integration/api/SongApi.integration.test.tsx
describe('Song API Integration', () => {
  it('should create song and update UI state', () => {
    // Test implementation
  });
});
```

### End-to-End Tests

**Purpose**: Test complete user workflows from browser to backend.

**Naming Convention**:
- **Files**: `feature-name.spec.ts`
- **Test Cases**: `should complete [user workflow]`

**Example**:
```typescript
// tests/e2e/features/song-creation.spec.ts
test('should complete song creation workflow', async ({ page }) => {
  // Test implementation
});
```

## Test Execution Commands

### Frontend Tests (Jest)
```bash
# Run all frontend tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- SectionToolbar

# Run unit tests only
npm test -- --testPathPattern=unit

# Run integration tests only
npm test -- --testPathPattern=integration
```

### Backend Tests (Pytest)
```bash
# From backend directory
cd backend

# Run all backend tests
pytest

# Run unit tests only
pytest tests/unit

# Run integration tests only
pytest tests/integration

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/unit/test_songs.py

# Run tests with specific markers
pytest -m "not slow"
pytest -m integration
```

### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test song-creation.spec.ts

# Run tests with UI mode
npx playwright test --ui

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Utilities and Helpers

### Frontend Test Helpers
```typescript
// Import shared helpers
import {
  userInteraction,
  createMockSong,
  mockApiResponse,
  getByTestId
} from '../utils/test-helpers';

// Usage in tests
const mockSong = createMockSong({ title: 'Custom Title' });
await userInteraction.click(getByTestId('save-button'));
```

### Backend Test Helpers
```python
# Import shared helpers
from tests.utils.test_helpers import (
    create_mock_song,
    ApiTestClient,
    assert_datetime_format
)

# Usage in tests
def test_create_song(mock_song):
    song_data = create_mock_song({"title": "Custom Title"})
    assert_datetime_format(song_data["created_at"])
```

## Test Data and Fixtures

### Frontend Fixtures
- Located in `frontend/tests/fixtures/`
- Export mock data for consistent testing
- Include realistic test data for different scenarios

### Backend Fixtures
- Located in `backend/tests/fixtures/`
- Use pytest fixtures for setup/teardown
- Include database fixtures and mock data

### E2E Fixtures
- Located in `tests/e2e/fixtures/`
- Include page object models
- Test data for user workflows

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Arrange-Act-Assert Pattern**: Structure tests clearly with setup, execution, and verification
3. **One Assertion Per Test**: Keep tests focused and easy to debug
4. **Descriptive Test Names**: Test names should clearly describe the expected behavior
5. **Test Edge Cases**: Include tests for error conditions, empty states, and boundary values

### Frontend Testing Best Practices

1. **Use Testing Library Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test User Interactions**: Simulate real user behavior with userEvent
3. **Mock External Dependencies**: Mock API calls, external libraries, and services
4. **Test Accessibility**: Include tests for keyboard navigation and screen readers
5. **Clean Up**: Properly clean up after tests to prevent memory leaks

### Backend Testing Best Practices

1. **Mock External Services**: Mock database, APIs, and external services
2. **Use Fixtures**: Create reusable test data with pytest fixtures
3. **Test Error Handling**: Include tests for error conditions and edge cases
4. **Validate Data Models**: Test data validation and serialization
5. **Test Security**: Include tests for authentication and authorization

### E2E Testing Best Practices

1. **Focus on Critical Paths**: Test the most important user workflows
2. **Keep Tests Independent**: Each test should be able to run in isolation
3. **Use Page Object Models**: Abstract page interactions into reusable objects
4. **Minimize Test Data Dependencies**: Use fixtures or seed data
5. **Test Cross-Browser Compatibility**: Run tests in multiple browsers

## Performance and Reliability

### Test Performance
- **Unit Tests**: Should run in < 100ms each
- **Integration Tests**: Should run in < 1s each
- **E2E Tests**: Should run in < 30s each

### Test Reliability
- **Reduce Flakiness**: Use proper waits and stable selectors
- **Retry Logic**: Configure appropriate retry counts for E2E tests
- **Parallel Execution**: Run tests in parallel where possible
- **CI/CD Integration**: Ensure tests run reliably in CI environment

## Coverage Goals

- **Unit Tests**: 80%+ line coverage for critical business logic
- **Integration Tests**: Cover all API endpoints and major component interactions
- **E2E Tests**: Cover all critical user journeys and workflows

## Troubleshooting

### Common Issues

1. **Mock Issues**: Ensure mocks are properly configured and cleared between tests
2. **Async Testing**: Use proper async/await patterns and waitFor utilities
3. **Test Isolation**: Ensure tests don't interfere with each other
4. **CI Failures**: Check for environment-specific issues and timing problems

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --verbose ComponentName.test.tsx
pytest -v tests/unit/test_specific.py
npx playwright test --debug test-name.spec.ts

# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest ComponentName.test.tsx
```

## Continuous Integration

Tests are automatically run in CI/CD pipeline:
- **Pull Request**: All test suites must pass
- **Main Branch**: Full test suite including E2E tests
- **Coverage Reports**: Generated and uploaded to coverage service
- **Test Results**: Available in CI dashboard with detailed reports

## Maintenance

### Regular Tasks
- **Review Test Coverage**: Monthly review of coverage reports
- **Update Test Data**: Keep test fixtures and mock data current
- **Refactor Tests**: Clean up and refactor tests as code evolves
- **Performance Monitoring**: Monitor test execution times and optimize slow tests
