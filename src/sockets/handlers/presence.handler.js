'use strict';

const cacheService = require('../../cache/cache.service');
const cacheKeys = require('../../cache/cache.keys');
const logger = require('../../helpers/logger.helper');

const registerPresenceHandlers = (socket, io) => {
  const userId = socket.user.id;

  const setOnline = async () => {
    await cacheService.set(cacheKeys.presence(userId), { status: 'online', lastSeen: new Date() }, 3600);
    socket.broadcast.emit('presence:online', { userId });
    logger.debug('User came online', { userId });
  };

  const setOffline = async () => {
    await cacheService.set(cacheKeys.presence(userId), { status: 'offline', lastSeen: new Date() }, 3600);
    socket.broadcast.emit('presence:offline', { userId });
    logger.debug('User went offline', { userId });
  };

  setOnline();

  socket.on('presence:ping', () => {
    cacheService.set(cacheKeys.presence(userId), { status: 'online', lastSeen: new Date() }, 3600);
  });

  socket.on('disconnect', setOffline);
};

module.exports = { registerPresenceHandlers };
