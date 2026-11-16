'use strict';

const { ForbiddenError, UnauthorizedError } = require('../exceptions');
const { ROLE_PERMISSIONS } = require('../permissions');

/**
 * authorize(['user.read', 'user.create'])
 * User must have ALL listed permissions (use authorizeAny for OR logic).
 */
const authorize = (requiredPermissions = []) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAll = requiredPermissions.every(
      (p) => userPermissions.includes(p) || userPermissions.includes('*')
    );

    if (!hasAll) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    return next();
  };

/**
 * authorizeAny(['user.read', 'user.create'])
 * User must have at least ONE of the listed permissions.
 */
const authorizeAny = (requiredPermissions = []) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAny =
      userPermissions.includes('*') ||
      requiredPermissions.some((p) => userPermissions.includes(p));

    if (!hasAny) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    return next();
  };

module.exports = { authorize, authorizeAny };
