'use strict';

const { socketAuthMiddleware } = require('./handlers/auth.handler');
const { registerNotificationHandlers } = require('./handlers/notification.handler');
const { registerPresenceHandlers } = require('./handlers/presence.handler');
const { registerUserSocketHandlers } = require('../modules/user/user.socket');
const logger = require('../helpers/logger.helper');

const registerNamespaces = (io) => {
  // ── /notifications namespace ─────────────────────────────────────────────
  const notifNs = io.of('/notifications');
  notifNs.use(socketAuthMiddleware);

  notifNs.on('connection', (socket) => {
    logger.info('Notification socket connected', { userId: socket.user.id, id: socket.id });

    socket.join(`user:${socket.user.id}`);
    if (['SUPER_ADMIN', 'ADMIN'].includes(socket.user.role)) {
      socket.join('admins');
    }

    registerNotificationHandlers(socket);

    socket.on('disconnect', () => {
      logger.info('Notification socket disconnected', { userId: socket.user.id });
    });
  });

  // ── /presence namespace ──────────────────────────────────────────────────
  const presenceNs = io.of('/presence');
  presenceNs.use(socketAuthMiddleware);

  presenceNs.on('connection', (socket) => {
    logger.info('Presence socket connected', { userId: socket.user.id });
    registerPresenceHandlers(socket, presenceNs);
  });

  // ── Module event bridges ─────────────────────────────────────────────────
  registerUserSocketHandlers(notifNs);

  return io;
};

module.exports = { registerNamespaces };
