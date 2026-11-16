'use strict';

const { Worker } = require('bullmq');
const { connection } = require('../queues');
const emailProcessor = require('../processors/email.processor');
const logger = require('../../helpers/logger.helper');

const workerOptions = { connection, concurrency: 5 };

const startWorkers = () => {
  const emailWorker = new Worker('email', emailProcessor, workerOptions);

  emailWorker.on('completed', (job) => {
    logger.info('Job completed', { queue: 'email', jobId: job.id });
  });

  emailWorker.on('failed', (job, err) => {
    logger.error('Job failed', { queue: 'email', jobId: job?.id, error: err.message });
  });

  emailWorker.on('error', (err) => {
    logger.error('Worker error', { queue: 'email', error: err.message });
  });

  logger.info('Job workers started');
  return { emailWorker };
};

module.exports = { startWorkers };
