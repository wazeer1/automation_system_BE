'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { logger: loggerConfig } = require('../config');

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack || message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const makeRotateTransport = (options) =>
  new DailyRotateFile({
    dirname: loggerConfig.directory,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: options.zippedArchive ?? true,
    maxSize: options.maxSize || '20m',
    maxFiles: options.maxFiles || '14d',
    filename: options.filename,
    level: options.level,
  });

const logger = winston.createLogger({
  level: loggerConfig.level,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: process.env.APP_NAME || 'greenlight' },
  transports: [
    makeRotateTransport(loggerConfig.files.combined),
    makeRotateTransport(loggerConfig.files.error),
  ],
  exceptionHandlers: [makeRotateTransport(loggerConfig.files.exceptions)],
  rejectionHandlers: [makeRotateTransport(loggerConfig.files.exceptions)],
  exitOnError: false,
});

if (!loggerConfig.console.silent) {
  logger.add(
    new winston.transports.Console({
      silent: loggerConfig.console.silent,
    })
  );
}

module.exports = logger;
