'use strict';

const Redis = require('ioredis');
const { redis: redisConfig } = require('../config');
const logger = require('../helpers/logger.helper');

let client;

const getRedisClient = () => {
  if (!client) {
    client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      tls: redisConfig.tls,
      retryStrategy: redisConfig.retryStrategy,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      enableReadyCheck: redisConfig.enableReadyCheck,
      lazyConnect: redisConfig.lazyConnect,
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('ready', () => logger.info('Redis ready'));
    client.on('error', (err) => logger.error('Redis error', { error: err.message }));
    client.on('close', () => logger.warn('Redis connection closed'));
    client.on('reconnecting', () => logger.info('Redis reconnecting'));
  }
  return client;
};

const disconnect = async () => {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis disconnected');
  }
};

const healthCheck = async () => {
  const c = getRedisClient();
  const result = await c.ping();
  return { status: result === 'PONG' ? 'ok' : 'error', store: 'redis' };
};

module.exports = {
  get client() {
    return getRedisClient();
  },
  disconnect,
  healthCheck,
};
