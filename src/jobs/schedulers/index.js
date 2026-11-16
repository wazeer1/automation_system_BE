'use strict';

const { QueueScheduler } = require('bullmq');
const { connection } = require('../queues');
const logger = require('../../helpers/logger.helper');

const startSchedulers = () => {
  // QueueScheduler handles delayed/retry jobs correctly in distributed environments
  const emailScheduler = new QueueScheduler('email', { connection });
  const notificationScheduler = new QueueScheduler('notification', { connection });

  logger.info('Job schedulers started');
  return { emailScheduler, notificationScheduler };
};

module.exports = { startSchedulers };
