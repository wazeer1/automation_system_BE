'use strict';

const cacheService = require('../cache/cache.service');
const logger = require('../helpers/logger.helper');

const cacheResponse = (keyFn, ttl = 300) =>
  async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;

    try {
      const cached = await cacheService.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      logger.warn('Cache read error', { error: err.message });
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode === 200) {
        try {
          await cacheService.set(key, body, ttl);
          res.setHeader('X-Cache', 'MISS');
        } catch (err) {
          logger.warn('Cache write error', { error: err.message });
        }
      }
      return originalJson(body);
    };

    return next();
  };

module.exports = { cacheResponse };
