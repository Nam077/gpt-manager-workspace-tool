#!/bin/bash

# Production Build Script
echo "🔨 Building project for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting production build process..."

# Step 1: Clean previous builds
print_step "Cleaning previous builds..."
rm -rf dist/
rm -rf frontend/dist/
print_status "Cleaned previous builds"

# Step 2: Install dependencies if needed
print_step "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
fi

if [ ! -d "frontend/node_modules" ]; then
    print_warning "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
fi

# Step 3: Build backend
print_step "Building backend (NestJS)..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed!"
    exit 1
fi
print_status "Backend build completed successfully ✅"

# Step 4: Build frontend
print_step "Building frontend (Vite + React)..."
npm run build:frontend
if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi
print_status "Frontend build completed successfully ✅"

# Step 5: Verify builds
print_step "Verifying builds..."

# Check backend build
if [ ! -f "dist/src/main.js" ]; then
    print_error "Backend main.js not found at dist/src/main.js"
    exit 1
fi

# Check frontend build
if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
    print_error "Frontend build not found at frontend/dist/"
    exit 1
fi

print_status "Build verification completed ✅"

# Step 6: Show build info
print_step "Build Information:"
echo "📁 Backend build: dist/"
echo "📁 Frontend build: frontend/dist/"
echo "🌐 Frontend port: 3010 (when using preview)"
echo "🚀 Backend port: 3232"

# Show file sizes
if command_exists du; then
    echo ""
    echo "📊 Build sizes:"
    echo "   Backend: $(du -sh dist/ 2>/dev/null | cut -f1)"
    echo "   Frontend: $(du -sh frontend/dist/ 2>/dev/null | cut -f1)"
fi

echo ""
print_status "🎉 Production build completed successfully!"
print_status "Ready to deploy with PM2:"
echo "   npm run pm2:start:prod"
echo "" 