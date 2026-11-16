'use strict';

const { Router } = require('express');
const { router: authRouter } = require('../../modules/auth');
const { router: userRouter } = require('../../modules/user');

const router = Router();

// Health check (v1-scoped)
router.get('/health', (_req, res) =>
  res.json({ success: true, version: 'v1', status: 'ok', timestamp: new Date().toISOString() })
);

router.use('/auth', authRouter);
router.use('/users', userRouter);

// Add new modules here:
// router.use('/projects', projectRouter);
// router.use('/reports', reportRouter);

module.exports = router;
