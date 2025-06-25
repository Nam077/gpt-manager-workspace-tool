# PM2 Configuration for GPT Manager

## Cài đặt PM2

```bash
# Cài đặt PM2 global
npm install -g pm2

# Hoặc sử dụng yarn
yarn global add pm2
```

## Cấu trúc project

```
gpt-manager-workspace-tool/
├── ecosystem.config.js    # PM2 configuration
├── src/                   # Backend source
├── frontend/              # Frontend source  
└── logs/
    └── pm2/              # PM2 logs directory
```

## Sử dụng PM2

### 1. Build project trước khi chạy production

```bash
# Build cả backend và frontend
npm run build:all

# Hoặc dùng script production (có cleaning và verification)
npm run build:prod

# Build riêng lẻ
npm run build              # Backend only
npm run build:frontend     # Frontend only

# Auto build khi start PM2
npm run pm2:start:prod
```

### 2. Khởi chạy các services

```bash
# Development mode (auto build frontend)
npm run pm2:start

# Production mode (auto build frontend)
npm run pm2:start:prod

# Staging mode (auto build frontend)
npm run pm2:start:staging

# Chỉ chạy backend
npm run pm2:backend

# Chỉ chạy frontend (cần build trước)
npm run build:frontend && npm run pm2:frontend
```

### 3. Quản lý services

```bash
# Xem trạng thái
npm run pm2:status

# Xem logs
npm run pm2:logs

# Monitor real-time
npm run pm2:monit

# Restart services
npm run pm2:restart

# Reload services (zero-downtime)
npm run pm2:reload

# Stop services
npm run pm2:stop

# Delete services
npm run pm2:delete
```

### 4. Các lệnh PM2 trực tiếp

```bash
# Xem danh sách processes
pm2 list

# Xem logs của một service cụ thể
pm2 logs gpt-manager-backend
pm2 logs gpt-manager-frontend

# Restart một service cụ thể
pm2 restart gpt-manager-backend

# Stop một service cụ thể
pm2 stop gpt-manager-backend

# Xem monitoring dashboard
pm2 monit

# Xem thông tin chi tiết
pm2 describe gpt-manager-backend
```

## Environment Variables

### Development
- `NODE_ENV=development`
- `PORT=3232`

### Production  
- `NODE_ENV=production`
- `PORT=3232`

### Staging
- `NODE_ENV=staging` 
- `PORT=3233`

## Logging

PM2 logs được lưu trong thư mục `logs/pm2/`:

- `combined.log` - Tất cả logs của backend
- `out.log` - Standard output của backend
- `error.log` - Error logs của backend
- `frontend-combined.log` - Tất cả logs của frontend
- `frontend-out.log` - Standard output của frontend
- `frontend-error.log` - Error logs của frontend

## Auto-restart Settings

- **Memory limit**: 1GB (backend sẽ restart nếu vượt quá)
- **Max restarts**: 10 lần trong khoảng thời gian ngắn
- **Min uptime**: 10 giây trước khi considered stable
- **Restart delay**: 1 giây giữa các lần restart

## Cluster Mode (Optional)

Để enable cluster mode cho backend:

```javascript
// Trong ecosystem.config.js
{
  name: 'gpt-manager-backend',
  instances: 'max', // Hoặc số cụ thể như 2, 4
  exec_mode: 'cluster'
}
```

## Production Deployment

1. **Setup server**:
```bash
# Cài đặt dependencies
npm install --production

# Build project
npm run build

# Start với PM2
npm run pm2:start:prod
```

2. **Auto-startup** (Linux/macOS):
```bash
# Lưu current PM2 processes
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions từ lệnh trên
```

3. **Monitoring**:
```bash
# PM2 Plus monitoring (optional)
pm2 link <secret_key> <public_key>

# Local monitoring
pm2 monit
```

## Troubleshooting

### Service không start
```bash
# Check logs
pm2 logs gpt-manager-backend

# Check project build
npm run build

# Check file permissions
ls -la dist/src/main.js
```

### Memory leaks
```bash
# Monitor memory usage
pm2 monit

# Restart nếu cần
pm2 restart gpt-manager-backend
```

### Port conflicts
```bash
# Check ports đang sử dụng
lsof -i :3232

# Kill process nếu cần
kill -9 <PID>
```

## Best Practices

1. **Always build** trước khi start production
2. **Monitor logs** thường xuyên
3. **Set memory limits** phù hợp
4. **Use environment variables** cho configuration
5. **Setup log rotation** để tránh logs files quá lớn
6. **Test trên staging** trước khi deploy production 