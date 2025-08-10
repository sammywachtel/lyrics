#!/bin/bash
set -e

# Graduated Quality Gate Local Validation Script
# This script provides one-command validation that matches CI behavior exactly

echo "🚀 QUALITY GATE VALIDATION - Phase 0 Baseline Mode"
echo "=================================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track validation results
FRONTEND_PASSED=true
BACKEND_PASSED=true
PRECOMMIT_PASSED=true

# Function to print phase info
print_phase_info() {
    echo -e "${BLUE}📋 PHASE 0: BASELINE ENFORCEMENT MODE${NC}"
    echo "   • Strategy: Maintain excellent baseline, no regressions allowed"
    echo "   • Current Status: Most tools at zero-error state (excellent!)"
    echo "   • Primary Debt: MyPy typing annotations (documented and planned)"
    echo ""
}

# Function to run frontend validation
validate_frontend() {
    echo -e "${BLUE}🎨 Frontend Validation${NC}"
    echo "----------------------------------------"

    if [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    fi

    cd frontend

    # ESLint validation
    echo "🔍 ESLint baseline check (zero tolerance)..."
    if npm run lint > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ ESLint: 0 errors (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ ESLint: Regression detected!${NC}"
        echo "   🔧 Fix with: cd frontend && npm run lint:fix"
        FRONTEND_PASSED=false
    fi

    # TypeScript validation
    echo "🔍 TypeScript compilation check (zero tolerance)..."
    if npx tsc --noEmit > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ TypeScript: 0 compilation errors (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ TypeScript: Compilation errors detected!${NC}"
        echo "   🔧 Fix all TypeScript errors before continuing"
        FRONTEND_PASSED=false
    fi

    # Test validation
    echo "🧪 Test suite validation (baseline: 251/251)..."
    if npm test -- --watchAll=false --coverage --silent > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Tests: All passing (baseline maintained)${NC}"
        # Get actual test count
        TEST_OUTPUT=$(npm test -- --watchAll=false --silent 2>/dev/null | grep -E "Tests:|passed" | tail -1 || echo "Tests completed")
        echo "   📊 Coverage tracking enabled (Phase 2: ratchet implementation)"
    else
        echo -e "   ${RED}❌ Tests: Failures detected!${NC}"
        echo "   🔧 Fix failing tests before continuing"
        FRONTEND_PASSED=false
    fi

    cd ..
    echo ""
}

# Function to run backend validation
validate_backend() {
    echo -e "${BLUE}🐍 Backend Validation${NC}"
    echo "----------------------------------------"

    if [ ! -d "backend" ]; then
        echo -e "${RED}❌ Backend directory not found${NC}"
        return 1
    fi

    cd backend

    # Black validation
    echo "🔍 Black formatting check (zero tolerance)..."
    if black --check --diff . > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Black: 0 formatting issues (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ Black: Formatting issues detected!${NC}"
        echo "   🔧 Fix with: cd backend && black ."
        BACKEND_PASSED=false
    fi

    # isort validation
    echo "🔍 isort import sorting check (zero tolerance)..."
    if isort --check-only --diff . > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ isort: 0 import issues (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ isort: Import sorting issues detected!${NC}"
        echo "   🔧 Fix with: cd backend && isort ."
        BACKEND_PASSED=false
    fi

    # flake8 validation
    echo "🔍 flake8 linting check (zero tolerance)..."
    if flake8 app/ > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ flake8: 0 linting errors (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ flake8: Linting errors detected!${NC}"
        echo "   🔧 Fix all PEP 8 violations before continuing"
        BACKEND_PASSED=false
    fi

    # MyPy documentation
    echo "🔍 MyPy typing check (Phase 0: documented debt)..."
    echo -e "   ${YELLOW}⚠️  MyPy: DISABLED (90+ typing errors documented)${NC}"
    echo "   📋 Phase 1: Enable for new files only"
    echo "   📋 Phase 2: Module-by-module typing campaign"
    echo "   📋 Phase 3: Full repo-wide enforcement"

    cd ..
    echo ""
}

# Function to run pre-commit validation
validate_precommit() {
    echo -e "${BLUE}🔗 Pre-commit Hook Validation${NC}"
    echo "----------------------------------------"

    # Check if pre-commit is installed
    if ! command -v pre-commit &> /dev/null; then
        echo -e "   ${RED}❌ pre-commit not installed${NC}"
        echo "   🔧 Install with: pip install pre-commit"
        PRECOMMIT_PASSED=false
        return
    fi

    # Check if hooks are installed
    if [ ! -f ".git/hooks/pre-commit" ]; then
        echo -e "   ${YELLOW}⚠️  Pre-commit hooks not installed${NC}"
        echo "   🔧 Install with: pre-commit install"
        PRECOMMIT_PASSED=false
        return
    fi

    # Run pre-commit on all files
    echo "🔍 Running pre-commit validation..."

    # Capture pre-commit output and return code
    PRECOMMIT_OUTPUT=$(pre-commit run --all-files 2>&1)
    PRECOMMIT_RC=$?

    if [ $PRECOMMIT_RC -eq 0 ]; then
        echo -e "   ${GREEN}✅ Pre-commit: All hooks pass (baseline maintained)${NC}"
    else
        echo -e "   ${RED}❌ Pre-commit: Hook failures detected!${NC}"
        echo "   🔧 Run: pre-commit run --all-files (to see details)"
        echo "   📋 Pre-commit hooks are MANDATORY in Phase 0"
        echo ""
        echo "Pre-commit output:"
        echo "$PRECOMMIT_OUTPUT"
        PRECOMMIT_PASSED=false
    fi

    echo ""
}

# Function to print final summary
print_summary() {
    echo "=================================================================="
    echo -e "${BLUE}📊 PHASE 0 VALIDATION SUMMARY${NC}"
    echo "=================================================================="
    echo ""

    if [ "$PRECOMMIT_PASSED" = true ]; then
        echo -e "✅ ${GREEN}Pre-commit baseline: PASSED${NC}"
    else
        echo -e "❌ ${RED}Pre-commit baseline: FAILED${NC}"
    fi

    if [ "$FRONTEND_PASSED" = true ]; then
        echo -e "✅ ${GREEN}Frontend baseline: PASSED (ESLint: 0, TypeScript: 0, Tests: All)${NC}"
    else
        echo -e "❌ ${RED}Frontend baseline: FAILED${NC}"
    fi

    if [ "$BACKEND_PASSED" = true ]; then
        echo -e "✅ ${GREEN}Backend baseline: PASSED (Black: 0, isort: 0, flake8: 0)${NC}"
    else
        echo -e "❌ ${RED}Backend baseline: FAILED${NC}"
    fi

    echo -e "⚠️  ${YELLOW}MyPy baseline: DOCUMENTED (extensive typing debt - phased improvement planned)${NC}"
    echo ""

    if [ "$FRONTEND_PASSED" = true ] && [ "$BACKEND_PASSED" = true ] && [ "$PRECOMMIT_PASSED" = true ]; then
        echo -e "🎉 ${GREEN}ALL PHASE 0 BASELINE QUALITY GATES PASSED!${NC}"
        echo ""
        echo -e "${BLUE}📈 BASELINE ASSESSMENT:${NC}"
        echo "   • Excellent starting position: Most tools already at zero-error state"
        echo "   • Primary debt: MyPy type annotations (documented and planned)"
        echo "   • Pre-commit hooks: Mandatory and enforced"
        echo ""
        echo -e "${BLUE}🚀 NEXT PHASE TIMELINE:${NC}"
        echo "   Phase 1 (1-2 weeks): Changed-code-only enforcement + typing for new files"
        echo "   Phase 2 (2-4 weeks): Coverage ratchet + module-by-module improvements"
        echo "   Phase 3 (ongoing): Full strict enforcement + branch protection"
        echo ""
        echo -e "🎯 ${GREEN}Ready for commit and push!${NC}"
        return 0
    else
        echo -e "⚠️  ${YELLOW}QUALITY GATE FAILURES DETECTED${NC}"
        echo ""
        echo -e "${BLUE}🔧 REQUIRED ACTIONS:${NC}"

        if [ "$PRECOMMIT_PASSED" = false ]; then
            echo "   1. Fix pre-commit hook issues (mandatory)"
        fi

        if [ "$FRONTEND_PASSED" = false ]; then
            echo "   2. Fix frontend quality regressions"
            echo "      • ESLint: cd frontend && npm run lint:fix"
            echo "      • TypeScript: Fix compilation errors"
            echo "      • Tests: Fix failing tests"
        fi

        if [ "$BACKEND_PASSED" = false ]; then
            echo "   3. Fix backend quality regressions"
            echo "      • Black: cd backend && black ."
            echo "      • isort: cd backend && isort ."
            echo "      • flake8: Fix PEP 8 violations"
        fi

        echo ""
        echo "❌ Fix all issues above, then re-run: scripts/validate.sh"
        return 1
    fi
}

# Main execution
main() {
    # Check if we're in the project root
    if [ ! -f "package.json" ] || [ ! -f "QUALITY_GATES.md" ]; then
        echo -e "${RED}❌ Please run this script from the project root directory${NC}"
        exit 1
    fi

    print_phase_info

    # Run validations
    validate_precommit
    validate_frontend
    validate_backend

    # Print final summary and exit with appropriate code
    print_summary
    exit $?
}

# Run main function
main "$@"
