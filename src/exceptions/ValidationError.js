'use strict';

const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }

  static fromJoi(joiError) {
    const errors = joiError.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));
    return new ValidationError('Validation failed', errors);
  }
}

module.exports = ValidationError;
