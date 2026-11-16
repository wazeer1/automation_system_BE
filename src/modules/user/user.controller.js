'use strict';

const userService = require('./user.service');
const { success, paginated, noContent } = require('../../helpers/response.helper');
const { getPaginationParams } = require('../../utils/pagination');

class UserController {
  async getAll(req, res, next) {
    try {
      const pagination = getPaginationParams(req.query);
      const result = await userService.getAllUsers({ query: req.query, ...pagination });
      paginated(res, result.data, result.pagination, 'Users fetched');
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user);
      success(res, user, 'User fetched');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id, req.user);
      success(res, user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.params.id, req.body, req.user.id);
      success(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await userService.updateStatus(req.params.id, req.body.status, req.user.id);
      success(res, result, 'User status updated');
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req, res, next) {
    try {
      const result = await userService.updateRole(req.params.id, req.body.role, req.user.id);
      success(res, result, 'User role updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const result = await userService.searchUsers(req.query.q, { query: req.query });
      paginated(res, result.data, result.pagination, 'Search results');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
