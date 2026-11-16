'use strict';

const { PrismaClient } = require('@prisma/client');
const { db: dbConfig } = require('../config');
const logger = require('../helpers/logger.helper');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: dbConfig.prisma.log.map((level) => ({
        emit: 'event',
        level,
      })),
      errorFormat: dbConfig.prisma.errorFormat,
    });

    prisma.$on('query', (e) => {
      logger.debug('Prisma Query', { query: e.query, duration: `${e.duration}ms` });
    });

    prisma.$on('warn', (e) => {
      logger.warn('Prisma Warning', { message: e.message });
    });

    prisma.$on('error', (e) => {
      logger.error('Prisma Error', { message: e.message });
    });
  }
  return prisma;
};

const connect = async () => {
  const client = getPrismaClient();
  await client.$connect();
  logger.info('Database connected');
  return client;
};

const disconnect = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

const healthCheck = async () => {
  const client = getPrismaClient();
  await client.$queryRaw`SELECT 1`;
  return { status: 'ok', db: 'postgresql' };
};

module.exports = {
  get prisma() {
    return getPrismaClient();
  },
  connect,
  disconnect,
  healthCheck,
};
