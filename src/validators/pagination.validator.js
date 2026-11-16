'use strict';

const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().max(50),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(200).trim(),
}).unknown(true); // allow additional filter fields per module

module.exports = { paginationSchema };
