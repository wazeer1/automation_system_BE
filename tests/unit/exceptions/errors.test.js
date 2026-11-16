'use strict';

const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} = require('../../../src/exceptions');

describe('Exception Classes', () => {
  describe('AppError', () => {
    it('sets all properties correctly', () => {
      const err = new AppError('Test error', 400, 'TEST_CODE', [{ field: 'test' }]);
      expect(err.message).toBe('Test error');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('TEST_CODE');
      expect(err.errors).toHaveLength(1);
      expect(err.isOperational).toBe(true);
      expect(err instanceof Error).toBe(true);
    });

    it('serializes to JSON correctly', () => {
      const err = new AppError('msg', 500, 'CODE');
      const json = err.toJSON();
      expect(json.success).toBe(false);
      expect(json.message).toBe('msg');
    });
  });

  describe('ValidationError', () => {
    it('has status 422 and correct code', () => {
      const err = new ValidationError();
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
    });

    it('creates from Joi error correctly', () => {
      const joiError = {
        details: [
          { path: ['email'], message: '"email" is required' },
          { path: ['password', 'min'], message: '"password" must be at least 8 characters' },
        ],
      };
      const err = ValidationError.fromJoi(joiError);
      expect(err.errors).toHaveLength(2);
      expect(err.errors[0].field).toBe('email');
    });
  });

  describe('NotFoundError', () => {
    it('includes resource name in message', () => {
      const err = new NotFoundError('User');
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('returns 401', () => {
      expect(new UnauthorizedError().statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('returns 403', () => {
      expect(new ForbiddenError().statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('returns 409', () => {
      expect(new ConflictError().statusCode).toBe(409);
    });
  });

  describe('DatabaseError', () => {
    it('returns 500 and stores original error', () => {
      const original = new Error('pg error');
      const err = new DatabaseError('DB failed', original);
      expect(err.statusCode).toBe(500);
      expect(err.originalError).toBe(original);
    });
  });
});
