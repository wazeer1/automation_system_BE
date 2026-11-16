'use strict';

const { verifyAccessToken } = require('../../utils/jwt');
const logger = require('../../helpers/logger.helper');

const socketAuthMiddleware = (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.user = payload;
    logger.debug('Socket authenticated', { userId: payload.id, socketId: socket.id });
    return next();
  } catch (err) {
    return next(new Error(err.message));
  }
};

module.exports = { socketAuthMiddleware };
