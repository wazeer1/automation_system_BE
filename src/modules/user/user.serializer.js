'use strict';

const { toPublicProfile, toPrivateProfile, toAdminView } = require('./user.mapper');

const serializeForRole = (user, requestingRole) => {
  if (['SUPER_ADMIN', 'ADMIN'].includes(requestingRole)) {
    return toAdminView(user);
  }
  if (['MANAGER', 'STAFF'].includes(requestingRole)) {
    return toPrivateProfile(user);
  }
  return toPublicProfile(user);
};

const serializeList = (users, requestingRole) =>
  users.map((u) => serializeForRole(u, requestingRole));

module.exports = { serializeForRole, serializeList };
