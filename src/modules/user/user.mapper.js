'use strict';

const toPublicProfile = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  avatar: user.avatar,
});

const toPrivateProfile = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  avatar: user.avatar,
  phone: user.phone,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const toAdminView = (user) => ({
  ...toPrivateProfile(user),
  tenantId: user.tenantId,
  loginCount: user.loginCount,
  lastLoginIp: user.lastLoginIp,
  deletedAt: user.deletedAt,
  createdBy: user.createdBy,
  updatedBy: user.updatedBy,
});

module.exports = { toPublicProfile, toPrivateProfile, toAdminView };
