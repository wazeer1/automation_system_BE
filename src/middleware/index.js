'use strict';

module.exports = {
  auth: require('./auth.middleware'),
  role: require('./role.middleware'),
  permission: require('./permission.middleware'),
  error: require('./error.middleware'),
  validation: require('./validation.middleware'),
  upload: require('./upload.middleware'),
  rateLimit: require('./rate-limit.middleware'),
  sanitize: require('./sanitize.middleware'),
  cors: require('./cors.middleware'),
  helmet: require('./helmet.middleware'),
  logger: require('./logger.middleware'),
  audit: require('./audit.middleware'),
  cache: require('./cache.middleware'),
  tenant: require('./tenant.middleware'),
};
