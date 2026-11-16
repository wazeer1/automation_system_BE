'use strict';

const Joi = require('joi');
const { uuid, email, username, name, phone, url } = require('../../validators/common.validator');
const { ROLES, STATUSES } = require('./user.constants');

const updateProfileSchema = Joi.object({
  firstName: name.optional(),
  lastName: name.optional(),
  username: username.optional(),
  phone: phone.optional().allow(''),
  avatar: url.optional().allow(''),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid(...ROLES).required(),
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid(...STATUSES),
  sort: Joi.string(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const searchQuerySchema = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  updateProfileSchema,
  updateStatusSchema,
  updateRoleSchema,
  listQuerySchema,
  searchQuerySchema,
};
