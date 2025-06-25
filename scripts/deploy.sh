#!/bin/bash

# Quick Deploy Script
echo "🚀 Quick Deploy to Production..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true

# Build everything
print_status "Building project..."
npm run build:all
if [ $? -ne 0 ]; then
    print_error "Build failed! Aborting deployment."
    exit 1
fi

# Start PM2 in production mode
print_status "Starting PM2 in production mode..."
npm run pm2:start:prod
if [ $? -ne 0 ]; then
    print_error "Failed to start PM2!"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
print_status "Services running:"
pm2 status

echo ""
print_status "Useful commands:"
echo "  pm2 logs        - View logs"
echo "  pm2 monit       - Monitor dashboard"
echo "  pm2 restart all - Restart services" 