'use strict';

require('dotenv').config();

const appConfig = {
  name: process.env.APP_NAME || 'GreenLight',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  host: process.env.APP_HOST || 'localhost',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api',

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },

  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  },

  multiTenant: {
    enabled: process.env.MULTI_TENANT === 'true',
    header: process.env.TENANT_HEADER || 'x-tenant-id',
  },

  otp: {
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10,
  },

  email: {
    verifyExpiresHours: parseInt(process.env.EMAIL_VERIFY_EXPIRES_HOURS, 10) || 24,
    passwordResetExpiresMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES, 10) || 60,
  },
};

module.exports = appConfig;
