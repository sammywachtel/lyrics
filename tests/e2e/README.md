# E2E Testing Setup Guide

This guide explains how to set up and run E2E tests with authentication.

## Test Account Setup

### Step 1: Create Test Account in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Create a new user with these credentials:
   - **Email**: `test@example.com`
   - **Password**: `testpassword123`
   - **Confirm Password**: `testpassword123`

### Step 2: Create Admin Test Account (Optional)

For admin-specific tests, create a second account:
   - **Email**: `admin@example.com`
   - **Password**: `admintest123`

### Step 3: Configure Test Environment

The test credentials are configured in `.env.test` file:

```bash
# Test Account Credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123

# Admin Test Account (optional)
ADMIN_TEST_EMAIL=admin@example.com
ADMIN_TEST_PASSWORD=admintest123
```

**Note**: `.env.test` is already in `.gitignore` so these credentials won't be committed to version control.

## Running E2E Tests

### Prerequisites
- Development servers must be running on localhost:5173 (frontend) and localhost:8001 (backend)
- Test accounts must exist in your Supabase project

### Commands

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test core-functionality.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

### Validation Script

Use the comprehensive validation script:

```bash
# Run complete validation suite
npm run validate:iteration
```

This runs:
1. TypeScript compilation
2. ESLint checks
3. Unit tests
4. E2E tests
5. Generates reports

## Test Structure

### Authentication Tests
- Tests unauthenticated user flow (shows auth form)
- Tests sign-in process with test account
- Verifies authenticated state

### Authenticated Feature Tests
- **Song List**: Tests song listing, empty states, and navigation
- **Song Editor**: Tests editor loading and basic functionality
- **API Integration**: Tests Redux store and API connectivity

### Test Utilities

The `auth-helpers.ts` utility provides:
- `signInWithTestAccount()` - Automatically sign in with test credentials
- `signOut()` - Sign out of the application
- `isAuthenticated()` - Check authentication status
- `setupAuthenticatedContext()` - Helper for beforeEach hooks

## Troubleshooting

### Test Account Issues
- Verify test account exists in Supabase
- Check `.env.test` credentials match Supabase user
- Ensure Supabase is properly configured

### Development Server Issues
- Confirm frontend runs on localhost:5173
- Confirm backend runs on localhost:8001
- Check servers start automatically via Playwright config

### Authentication Issues
- Clear browser storage: `npx playwright test --headed` then manual clear
- Verify Supabase auth configuration
- Check network requests in browser dev tools

### Test Failures
- Review test output and screenshots in `test-results/`
- Run with `--headed` flag to see browser interactions
- Check console logs for JavaScript errors

## Test Account Security

- Test credentials are in `.env.test` (not committed to git)
- Use separate test accounts, not production accounts
- Test accounts should have minimal data/permissions
- Consider using test-specific Supabase project for complete isolation
