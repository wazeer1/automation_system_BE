'use strict';

const bcrypt = require('bcryptjs');
const { auth: authConfig } = require('../config');

const hash = async (plainText) => {
  const salt = await bcrypt.genSalt(authConfig.bcrypt.saltRounds);
  return bcrypt.hash(plainText, salt);
};

const compare = (plainText, hashed) => bcrypt.compare(plainText, hashed);

module.exports = { hash, compare };
