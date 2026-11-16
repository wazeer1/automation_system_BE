'use strict';

const { sendMail } = require('../../helpers/mailer.helper');
const logger = require('../../helpers/logger.helper');

const emailProcessor = async (job) => {
  const { to, subject, html, text, attachments } = job.data;

  logger.info('Processing email job', { jobId: job.id, to, subject });

  try {
    await sendMail({ to, subject, html, text, attachments });
    logger.info('Email job completed', { jobId: job.id, to });
  } catch (err) {
    logger.error('Email job failed', { jobId: job.id, error: err.message });
    throw err; // let BullMQ retry
  }
};

module.exports = emailProcessor;
