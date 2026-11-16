'use strict';

const { prisma } = require('../database');
const { NotFoundError, DatabaseError } = require('../exceptions');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

class BaseRepository {
  constructor(modelName) {
    this.model = prisma[modelName];
    this.modelName = modelName;
  }

  get _model() {
    return this.model;
  }

  // ─── Soft Delete Filter ───────────────────────────────────────────────────

  _notDeleted() {
    return { deletedAt: null };
  }

  // ─── Find Many with Pagination ────────────────────────────────────────────

  async findMany({ where = {}, orderBy = { createdAt: 'desc' }, include, select, query = {} } = {}) {
    try {
      const { page, limit, skip } = getPaginationParams(query);
      const filter = { ...where, ...this._notDeleted() };

      const [total, data] = await Promise.all([
        this.model.count({ where: filter }),
        this.model.findMany({
          where: filter,
          orderBy,
          skip,
          take: limit,
          ...(include ? { include } : {}),
          ...(select ? { select } : {}),
        }),
      ]);

      return { data, pagination: buildPaginationMeta(total, page, limit) };
    } catch (err) {
      throw new DatabaseError(`Failed to fetch ${this.modelName} list`, err);
    }
  }

  // ─── Find One ─────────────────────────────────────────────────────────────

  async findOne({ where, include, select } = {}) {
    try {
      return await this.model.findFirst({
        where: { ...where, ...this._notDeleted() },
        ...(include ? { include } : {}),
        ...(select ? { select } : {}),
      });
    } catch (err) {
      throw new DatabaseError(`Failed to fetch ${this.modelName}`, err);
    }
  }

  async findById(id, options = {}) {
    const record = await this.findOne({ where: { id }, ...options });
    return record;
  }

  async findByIdOrFail(id, options = {}) {
    const record = await this.findById(id, options);
    if (!record) {
      throw new NotFoundError(this.modelName);
    }
    return record;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create({ data, include, select } = {}) {
    try {
      return await this.model.create({
        data,
        ...(include ? { include } : {}),
        ...(select ? { select } : {}),
      });
    } catch (err) {
      throw new DatabaseError(`Failed to create ${this.modelName}`, err);
    }
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update({ where, data, include, select } = {}) {
    try {
      return await this.model.update({
        where,
        data,
        ...(include ? { include } : {}),
        ...(select ? { select } : {}),
      });
    } catch (err) {
      throw new DatabaseError(`Failed to update ${this.modelName}`, err);
    }
  }

  async updateById(id, data, options = {}) {
    return this.update({ where: { id }, data, ...options });
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────

  async softDelete(id, updatedBy = null) {
    return this.updateById(id, {
      deletedAt: new Date(),
      ...(updatedBy ? { updatedBy } : {}),
    });
  }

  // ─── Hard Delete (use sparingly) ──────────────────────────────────────────

  async hardDelete(where) {
    try {
      return await this.model.delete({ where });
    } catch (err) {
      throw new DatabaseError(`Failed to delete ${this.modelName}`, err);
    }
  }

  // ─── Count ────────────────────────────────────────────────────────────────

  async count(where = {}) {
    try {
      return await this.model.count({ where: { ...where, ...this._notDeleted() } });
    } catch (err) {
      throw new DatabaseError(`Failed to count ${this.modelName}`, err);
    }
  }

  // ─── Exists ───────────────────────────────────────────────────────────────

  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  // ─── Upsert ───────────────────────────────────────────────────────────────

  async upsert({ where, create, update, include, select } = {}) {
    try {
      return await this.model.upsert({
        where,
        create,
        update,
        ...(include ? { include } : {}),
        ...(select ? { select } : {}),
      });
    } catch (err) {
      throw new DatabaseError(`Failed to upsert ${this.modelName}`, err);
    }
  }
}

module.exports = BaseRepository;
