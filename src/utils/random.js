'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const uuid = () => uuidv4();

const randomInt = (min, max) => {
  const range = max - min + 1;
  return min + (crypto.randomInt(range));
};

const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];

const randomString = (length = 16) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
};

module.exports = { uuid, randomInt, randomElement, randomString };
