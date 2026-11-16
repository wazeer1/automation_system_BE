'use strict';

require('dotenv').config();

const http = require('http');
const { createApp } = require('./app');
const { connect: connectDB, disconnect: disconnectDB } = require('./database');
const { disconnect: disconnectRedis } = require('./cache/redis');
const { initSocket } = require('./sockets');
const { startWorkers } = require('./jobs/workers');
const { app: appConfig } = require('./config');
const logger = require('./helpers/logger.helper');

const bootstrap = async () => {
  try {
    // ── Database ─────────────────────────────────────────────────────────────
    await connectDB();

    // ── Express App ──────────────────────────────────────────────────────────
    const app = createApp();
    const server = http.createServer(app);

    // ── Socket.IO ────────────────────────────────────────────────────────────
    initSocket(server);

    // ── BullMQ Workers ───────────────────────────────────────────────────────
    if (appConfig.env !== 'test') {
      startWorkers();
    }

    // ── Start listening ───────────────────────────────────────────────────────
    server.listen(appConfig.port, appConfig.host, () => {
      logger.info(
        `🚀 ${appConfig.name} v${appConfig.version} running`,
        {
          env: appConfig.env,
          url: `http://${appConfig.host}:${appConfig.port}`,
          docs: `http://${appConfig.host}:${appConfig.port}/api-docs`,
          pid: process.pid,
        }
      );
    });

    // ── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        try {
          await disconnectDB();
          await disconnectRedis();
          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { error: err.message });
          process.exit(1);
        }
      });

      // Force kill after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.error('Bootstrap failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});

bootstrap();
