'use strict';

const { Queue } = require('bullmq');
const { redis: redisConfig } = require('../../config');

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password || undefined,
  db: redisConfig.db,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

const emailQueue = new Queue('email', { connection, defaultJobOptions });
const notificationQueue = new Queue('notification', { connection, defaultJobOptions });
const reportQueue = new Queue('report', {
  connection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
});

module.exports = { emailQueue, notificationQueue, reportQueue, connection };
