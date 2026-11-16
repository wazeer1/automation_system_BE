'use strict';

const BaseRepository = require('../../repositories/base.repository');
const { DEFAULT_SELECT } = require('./user.constants');

class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  async findByEmail(email) {
    return this.findOne({ where: { email }, select: DEFAULT_SELECT });
  }

  async findByUsername(username) {
    return this.findOne({ where: { username }, select: DEFAULT_SELECT });
  }

  async searchUsers(search, options = {}) {
    return this.findMany({
      where: {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: DEFAULT_SELECT,
      ...options,
    });
  }

  async findByRole(role, options = {}) {
    return this.findMany({ where: { role }, select: DEFAULT_SELECT, ...options });
  }

  async updateStatus(id, status, updatedBy) {
    return this.updateById(id, { status, updatedBy });
  }

  async updateRole(id, role, updatedBy) {
    return this.updateById(id, { role, updatedBy });
  }

  async updateAvatar(id, avatar, updatedBy) {
    return this.updateById(id, { avatar, updatedBy });
  }
}

module.exports = new UserRepository();
