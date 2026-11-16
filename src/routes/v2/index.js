'use strict';

const { Router } = require('express');

const router = Router();

// v2 routes inherit v1 base and override/extend as needed
router.get('/health', (_req, res) =>
  res.json({ success: true, version: 'v2', status: 'ok', timestamp: new Date().toISOString() })
);

// router.use('/users', userV2Router);

module.exports = router;
