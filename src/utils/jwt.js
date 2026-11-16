'use strict';

const jwt = require('jsonwebtoken');
const { auth: authConfig } = require('../config');
const { UnauthorizedError } = require('../exceptions');

const signAccessToken = (payload) =>
  jwt.sign(payload, authConfig.jwt.accessSecret, {
    expiresIn: authConfig.jwt.accessExpiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.accessSecret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token has expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token has expired');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
};

const decodeToken = (token) => jwt.decode(token);

const generateTokenPair = (payload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateTokenPair,
};
