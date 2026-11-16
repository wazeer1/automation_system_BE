'use strict';

const { v4: uuidv4 } = require('uuid');

const makeUser = (overrides = {}) => ({
  id: uuidv4(),
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  passwordHash: '$2a$12$hashedpassword',
  avatar: null,
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: true,
  emailVerifiedAt: new Date(),
  lastLoginAt: null,
  lastLoginIp: null,
  loginCount: 0,
  tenantId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
  updatedBy: null,
  ...overrides,
});

const makeAdmin = (overrides = {}) =>
  makeUser({ role: 'ADMIN', email: 'admin@example.com', username: 'adminuser', ...overrides });

const makeSuperAdmin = (overrides = {}) =>
  makeUser({ role: 'SUPER_ADMIN', email: 'superadmin@example.com', username: 'superadmin', ...overrides });

module.exports = { makeUser, makeAdmin, makeSuperAdmin };
