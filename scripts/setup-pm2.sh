#!/bin/bash

# Setup PM2 Environment Script
echo "🚀 Setting up PM2 environment for GPT Manager..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        print_status "PM2 installed successfully!"
    else
        print_error "Failed to install PM2. Please install manually: npm install -g pm2"
        exit 1
    fi
else
    print_status "PM2 is already installed"
fi

# Create logs directory
print_status "Creating logs directories..."
mkdir -p logs/pm2
mkdir -p logs/application
chmod 755 logs/pm2
chmod 755 logs/application

# Build the backend
print_status "Building the backend..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed! Please fix build errors before continuing."
    exit 1
fi

# Build the frontend
print_status "Building the frontend..."
npm run build:frontend
if [ $? -ne 0 ]; then
    print_error "Frontend build failed! Please fix build errors before continuing."
    exit 1
fi

# Check if built files exist
if [ ! -f "dist/src/main.js" ]; then
    print_error "Built main.js file not found at dist/src/main.js"
    exit 1
fi

print_status "Build completed successfully!"

# Setup PM2 ecosystem
print_status "Setting up PM2 ecosystem..."

# Stop any existing processes
pm2 delete ecosystem.config.js 2>/dev/null || true

print_status "PM2 environment setup completed!"

echo ""
echo "📋 Available commands:"
echo "  npm run pm2:start         - Start in development mode"
echo "  npm run pm2:start:prod    - Start in production mode"
echo "  npm run pm2:status        - Check process status"
echo "  npm run pm2:logs          - View logs"
echo "  npm run pm2:monit         - Open monitoring dashboard"
echo ""

# Ask user what to do next
read -p "Would you like to start the application now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting application in development mode..."
    npm run pm2:start
    
    echo ""
    print_status "Application started! Use 'npm run pm2:status' to check status."
    print_status "View logs with 'npm run pm2:logs'"
    print_status "Monitor with 'npm run pm2:monit'"
else
    print_status "Setup completed. You can start the application later with 'npm run pm2:start'"
fi

echo ""
print_status "Setup complete! 🎉" 