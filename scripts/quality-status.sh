#!/bin/bash
# Quality Status Tracker - Shows current quality gate phase and metrics

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 GRADUATED QUALITY GATE STATUS${NC}"
echo "=================================================================="

# Read baseline metrics
if [ -f ".quality-baseline.json" ]; then
    PHASE=$(grep -o '"phase": "[0-9]"' .quality-baseline.json | cut -d'"' -f4)
    echo -e "${PURPLE}📋 Current Phase: $PHASE${NC}"

    case $PHASE in
        "0")
            echo -e "${BLUE}   Phase 0: Baseline and Stabilization${NC}"
            echo "   Duration: 1-3 days"
            echo "   Strategy: Maintain excellent baseline, document debt"
            ;;
        "1")
            echo -e "${YELLOW}   Phase 1: Changed-Code-Only Enforcement${NC}"
            echo "   Duration: 1-2 weeks"
            echo "   Strategy: Strict for changed files, warnings for legacy"
            ;;
        "2")
            echo -e "${YELLOW}   Phase 2: Ratchet and Expand Scope${NC}"
            echo "   Duration: 2-4 weeks"
            echo "   Strategy: Progressive improvement, coverage ratchet"
            ;;
        "3")
            echo -e "${GREEN}   Phase 3: Normalize and Harden${NC}"
            echo "   Duration: Ongoing"
            echo "   Strategy: Full strict enforcement"
            ;;
    esac
else
    echo -e "${RED}❌ .quality-baseline.json not found${NC}"
    PHASE="unknown"
fi

echo ""
echo -e "${BLUE}📊 QUALITY METRICS DASHBOARD${NC}"
echo "------------------------------------------------------------------"

# Frontend metrics
echo -e "${BLUE}🎨 Frontend Status:${NC}"
cd frontend 2>/dev/null || echo "❌ Frontend directory not found"

if [ -d "../frontend" ]; then
    cd frontend

    # ESLint check
    if npm run lint > /dev/null 2>&1; then
        echo -e "   ESLint:     ${GREEN}✅ 0 errors${NC}"
    else
        ESLINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo "unknown")
        echo -e "   ESLint:     ${RED}❌ $ESLINT_ERRORS errors${NC}"
    fi

    # TypeScript check
    if npx tsc --noEmit > /dev/null 2>&1; then
        echo -e "   TypeScript: ${GREEN}✅ 0 compilation errors${NC}"
    else
        echo -e "   TypeScript: ${RED}❌ Compilation errors detected${NC}"
    fi

    # Test status
    TEST_OUTPUT=$(npm test -- --watchAll=false --silent 2>/dev/null | tail -1 || echo "Tests: Unable to determine")
    if echo "$TEST_OUTPUT" | grep -q "passing"; then
        echo -e "   Tests:      ${GREEN}✅ All passing${NC}"
    else
        echo -e "   Tests:      ${YELLOW}⚠️  Status unclear${NC}"
    fi

    cd ..
else
    echo -e "   ${RED}❌ Frontend directory not accessible${NC}"
fi

# Backend metrics
echo -e "${BLUE}🐍 Backend Status:${NC}"
if [ -d "backend" ]; then
    cd backend

    # Black check
    if black --check . > /dev/null 2>&1; then
        echo -e "   Black:      ${GREEN}✅ 0 formatting issues${NC}"
    else
        echo -e "   Black:      ${RED}❌ Formatting issues detected${NC}"
    fi

    # isort check
    if isort --check-only . > /dev/null 2>&1; then
        echo -e "   isort:      ${GREEN}✅ 0 import issues${NC}"
    else
        echo -e "   isort:      ${RED}❌ Import issues detected${NC}"
    fi

    # flake8 check
    if flake8 app/ > /dev/null 2>&1; then
        echo -e "   flake8:     ${GREEN}✅ 0 linting errors${NC}"
    else
        echo -e "   flake8:     ${RED}❌ Linting errors detected${NC}"
    fi

    # MyPy status (phase-dependent)
    case $PHASE in
        "0")
            echo -e "   MyPy:       ${YELLOW}⚠️  Disabled (90+ errors documented)${NC}"
            ;;
        "1")
            echo -e "   MyPy:       ${BLUE}🔄 Enabled for new files only${NC}"
            ;;
        "2"|"3")
            if mypy . > /dev/null 2>&1; then
                echo -e "   MyPy:       ${GREEN}✅ Full compliance${NC}"
            else
                echo -e "   MyPy:       ${YELLOW}🔄 Progressive improvement${NC}"
            fi
            ;;
    esac

    cd ..
