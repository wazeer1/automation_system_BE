'use strict';

const { Router } = require('express');
const { app: appConfig } = require('../config');
const { healthCheck: dbHealth } = require('../database');
const { healthCheck: redisHealth } = require('../cache/redis');

const router = Router();

// ── Global health check ────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  try {
    const [db, cache] = await Promise.allSettled([dbHealth(), redisHealth()]);

    res.json({
      success: true,
      app: appConfig.name,
      version: appConfig.version,
      environment: appConfig.env,
      timestamp: new Date().toISOString(),
      services: {
        database: db.status === 'fulfilled' ? db.value : { status: 'error' },
        cache: cache.status === 'fulfilled' ? cache.value : { status: 'error' },
      },
    });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Service unavailable' });
  }
});

// ── Versioned API routes ────────────────────────────────────────────────────
router.use('/v1', require('./v1'));
router.use('/v2', require('./v2'));

module.exports = router;
