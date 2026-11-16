'use strict';

const { ValidationError } = require('../exceptions');

const validate = (schema, source = 'body') =>
  (req, _res, next) => {
    const data = source === 'body' ? req.body
      : source === 'query' ? req.query
      : source === 'params' ? req.params
      : req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      return next(ValidationError.fromJoi(error));
    }

    // Replace the source with the validated & stripped value
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    }

    return next();
  };

const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = { validate, validateBody, validateQuery, validateParams };