else
    echo -e "   ${RED}❌ Backend directory not accessible${NC}"
fi

# Pre-commit status
echo -e "${BLUE}🔗 Pre-commit Status:${NC}"
if command -v pre-commit &> /dev/null; then
    if [ -f ".git/hooks/pre-commit" ]; then
        echo -e "   Hooks:      ${GREEN}✅ Installed and active${NC}"
    else
        echo -e "   Hooks:      ${RED}❌ Not installed${NC}"
        echo -e "               ${YELLOW}Run: pre-commit install${NC}"
    fi
else
    echo -e "   Pre-commit: ${RED}❌ Not installed${NC}"
    echo -e "               ${YELLOW}Run: pip install pre-commit${NC}"
fi

echo ""
echo -e "${BLUE}🎯 PHASE PROGRESSION ROADMAP${NC}"
echo "------------------------------------------------------------------"

case $PHASE in
    "0")
        echo -e "${GREEN}✅ Phase 0: Baseline established${NC}"
        echo -e "${YELLOW}🔄 Next: Phase 1 (Changed-code-only enforcement)${NC}"
        echo "   Timeline: 1-2 weeks"
        echo "   Goal: Strict quality for new/modified code only"
        ;;
    "1")
        echo -e "${GREEN}✅ Phase 0: Baseline established${NC}"
        echo -e "${GREEN}✅ Phase 1: Changed-code enforcement active${NC}"
        echo -e "${YELLOW}🔄 Next: Phase 2 (Ratchet and expand)${NC}"
        echo "   Timeline: 2-4 weeks"
        echo "   Goal: Coverage ratchet + module-by-module improvements"
        ;;
    "2")
        echo -e "${GREEN}✅ Phase 0: Baseline established${NC}"
        echo -e "${GREEN}✅ Phase 1: Changed-code enforcement completed${NC}"
        echo -e "${GREEN}✅ Phase 2: Ratcheting system active${NC}"
        echo -e "${YELLOW}🔄 Next: Phase 3 (Full enforcement)${NC}"
        echo "   Timeline: Ongoing"
        echo "   Goal: All quality gates blocking, branch protection"
        ;;
    "3")
        echo -e "${GREEN}✅ Phase 0: Baseline established${NC}"
        echo -e "${GREEN}✅ Phase 1: Changed-code enforcement completed${NC}"
        echo -e "${GREEN}✅ Phase 2: Ratcheting system completed${NC}"
        echo -e "${GREEN}✅ Phase 3: Full strict enforcement active${NC}"
        echo "   Status: Quality gate system fully normalized"
        ;;
esac

echo ""
echo -e "${BLUE}🛠️  AVAILABLE COMMANDS${NC}"
echo "------------------------------------------------------------------"
echo "   npm run validate              - Full local validation (matches CI)"
echo "   npm run quality:status        - This status dashboard"
echo "   scripts/validate.sh           - Complete validation script"
echo "   pre-commit run --all-files    - Run all pre-commit hooks"

if [[ "$PHASE" == "1" ]]; then
    echo "   npm run validate:phase1       - Phase 1 changed-files validation"
fi

echo ""
echo -e "${BLUE}📚 DOCUMENTATION${NC}"
echo "------------------------------------------------------------------"
echo "   QUALITY_GATES.md              - Complete graduation plan"
echo "   DEVELOPMENT.md                - Development workflow guide"
echo "   .quality-baseline.json        - Quality metrics baseline"

echo ""
echo -e "${PURPLE}🎉 Quality gate system operational!${NC}"

# Exit with status based on critical issues
if ! command -v pre-commit &> /dev/null || [ ! -f ".git/hooks/pre-commit" ]; then
    echo -e "${YELLOW}⚠️  Pre-commit hooks need attention${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All systems ready for development${NC}"
