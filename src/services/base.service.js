'use strict';

const logger = require('../helpers/logger.helper');

class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(options = {}) {
    return this.repository.findMany(options);
  }

  async getById(id, options = {}) {
    return this.repository.findByIdOrFail(id, options);
  }

  async create(data, createdBy = null) {
    return this.repository.create({
      data: { ...data, ...(createdBy ? { createdBy } : {}) },
    });
  }

  async update(id, data, updatedBy = null) {
    await this.repository.findByIdOrFail(id);
    return this.repository.updateById(id, {
      ...data,
      ...(updatedBy ? { updatedBy } : {}),
    });
  }

  async delete(id, deletedBy = null) {
    await this.repository.findByIdOrFail(id);
    return this.repository.softDelete(id, deletedBy);
  }

  async exists(where) {
    return this.repository.exists(where);
  }

  _log(level, message, meta = {}) {
    logger[level](message, { service: this.constructor.name, ...meta });
  }
}

module.exports = BaseService;
