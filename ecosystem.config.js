module.exports = {
    apps: [
        {
            name: 'gpt-manager-backend',
            script: 'dist/src/main.js',
            cwd: './',
            instances: 1, // Có thể tăng lên nếu muốn cluster mode
            exec_mode: 'fork', // Hoặc 'cluster' nếu muốn chạy nhiều instances
            env: {
                NODE_ENV: 'development',
                PORT: 3232,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3232,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 3233,
            },
            // Restart settings
            watch: false, // Set true nếu muốn auto-restart khi file thay đổi
            ignore_watch: ['node_modules', 'logs', 'frontend/dist', 'frontend/node_modules'],
            restart_delay: 1000,
            max_restarts: 10,
            min_uptime: '10s',

            // Memory and CPU settings
            max_memory_restart: '1G',

            // Logging
            log_file: './logs/pm2/combined.log',
            out_file: './logs/pm2/out.log',
            error_file: './logs/pm2/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Auto restart settings
            autorestart: true,

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 8000,

            // Health check
            health_check_grace_period: 3000,
        },

        // Frontend server
        {
            name: 'gpt-manager-frontend',
            script: 'npm',
            args: 'run preview:host',
            cwd: './frontend',
            env: {
                NODE_ENV: 'development',
                VITE_API_BASE_URL: 'http://localhost:3232',
            },
            env_production: {
                NODE_ENV: 'production',
                VITE_API_BASE_URL: 'http://localhost:3232',
            },
            env_staging: {
                NODE_ENV: 'staging',
                VITE_API_BASE_URL: 'http://localhost:3233',
            },
            // Frontend specific settings
            watch: false,
            autorestart: true,
            max_restarts: 5,
            min_uptime: '10s',

            // Logging
            log_file: './logs/pm2/frontend-combined.log',
            out_file: './logs/pm2/frontend-out.log',
            error_file: './logs/pm2/frontend-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            ignore_watch: ['node_modules', 'dist'],
        },
    ],

    deploy: {
        production: {
            user: 'node',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:username/gpt-manager-workspace-tool.git',
            path: '/var/www/gpt-manager',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
        },
    },
};
