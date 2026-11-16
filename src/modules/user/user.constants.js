'use strict';

module.exports = {
  CACHE_TTL: 300,
  CACHE_PREFIX: 'user',

  ROLES: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'USER'],
  STATUSES: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],

  EVENTS: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    STATUS_CHANGED: 'user.status_changed',
    ROLE_CHANGED: 'user.role_changed',
  },

  DEFAULT_SELECT: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    username: true,
    avatar: true,
    phone: true,
    role: true,
    status: true,
    emailVerified: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  },
};
