'use strict';

const { ROLE_HIERARCHY } = require('../../middleware/role.middleware');
const { ForbiddenError } = require('../../exceptions');

const canUpdateUser = (requestingUser, targetUser) => {
  if (requestingUser.id === targetUser.id) {
    return true;
  }
  const requestingLevel = ROLE_HIERARCHY[requestingUser.role] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0;
  return requestingLevel > targetLevel;
};

const canDeleteUser = (requestingUser, targetUser) => {
  if (requestingUser.id === targetUser.id) {
    throw new ForbiddenError('You cannot delete your own account');
  }
  const requestingLevel = ROLE_HIERARCHY[requestingUser.role] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0;
  return requestingLevel > targetLevel;
};

const canAssignRole = (requestingUser, newRole) => {
  const requestingLevel = ROLE_HIERARCHY[requestingUser.role] || 0;
  const targetLevel = ROLE_HIERARCHY[newRole] || 0;
  // Cannot assign a role equal to or higher than your own
  return requestingLevel > targetLevel;
};

module.exports = { canUpdateUser, canDeleteUser, canAssignRole };
