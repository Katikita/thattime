#!/bin/bash

# Test Runner Script for Polaroid Frame & Sharing UX
# Usage: ./test-runner.sh

echo "🧪 Running Automated Tests..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if tsx is available, if not try with ts-node or node
if command -v tsx &> /dev/null; then
    echo "✅ Using tsx to run tests..."
    npx tsx test-polaroid-sharing.test.ts
elif command -v ts-node &> /dev/null; then
    echo "✅ Using ts-node to run tests..."
    npx ts-node test-polaroid-sharing.test.ts
else
    echo "⚠️  tsx/ts-node not found, checking TypeScript compilation..."
    # Try to compile and run with node
    if command -v tsc &> /dev/null; then
        echo "Compiling TypeScript..."
        tsc test-polaroid-sharing.test.ts --module commonjs --esModuleInterop
        node test-polaroid-sharing.test.js
        rm -f test-polaroid-sharing.test.js
    else
        echo "❌ TypeScript compiler not found. Please install tsx: npm install -g tsx"
        exit 1
    fi
fi

echo ""
echo "📋 For manual testing, see TESTING_CHECKLIST.md"
echo "🚀 Start dev server: npm run dev"
