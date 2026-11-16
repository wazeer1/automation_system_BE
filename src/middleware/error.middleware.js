'use strict';

const { Prisma } = require('@prisma/client');
const { AppError, ValidationError, ConflictError, NotFoundError } = require('../exceptions');
const logger = require('../helpers/logger.helper');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // ── Map Prisma errors ──────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      error = new ConflictError(`A record with this ${field} already exists`);
    } else if (err.code === 'P2025') {
      error = new NotFoundError('Record');
    } else {
      error = new AppError('Database error', 500, 'DATABASE_ERROR');
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new ValidationError('Invalid data provided');
  }

  // ── Operational errors (expected) ─────────────────────────────────────────
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error('Operational error', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        path: req.path,
        method: req.method,
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
  }

  // ── Unknown / programmer errors ───────────────────────────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    errors: [],
  });
};

const notFoundHandler = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    errors: [],
  });

module.exports = { errorHandler, notFoundHandler };
