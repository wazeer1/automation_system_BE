'use strict';

require('dotenv').config();

const path = require('path');

const loggerConfig = {
  level: process.env.LOG_LEVEL || 'debug',
  format: process.env.LOG_FORMAT || 'combined',

  directory: path.join(process.cwd(), 'src', 'logs'),

  files: {
    error: {
      filename: 'error-%DATE%.log',
      level: 'error',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      zippedArchive: true,
    },
    combined: {
      filename: 'combined-%DATE%.log',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      zippedArchive: true,
    },
    exceptions: {
      filename: 'exceptions-%DATE%.log',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      zippedArchive: true,
    },
  },

  console: {
    colorize: process.env.NODE_ENV !== 'production',
    silent: process.env.NODE_ENV === 'test',
  },
};

module.exports = loggerConfig;
