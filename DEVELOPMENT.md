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

This graduated approach ensures:
- ⚡ **Fast feedback** during development (< 10 seconds local validation)
- 🧹 **Clean commit history** without disruptive auto-fix commits
- 🔒 **Quality assurance** at every stage with phase-appropriate standards
- 🚀 **Efficient CI** that focuses on validation with helpful guidance
- 👥 **Consistent code** across the team with clear quality expectations
- 📈 **Sustainable improvement** through graduated enforcement
- 🎯 **Developer-friendly** progression from permissive to strict

## Getting Help

### Phase-Specific Help

**Phase 0 Issues:**
- **Quality Status**: `npm run quality:status` - Current phase dashboard
- **Full Validation**: `scripts/validate.sh` - Complete local validation
- **Regression Issues**: Focus on maintaining zero-error baseline
- **MyPy Questions**: Review QUALITY_GATES.md for typing roadmap

**General Help:**
- **Setup Issues**: Run `./setup-dev.sh` again
- **Hook Problems**: Check `.pre-commit-config.yaml` configuration
- **CI Failures**: Use `scripts/validate.sh` to match CI locally
- **Test Issues**: Use `npm run test:watch` for interactive debugging

**Documentation:**
- **QUALITY_GATES.md**: Complete graduation plan and phase details
- **.quality-baseline.json**: Current metrics and technical debt tracking
- **scripts/validate.sh**: Comprehensive validation with phase awareness
- **scripts/quality-status.sh**: Real-time quality metrics dashboard

**Key Commands Reference:**
```bash
# Essential Phase 0 commands
npm run validate              # Complete validation (matches CI)
npm run quality:status        # Quality gate dashboard
scripts/validate.sh           # Detailed validation script
pre-commit run --all-files    # Manual hook execution

# Quick fixes
cd frontend && npm run lint:fix     # Fix ESLint issues
cd backend && black . && isort .    # Format backend code
```

### Quality Gate Philosophy

Remember: The graduated quality gate system is designed to **accelerate development** while improving quality. Phase 0 leverages your excellent baseline position to prevent regressions while planning systematic improvements.

**Current Status**: You're in an excellent position with most tools at zero-error state. The focus is maintaining this baseline while preparing for gradual quality improvements.

Happy coding with confidence! 🎵✨
