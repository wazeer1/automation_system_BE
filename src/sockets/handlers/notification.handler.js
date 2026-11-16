'use strict';

const logger = require('../../helpers/logger.helper');

const registerNotificationHandlers = (socket) => {
  socket.on('notification:subscribe', () => {
    socket.join(`user:${socket.user.id}`);
    logger.debug('User subscribed to notifications', { userId: socket.user.id });
  });

  socket.on('notification:unsubscribe', () => {
    socket.leave(`user:${socket.user.id}`);
  });
};

module.exports = { registerNotificationHandlers };
