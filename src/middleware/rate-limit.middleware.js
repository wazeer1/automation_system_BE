'use strict';

const rateLimit = require('express-rate-limit');
const { app: appConfig } = require('../config');

const createRateLimiter = (options = {}) =>
  rateLimit({
    windowMs: options.windowMs || appConfig.rateLimit.windowMs,
    max: options.max || appConfig.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      errors: [],
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    ...options,
  });

const globalLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: appConfig.rateLimit.authMax,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    errors: [],
  },
});

const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
});

module.exports = { createRateLimiter, globalLimiter, authLimiter, strictLimiter };
