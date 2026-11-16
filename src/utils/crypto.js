'use strict';

const crypto = require('crypto');

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const generateHashedToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokenPair = () => {
  const raw = generateSecureToken(32);
  const hashed = generateHashedToken(raw);
  return { raw, hashed };
};

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
  generateSecureToken,
  generateHashedToken,
  generateTokenPair,
  timingSafeEqual,
};
