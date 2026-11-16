'use strict';

const { userEventEmitter } = require('./user.events');
const { EVENTS } = require('./user.constants');
const logger = require('../../helpers/logger.helper');

const registerUserSocketHandlers = (io) => {
  userEventEmitter.on(EVENTS.UPDATED, (data) => {
    io.to(`user:${data.id}`).emit('user:updated', data);
    logger.debug('Socket: user updated', { userId: data.id });
  });

  userEventEmitter.on(EVENTS.STATUS_CHANGED, (data) => {
    io.to(`user:${data.id}`).emit('user:status_changed', data);
    io.to('admins').emit('user:status_changed', data);
  });

  userEventEmitter.on(EVENTS.ROLE_CHANGED, (data) => {
    io.to(`user:${data.id}`).emit('user:role_changed', data);
  });
};

module.exports = { registerUserSocketHandlers };
