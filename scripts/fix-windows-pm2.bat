@echo off
echo "🔧 Fixing PM2 on Windows..."

echo "Stopping existing processes..."
pm2 stop all
pm2 delete all

echo "Building project..."
npm run build:all

echo "Starting with Windows-specific config..."
pm2 start ecosystem.windows.config.js --env production

echo "✅ Fixed! PM2 now running with Windows config"
pm2 status 