#!/bin/bash

echo "🚀 Setting up development environment for Lyrics App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.11+ first."
    exit 1
fi

# Install Python dependencies for pre-commit
echo "📦 Installing pre-commit..."
if command -v pip3 &> /dev/null; then
    pip3 install pre-commit
elif command -v pip &> /dev/null; then
    pip install pre-commit
else
    echo "❌ pip is required to install pre-commit. Please install pip first."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Go back to root
cd ..

# Install root dependencies (for concurrently, etc.)
echo "📦 Installing root dependencies..."
npm install

# Install pre-commit hooks
echo "🪝 Installing pre-commit hooks..."
pre-commit install

# Verify everything is working
echo "🔍 Verifying setup..."
echo ""

# Test pre-commit installation
echo "Testing pre-commit installation..."
if pre-commit --version &> /dev/null; then
    echo "✅ Pre-commit installed successfully"
else
    echo "❌ Pre-commit installation failed"
    exit 1
fi

# Test frontend setup
echo "Testing frontend setup..."
cd frontend
if npm run lint &> /dev/null; then
    echo "✅ Frontend linting works"
else
    echo "⚠️  Frontend linting had issues (this is normal for new projects)"
fi

if npx tsc --noEmit &> /dev/null; then
    echo "✅ TypeScript compilation works"
else
    echo "⚠️  TypeScript compilation had issues (check tsconfig)"
fi

# Go back to root
cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your .env files are configured (see CLAUDE.md)"
echo "2. Run 'npm run dev' to start the development servers"
echo "3. Pre-commit hooks will now run automatically on git commit"
echo ""
echo "💡 Useful commands:"
echo "  npm run dev              - Start frontend and backend servers"
echo "  npm test                 - Run frontend tests"
echo "  pre-commit run --all-files - Run all hooks on all files"
echo "  npm run frontend:dev     - Start only frontend server"
echo "  npm run backend:dev      - Start only backend server"
echo ""
echo "📖 See DEVELOPMENT.md for detailed workflow information"