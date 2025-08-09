# Development Workflow Guide

This guide covers the optimal development workflow for the Lyrics App with integrated code quality tools.

## Quick Setup

**New team member? Run this once:**
```bash
./setup-dev.sh
```

This installs all dependencies, sets up pre-commit hooks, and verifies your environment.

## Development Workflow

### 1. Start Development Environment

```bash
# Start both frontend and backend
npm run dev

# OR start them separately
npm run frontend:dev  # Frontend only (port 5173)
npm run backend:dev   # Backend only (port 8001)
```

### 2. Make Your Changes

- Edit files in `frontend/src/` for React components
- Edit files in `backend/app/` for API endpoints
- Write tests as you develop (mandatory for all features)

### 3. Pre-Commit Quality Checks

When you commit, **pre-commit hooks automatically run:**

```bash
git add .
git commit -m "Your commit message"
# ✅ Pre-commit hooks run automatically:
# - ESLint auto-fix
# - TypeScript compilation check
# - Related tests execution
# - Basic file checks (trailing whitespace, etc.)
```

**If hooks fail:**
- Fix the reported issues
- Commit again - hooks will re-run
- No need to re-stage files after fixes

### 4. Push and CI Validation

```bash
git push origin feature-branch
```

The CI pipeline validates:
- ✅ ESLint compliance (no auto-fixing)
- ✅ TypeScript compilation
- ✅ All tests pass
- ✅ Code quality standards

## Code Quality Commands

### Linting
```bash
# Check for lint issues
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Run from project root
npm run lint        # Delegates to frontend
npm run lint:fix    # Delegates to frontend
```

### TypeScript
```bash
# Check TypeScript compilation
cd frontend && npx tsc --noEmit

# Via project root
npm run test  # Includes TypeScript check in build process
```

### Testing
```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test
cd frontend && npm test -- ComponentName.test.tsx
```

### Pre-commit Management
```bash
# Manually run all pre-commit hooks
npm run precommit:run

# Reinstall hooks (if needed)
npm run setup:hooks

# Run pre-commit on specific files
pre-commit run --files frontend/src/components/MyComponent.tsx
```

## Development Best Practices

### 1. Test-Driven Development
- Write tests alongside feature development
- Use `npm run test:watch` for interactive testing
- Aim for comprehensive test coverage

### 2. Clean Commits
- Pre-commit hooks ensure clean, consistent code
- Write meaningful commit messages
- Make atomic commits (one logical change per commit)

### 3. Fast Feedback Loop
- Pre-commit hooks provide instant feedback (< 10 seconds)
- Fix issues locally before they reach CI
- Use watch mode for tests and development

### 4. Code Quality Standards
- ESLint enforces consistent code style
- TypeScript ensures type safety
- Tests verify functionality
- All checks run both locally and in CI

## Troubleshooting

### Pre-commit Hooks Not Running
```bash
# Reinstall hooks
./setup-dev.sh

# Or manually
pre-commit install
```

### CI Failing After Local Success
```bash
# Run the same checks CI uses
npm run lint      # ESLint validation
npx tsc --noEmit  # TypeScript check (from frontend/)
npm test          # Full test suite

# If still failing, check CI logs for specific errors
```

### Performance Issues
```bash
# Skip hooks temporarily (NOT recommended)
git commit --no-verify -m "Emergency fix"

# Better: Fix the underlying issue and commit normally
```

### Test Failures
```bash
# Run tests with more details
npm test -- --verbose

# Run specific failing test
npm test -- --testNamePattern="your test name"

# Debug failing test
npm test -- --no-coverage --verbose ComponentName.test.tsx
```

## File Structure Reference

```
lyrics/
├── .pre-commit-config.yaml    # Pre-commit hook configuration
├── setup-dev.sh               # One-command environment setup
├── .github/workflows/lint.yml # CI validation pipeline
├── frontend/                  # React TypeScript frontend
│   ├── src/components/        # React components
│   │   └── __tests__/         # Component tests
│   ├── src/utils/             # Utility functions
│   │   └── __tests__/         # Utility tests
│   └── package.json           # Frontend dependencies
├── backend/                   # FastAPI Python backend
│   └── app/                   # Backend application code
└── package.json               # Root scripts and tooling
```

## Team Workflow Summary

| Stage | Local (Pre-commit) | CI (GitHub Actions) |
|-------|-------------------|---------------------|
| **Speed** | < 10 seconds | 2-5 minutes |
| **Purpose** | Fix issues before commit | Validate clean code |
| **Actions** | Auto-fix lint, check TS, run tests | Validate only, no fixing |
| **Failure** | Fix locally and re-commit | Fix locally and push |

This hybrid approach ensures:
- ⚡ **Fast feedback** during development
- 🧹 **Clean commit history** without auto-fix commits
- 🔒 **Quality assurance** at every stage
- 🚀 **Efficient CI** that focuses on validation
- 👥 **Consistent code** across the team

## Getting Help

- **Setup Issues**: Run `./setup-dev.sh` again
- **Hook Problems**: Check `.pre-commit-config.yaml` configuration
- **CI Failures**: Compare local commands with CI steps
- **Test Issues**: Use `npm run test:watch` for interactive debugging

Happy coding! 🎵
