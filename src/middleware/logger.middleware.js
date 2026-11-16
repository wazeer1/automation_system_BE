'use strict';

const morgan = require('morgan');
const logger = require('../helpers/logger.helper');

const morganStream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  ':remote-addr :method :url :status :response-time ms - :res[content-length]',
  { stream: morganStream, skip: () => process.env.NODE_ENV === 'test' }
);

const requestIdMiddleware = (req, _res, next) => {
  req.requestId = require('crypto').randomUUID();
  next();
};

module.exports = { requestLogger, requestIdMiddleware };
