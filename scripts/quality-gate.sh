#!/bin/bash

# Quality Gate Script - Local Development
# Runs all quality checks that will be enforced in CI/CD
# Use this before committing to ensure your changes will pass

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_status $BLUE "🔍 $1"
    echo "----------------------------------------"
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

print_warning() {
    print_status $YELLOW "⚠️  $1"
}

# Function to run command and capture result
run_check() {
    local check_name=$1
    local command=$2
    local directory=${3:-.}

    print_status $BLUE "Running: $check_name"

    if (cd "$directory" && eval "$command"); then
        print_success "$check_name passed"
        return 0
    else
        print_error "$check_name failed"
        return 1
    fi
}

# Main quality gate function
main() {
    local failed_checks=0

    print_status $BLUE "🚀 QUALITY GATE - LOCAL PRE-FLIGHT CHECK"
    print_status $BLUE "This script runs all checks that will be enforced in CI/CD"
    echo ""

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Pre-commit hooks check
    print_header "PRE-COMMIT HOOKS"
    if ! command -v pre-commit &> /dev/null; then
        print_error "pre-commit is not installed. Install with: pip install pre-commit"
        ((failed_checks++))
    else
        if ! run_check "Pre-commit hooks" "pre-commit run --all-files"; then
            ((failed_checks++))
            print_warning "Fix pre-commit issues before proceeding"
        fi
    fi

    # Frontend quality checks
    print_header "FRONTEND QUALITY CHECKS"

    # Check if frontend dependencies are installed
    if [[ ! -d "frontend/node_modules" ]]; then
        print_status $BLUE "Installing frontend dependencies..."
        if ! (cd frontend && npm ci); then
            print_error "Failed to install frontend dependencies"
            ((failed_checks++))
        fi
    fi

    if ! run_check "ESLint" "npm run lint" "frontend"; then
        ((failed_checks++))
        print_warning "Fix ESLint errors with: cd frontend && npm run lint:fix"
    fi

    if ! run_check "TypeScript compilation" "npx tsc --noEmit" "frontend"; then
        ((failed_checks++))
    fi

    if ! run_check "Frontend tests" "npm test -- --watchAll=false --coverage" "frontend"; then
        ((failed_checks++))
    fi

    # Backend quality checks
    print_header "BACKEND QUALITY CHECKS"

    # Check if backend dependencies are available
    if ! python -c "import black, isort, flake8, mypy" 2>/dev/null; then
        print_warning "Backend quality tools not installed. Installing..."
        if ! (cd backend && pip install black isort flake8 mypy); then
            print_error "Failed to install backend quality tools"
            ((failed_checks++))
        fi
    fi

    if ! run_check "Black formatting" "black --check --diff ." "backend"; then
        ((failed_checks++))
        print_warning "Fix formatting with: cd backend && black ."
    fi

    if ! run_check "isort import sorting" "isort --check-only --diff ." "backend"; then
        ((failed_checks++))
        print_warning "Fix imports with: cd backend && isort ."
    fi

    if ! run_check "Flake8 linting" "flake8" "backend"; then
        ((failed_checks++))
    fi

    if ! run_check "MyPy type checking" "mypy . --no-error-summary" "backend"; then
        ((failed_checks++))
    fi

    # Security checks
    print_header "SECURITY CHECKS"

    if command -v detect-secrets &> /dev/null; then
        if ! run_check "Secret detection" "detect-secrets scan --baseline .secrets.baseline ."; then
            ((failed_checks++))
        fi
    else
        print_warning "detect-secrets not installed. Install with: pip install detect-secrets"
    fi

    # Final summary
    echo ""
    echo "========================================"
    if [[ $failed_checks -eq 0 ]]; then
        print_success "🎉 ALL QUALITY GATES PASSED!"
        print_status $GREEN "Your code is ready for commit and will pass CI/CD checks"
        echo ""
        print_status $BLUE "Next steps:"
        print_status $BLUE "1. git add your changes"
        print_status $BLUE "2. git commit (pre-commit hooks will run automatically)"
        print_status $BLUE "3. git push (CI/CD will validate again)"
        exit 0
    else
        print_error "🚨 $failed_checks QUALITY GATE(S) FAILED"
        print_status $RED "Fix all issues above before committing"
        echo ""
        print_status $YELLOW "Common fixes:"
        print_status $YELLOW "• ESLint: cd frontend && npm run lint:fix"
        print_status $YELLOW "• Black: cd backend && black ."
        print_status $YELLOW "• isort: cd backend && isort ."
        print_status $YELLOW "• Pre-commit: pre-commit run --all-files"
        exit 1
    fi
}

# Allow running specific checks
case "${1:-all}" in
    "frontend")
        print_header "FRONTEND ONLY"
        run_check "ESLint" "npm run lint" "frontend"
        run_check "TypeScript" "npx tsc --noEmit" "frontend"
        run_check "Tests" "npm test -- --watchAll=false" "frontend"
        ;;
    "backend")
        print_header "BACKEND ONLY"
        run_check "Black" "black --check --diff ." "backend"
        run_check "isort" "isort --check-only --diff ." "backend"
        run_check "Flake8" "flake8" "backend"
        run_check "MyPy" "mypy . --no-error-summary" "backend"
        ;;
    "pre-commit")
        print_header "PRE-COMMIT ONLY"
        run_check "Pre-commit hooks" "pre-commit run --all-files"
        ;;
    "all"|*)
        main
        ;;
esac
