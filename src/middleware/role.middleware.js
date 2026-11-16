'use strict';

const { ForbiddenError, UnauthorizedError } = require('../exceptions');

const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  USER: 1,
};

const requireRole = (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`));
    }
    return next();
  };

const requireMinRole = (minRole) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel < requiredLevel) {
      return next(new ForbiddenError(`Requires minimum role: ${minRole}`));
    }
    return next();
  };

module.exports = { requireRole, requireMinRole, ROLE_HIERARCHY };
