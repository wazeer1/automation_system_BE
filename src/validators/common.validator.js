'use strict';

const Joi = require('joi');

const uuid = Joi.string().uuid({ version: 'uuidv4' });
const email = Joi.string().email({ tlds: { allow: false } }).lowercase().trim();
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });
const username = Joi.string().alphanum().min(3).max(30).lowercase().trim();
const phone = Joi.string()
  .pattern(/^\+?[1-9]\d{6,14}$/)
  .messages({ 'string.pattern.base': 'Invalid phone number format' });
const name = Joi.string().min(1).max(100).trim();
const url = Joi.string().uri();

const idParam = Joi.object({ id: uuid.required() });

module.exports = { uuid, email, password, username, phone, name, url, idParam };
