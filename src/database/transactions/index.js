'use strict';

const { prisma } = require('../index');
const { DatabaseError } = require('../../exceptions');

const withTransaction = async (fn) => {
  try {
    return await prisma.$transaction(fn, {
      maxWait: 5000,  // 5s max wait for a connection
      timeout: 10000, // 10s transaction timeout
    });
  } catch (err) {
    throw new DatabaseError('Transaction failed', err);
  }
};

module.exports = { withTransaction };
