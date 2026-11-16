'use strict';

module.exports = {
  user: (id) => `user:${id}`,
  userByEmail: (email) => `user:email:${email}`,
  userList: (tenantId = 'global') => `users:list:${tenantId}`,

  refreshToken: (tokenHash) => `rt:${tokenHash}`,
  accessTokenBlocklist: (jti) => `atb:${jti}`,

  otp: (userId, type) => `otp:${type}:${userId}`,
  emailVerification: (token) => `ev:${token}`,
  passwordReset: (token) => `pr:${token}`,

  rateLimit: (identifier) => `rl:${identifier}`,

  session: (sessionId) => `session:${sessionId}`,

  presence: (userId) => `presence:${userId}`,
  onlineUsers: (room) => `online:${room}`,

  custom: (...parts) => parts.join(':'),
};
