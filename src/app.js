'use strict';

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const { app: appConfig } = require('./config');
const corsMiddleware = require('./middleware/cors.middleware');
const helmetMiddleware = require('./middleware/helmet.middleware');
const { globalLimiter } = require('./middleware/rate-limit.middleware');
const { sanitizeNoSQL, preventHPP, trimStrings } = require('./middleware/sanitize.middleware');
const { requestLogger, requestIdMiddleware } = require('./middleware/logger.middleware');
const { resolveTenant } = require('./middleware/tenant.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const routes = require('./routes');
const { setupSwagger } = require('./docs/swagger');

const createApp = () => {
  const app = express();

  // ── Security ───────────────────────────────────────────────────────────────
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.set('trust proxy', 1);

  // ── Request parsing ────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression());

  // ── Sanitization ───────────────────────────────────────────────────────────
  app.use(sanitizeNoSQL);
  app.use(preventHPP);
  app.use(trimStrings);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Logging & Request ID ───────────────────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ── Multi-tenancy ──────────────────────────────────────────────────────────
  app.use(resolveTenant);

  // ── Static files ───────────────────────────────────────────────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ── API Documentation ──────────────────────────────────────────────────────
  if (!appConfig.isProduction) {
    setupSwagger(app);
  }

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use(appConfig.apiPrefix, routes);

  // ── 404 ────────────────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
