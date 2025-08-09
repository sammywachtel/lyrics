#!/bin/bash

# Enhanced Development Environment Setup with Quality Gates
# Sets up all quality gates and development tools

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_status $BLUE "🔧 $1"
    echo "----------------------------------------"
}

main() {
    print_status $BLUE "🚀 SETTING UP DEVELOPMENT ENVIRONMENT WITH QUALITY GATES"
    echo ""

    # Check prerequisites
    print_header "CHECKING PREREQUISITES"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status $RED "❌ Node.js is not installed. Please install Node.js 20+"
        exit 1
    else
        NODE_VERSION=$(node --version)
        print_status $GREEN "✅ Node.js found: $NODE_VERSION"
    fi

    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_status $RED "❌ Python 3 is not installed. Please install Python 3.11+"
        exit 1
    else
        PYTHON_VERSION=$(python3 --version)
        print_status $GREEN "✅ Python found: $PYTHON_VERSION"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_status $RED "❌ npm is not installed"
        exit 1
    else
        NPM_VERSION=$(npm --version)
        print_status $GREEN "✅ npm found: $NPM_VERSION"
    fi

    # Install pre-commit and quality tools
    print_header "INSTALLING QUALITY TOOLS"

    if ! command -v pre-commit &> /dev/null; then
        print_status $BLUE "Installing pre-commit..."
        pip3 install pre-commit || pip install pre-commit
    else
        print_status $GREEN "✅ pre-commit already installed"
    fi

    # Install commitizen for conventional commits
    print_status $BLUE "Installing commitizen for conventional commits..."
    pip3 install commitizen || pip install commitizen

    # Install detect-secrets for security scanning
    print_status $BLUE "Installing detect-secrets for security scanning..."
    pip3 install detect-secrets || pip install detect-secrets

    # Install root dependencies
    print_header "INSTALLING ROOT DEPENDENCIES"
    print_status $BLUE "Installing root package dependencies..."
    npm install

    # Install frontend dependencies
    print_header "INSTALLING FRONTEND DEPENDENCIES"
    if [[ -d "frontend" ]]; then
        cd frontend
        print_status $BLUE "Installing frontend dependencies..."
        npm ci
        print_status $GREEN "✅ Frontend dependencies installed"
        cd ..
    fi

    # Install backend dependencies
    print_header "INSTALLING BACKEND DEPENDENCIES"
    if [[ -d "backend" ]]; then
        cd backend
        print_status $BLUE "Installing backend dependencies..."
        pip3 install -r requirements.txt

        # Install quality tools
        print_status $BLUE "Installing backend quality tools..."
        pip3 install black isort flake8 mypy

        print_status $GREEN "✅ Backend dependencies and quality tools installed"
        cd ..
    fi

    # Install and configure pre-commit hooks
    print_header "CONFIGURING STRICT QUALITY GATES"
    print_status $BLUE "Installing pre-commit hooks..."
    pre-commit install

    # Install commit-msg hook for conventional commits
    pre-commit install --hook-type commit-msg

    print_status $GREEN "✅ Pre-commit hooks installed successfully"

    # Set up git commit message template
    print_header "CONFIGURING GIT"
    if [[ -f ".gitmessage" ]]; then
        git config commit.template .gitmessage
        print_status $GREEN "✅ Git commit message template configured"
    fi

    # Create initial secrets baseline if not exists
    if [[ ! -f ".secrets.baseline" ]]; then
        print_status $BLUE "Creating secrets baseline..."
        detect-secrets scan . > .secrets.baseline 2>/dev/null || echo '{}' > .secrets.baseline
        print_status $GREEN "✅ Secrets baseline created"
    fi

    # Make quality gate script executable
    if [[ -f "scripts/quality-gate.sh" ]]; then
        chmod +x scripts/quality-gate.sh
        print_status $GREEN "✅ Quality gate script configured"
    fi

    # Run initial setup verification
    print_header "VERIFYING SETUP"

    # Test pre-commit
    if pre-commit --version &> /dev/null; then
        print_status $GREEN "✅ Pre-commit installed successfully"
    else
        print_status $RED "❌ Pre-commit installation failed"
        exit 1
    fi

    # Test frontend tools (non-failing)
    cd frontend
    print_status $BLUE "Testing frontend tools..."
    if npm run lint &> /dev/null; then
        print_status $GREEN "✅ Frontend linting works"
    else
        print_status $YELLOW "⚠️  Frontend has linting issues (run 'npm run quality:frontend' to see details)"
    fi

    if npx tsc --noEmit &> /dev/null; then
        print_status $GREEN "✅ TypeScript compilation works"
    else
        print_status $YELLOW "⚠️  TypeScript has compilation issues"
    fi
    cd ..

    # Final success message
    echo ""
    echo "========================================"
    print_status $GREEN "🎉 DEVELOPMENT ENVIRONMENT WITH QUALITY GATES SETUP COMPLETE!"
    echo ""
    print_status $BLUE "🚨 QUALITY GATES NOW ACTIVE:"
    print_status $YELLOW "• All commits MUST pass strict quality checks"
    print_status $YELLOW "• ESLint errors will block commits"
    print_status $YELLOW "• TypeScript errors will block commits"
    print_status $YELLOW "• Python formatting/linting will block commits"
    print_status $YELLOW "• Security issues will block commits"
    print_status $YELLOW "• Conventional commit format required"
    echo ""
    print_status $BLUE "🛠️  NEW QUALITY COMMANDS:"
    print_status $BLUE "• npm run quality:gate         # Run all quality checks"
    print_status $BLUE "• npm run quality:frontend     # Check frontend only"
    print_status $BLUE "• npm run quality:backend      # Check backend only"
    print_status $BLUE "• npm run quality:precommit    # Run pre-commit hooks"
    echo ""
    print_status $BLUE "📋 RECOMMENDED WORKFLOW:"
    print_status $BLUE "1. Make your changes"
    print_status $BLUE "2. Run 'npm run quality:gate' to check everything"
    print_status $BLUE "3. Fix any issues reported"
    print_status $BLUE "4. Commit (hooks will run automatically and MUST pass)"
    print_status $BLUE "5. Push (CI/CD will validate again)"
    echo ""
    print_status $BLUE "📖 STANDARD COMMANDS (still available):"
    print_status $BLUE "• npm run dev                   # Start frontend and backend servers"
    print_status $BLUE "• npm test                      # Run frontend tests"
    print_status $BLUE "• pre-commit run --all-files    # Run all hooks manually"
    echo ""
    print_status $GREEN "Quality gates are now enforced! No more lint errors in CI/CD! 🚀"
    print_status $BLUE "📖 See DEVELOPMENT.md for detailed workflow information"
}

main "$@"
