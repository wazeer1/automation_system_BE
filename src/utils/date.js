'use strict';

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);
const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const isExpired = (expiryDate) => new Date() > new Date(expiryDate);

const toUnixTimestamp = (date = new Date()) => Math.floor(date.getTime() / 1000);

const fromUnixTimestamp = (timestamp) => new Date(timestamp * 1000);

const formatDate = (date, locale = 'en-US', options = {}) =>
  new Date(date).toLocaleDateString(locale, options);

module.exports = {
  addMinutes,
  addHours,
  addDays,
  isExpired,
  toUnixTimestamp,
  fromUnixTimestamp,
  formatDate,
};
