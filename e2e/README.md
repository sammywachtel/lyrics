# E2E Testing Suite

## Purpose

Post-iteration validation tests to catch breaking changes before user testing. Run these after each development phase to ensure core functionality remains working.

## Quick Start

```bash
# Start the development servers
npm run dev

# Run E2E tests (in another terminal)
npm run test:e2e

# Interactive mode with UI
npm run test:e2e:ui

# Full validation suite
npm run validate:iteration
```

## Test Structure

### `core-functionality.spec.ts`
Tests essential user flows that must always work:
- ✅ App loads without errors
- ✅ Song list displays correctly
- ✅ Create song functionality works
- ✅ Song editor loads and functions
- ✅ API calls complete without hanging
- ✅ Error handling works gracefully

### `redux-integration.spec.ts`
Tests Redux-specific functionality from Phase 0:
- ✅ Redux Provider context works (no context errors)
- ✅ RTK Query caching functions on navigation
- ✅ Optimistic updates provide immediate feedback
- ✅ Auto-save functionality works
- ✅ API endpoints respond correctly

## Usage After Each Iteration

### Option 1: Full Validation (Recommended)
```bash
npm run validate:iteration
```
Runs static analysis, unit tests, E2E tests, and performance checks.

### Option 2: Quick Check
```bash
npm run validate:quick
```
Just TypeScript compilation + E2E tests.

### Option 3: E2E Only
```bash
npm run test:e2e
```

## Expected Results

### ✅ Should Always Pass
- App loads without console errors
- Basic navigation works
- Redux state management functions
- Core CRUD operations work

### ⚠️ Expected Warnings/Skips
- Unit tests may fail during Redux migration (documented)
- Some features may be skipped if no data exists
- Performance metrics are informational

### ❌ Immediate Investigation Needed
- App crashes on load
- Redux context errors
- API endpoints returning 500 errors
- Infinite loading states

## Debugging Failed Tests

### View Test Report
```bash
npm run test:e2e:report
```

### Debug Mode (Step Through)
```bash
npm run test:e2e:debug
```

### Check Specific Test
```bash
npx playwright test core-functionality.spec.ts -g "App loads"
```

## Adding New Tests

As you add features, extend the test suites:

1. **Core functionality** → Add to `core-functionality.spec.ts`
2. **New architecture changes** → Create new spec file
3. **API changes** → Update `redux-integration.spec.ts`

Keep tests focused on **user flows** not implementation details.

## CI Integration

These tests are designed to run in CI/CD pipelines:

```yaml
- name: E2E Tests
  run: |
    npm run dev &
    npm run validate:iteration
```

The validation script handles server startup and provides clear pass/fail results.
