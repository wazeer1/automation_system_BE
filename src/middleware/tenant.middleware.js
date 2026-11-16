'use strict';

const { app: appConfig } = require('../config');
const { ForbiddenError } = require('../exceptions');

const resolveTenant = (req, _res, next) => {
  if (!appConfig.multiTenant.enabled) {
    return next();
  }

  const tenantId = req.headers[appConfig.multiTenant.header];

  if (!tenantId) {
    return next(new ForbiddenError('Tenant identifier is required'));
  }

  req.tenantId = tenantId;
  return next();
};

module.exports = { resolveTenant };
