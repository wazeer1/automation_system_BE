'use strict';

require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'gl:',

  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,

  retryStrategy: (times) => {
    if (times > 10) {
      return null; // stop retrying
    }
    return Math.min(times * 200, 3000);
  },

  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,

  ttl: {
    accessToken: 15 * 60,           // 15 minutes
    refreshToken: 7 * 24 * 60 * 60, // 7 days
    otp: 10 * 60,                   // 10 minutes
    cache: 5 * 60,                  // 5 minutes
    session: 24 * 60 * 60,          // 24 hours
    rateLimit: 15 * 60,             // 15 minutes
  },
};

module.exports = redisConfig;
