'use strict';

module.exports = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_SUBSCRIBE: 'notification:subscribe',

  // Presence
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  PRESENCE_PING: 'presence:ping',

  // User
  USER_UPDATED: 'user:updated',
  USER_STATUS_CHANGED: 'user:status_changed',
  USER_ROLE_CHANGED: 'user:role_changed',
};
