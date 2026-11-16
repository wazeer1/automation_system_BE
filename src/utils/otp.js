'use strict';

const crypto = require('crypto');

const generateOtp = (length = 6) => {
  const max = Math.pow(10, length);
  const buffer = crypto.randomBytes(4);
  const value = buffer.readUInt32BE(0) % max;
  return value.toString().padStart(length, '0');
};

const generateAlphanumericOtp = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
};

module.exports = { generateOtp, generateAlphanumericOtp };
