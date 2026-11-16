'use strict';

const BaseService = require('../../services/base.service');
const userRepository = require('./user.repository');
const cacheService = require('../../cache/cache.service');
const cacheKeys = require('../../cache/cache.keys');
const { CACHE_TTL, EVENTS } = require('./user.constants');
const { toPrivateProfile, toAdminView } = require('./user.mapper');
const { ConflictError, ForbiddenError } = require('../../exceptions');
const { emitUserEvent } = require('./user.events');
const logger = require('../../helpers/logger.helper');

class UserService extends BaseService {
  constructor() {
    super(userRepository);
  }

  async getAllUsers(options = {}) {
    const result = await userRepository.findMany({
      ...options,
      select: require('./user.constants').DEFAULT_SELECT,
    });
    result.data = result.data.map(toPrivateProfile);
    return result;
  }

  async getUserById(id, requestingUser) {
    const cacheKey = cacheKeys.user(id);
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await userRepository.findByIdOrFail(id);
        const isAdminView = ['SUPER_ADMIN', 'ADMIN'].includes(requestingUser?.role);
        return isAdminView ? toAdminView(user) : toPrivateProfile(user);
      },
      CACHE_TTL
    );
  }

  async updateProfile(id, data, requestingUserId) {
    if (id !== requestingUserId) {
      const requester = await userRepository.findById(requestingUserId);
      if (!['SUPER_ADMIN', 'ADMIN'].includes(requester?.role)) {
        throw new ForbiddenError('You can only update your own profile');
      }
    }

    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new ConflictError('Username is already taken');
      }
    }

    const updated = await userRepository.updateById(id, {
      ...data,
      updatedBy: requestingUserId,
    });

    await cacheService.del(cacheKeys.user(id));
    emitUserEvent(EVENTS.UPDATED, updated);
    return toPrivateProfile(updated);
  }

  async updateStatus(id, status, requestingUserId) {
    const user = await userRepository.findByIdOrFail(id);
    await userRepository.updateStatus(id, status, requestingUserId);
    await cacheService.del(cacheKeys.user(id));
    emitUserEvent(EVENTS.STATUS_CHANGED, { id, status });
    logger.info('User status updated', { userId: id, status, by: requestingUserId });
    return { id, status };
  }

  async updateRole(id, role, requestingUserId) {
    const user = await userRepository.findByIdOrFail(id);
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('Cannot change SUPER_ADMIN role');
    }
    await userRepository.updateRole(id, role, requestingUserId);
    await cacheService.del(cacheKeys.user(id));
    emitUserEvent(EVENTS.ROLE_CHANGED, { id, role });
    return { id, role };
  }

  async deleteUser(id, requestingUserId) {
    await userRepository.findByIdOrFail(id);
    await userRepository.softDelete(id, requestingUserId);
    await cacheService.del(cacheKeys.user(id));
    emitUserEvent(EVENTS.DELETED, { id });
  }

  async searchUsers(search, options = {}) {
    const result = await userRepository.searchUsers(search, options);
    result.data = result.data.map(toPrivateProfile);
    return result;
  }
}

module.exports = new UserService();
