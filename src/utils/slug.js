'use strict';

const slugify = require('slugify');

const toSlug = (text, options = {}) =>
  slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    ...options,
  });

const toUniqueSlug = (text, suffix = '') => {
  const base = toSlug(text);
  return suffix ? `${base}-${suffix}` : base;
};

module.exports = { toSlug, toUniqueSlug };
