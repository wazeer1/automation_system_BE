'use strict';

const { app: appConfig } = require('../config');

const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    appConfig.pagination.maxPageSize,
    Math.max(1, parseInt(query.limit, 10) || appConfig.pagination.defaultPageSize)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

const paginateResponse = (data, total, page, limit) => ({
  data,
  pagination: buildPaginationMeta(total, page, limit),
});

module.exports = { getPaginationParams, buildPaginationMeta, paginateResponse };
