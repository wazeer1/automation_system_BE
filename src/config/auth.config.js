'use strict';

require('dotenv').config();

const authConfig = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'greenlight-api',
    audience: process.env.JWT_AUDIENCE || 'greenlight-client',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
};

if (!authConfig.jwt.accessSecret) {
  throw new Error('JWT_ACCESS_SECRET environment variable is required');
}
if (!authConfig.jwt.refreshSecret) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

module.exports = authConfig;
