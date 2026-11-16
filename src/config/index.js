'use strict';

module.exports = {
  app: require('./app.config'),
  db: require('./db.config'),
  auth: require('./auth.config'),
  redis: require('./redis.config'),
  socket: require('./socket.config'),
  storage: require('./storage.config'),
  logger: require('./logger.config'),
  mail: require('./mail.config'),
};
