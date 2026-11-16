'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../exceptions');
const cacheService = require('../cache/cache.service');
const cacheKeys = require('../cache/cache.keys');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Check blocklist (logout / token rotation invalidation)
    const isBlocked = await cacheService.exists(cacheKeys.accessTokenBlocklist(payload.jti));
    if (isBlocked) {
      throw new UnauthorizedError('Token has been revoked');
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
    }
    next();
  } catch {
    next(); // non-fatal
  }
};

module.exports = { authenticate, optionalAuth };
