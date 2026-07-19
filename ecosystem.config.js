'use strict';

module.exports = {
  apps: [
    {
      id: 15,
      name: 'magnus-engine',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/magnus-engine-error.log',
      out_file: 'logs/magnus-engine-out.log',
      merge_logs: true,
    },
  ],
};
