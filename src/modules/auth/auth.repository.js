'use strict';

const { prisma } = require('../../database');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findUserById(id) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async createUser(data) {
    return prisma.user.create({ data });
  }

  async updateUser(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  // ─── Tokens ────────────────────────────────────────────────────────────────

  async createToken({ userId, token, type, expiresAt }) {
    return prisma.token.create({ data: { userId, token, type, expiresAt } });
  }

  async findToken(token, type) {
    return prisma.token.findFirst({
      where: { token, type, deletedAt: null, usedAt: null },
      include: { user: true },
    });
  }

  async markTokenUsed(id) {
    return prisma.token.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async deleteTokensByUser(userId, type) {
    return prisma.token.updateMany({
      where: { userId, type, usedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Refresh Tokens ────────────────────────────────────────────────────────

  async createRefreshToken(data) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, deletedAt: null },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id, replacedBy = null) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedBy },
    });
  }

  async revokeAllRefreshTokensByFamily(family) {
    return prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokensByUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

module.exports = new AuthRepository();
