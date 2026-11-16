'use strict';

const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Strip $ and . from request data to prevent NoSQL injection
const sanitizeNoSQL = mongoSanitize({ replaceWith: '_' });

// Prevent HTTP Parameter Pollution
const preventHPP = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filter'],
});

const trimStrings = (req, _res, next) => {
  const trim = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object') {
        trim(obj[key]);
      }
    }
  };
  trim(req.body);
  trim(req.query);
  next();
};

module.exports = { sanitizeNoSQL, preventHPP, trimStrings };
