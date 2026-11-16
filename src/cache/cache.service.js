'use strict';

const { client } = require('./redis');
const { redis: redisConfig } = require('../config');
const logger = require('../helpers/logger.helper');

const DEFAULT_TTL = redisConfig.ttl.cache;

const set = async (key, value, ttl = DEFAULT_TTL) => {
  const serialized = JSON.stringify(value);
  if (ttl) {
    await client.setex(key, ttl, serialized);
  } else {
    await client.set(key, serialized);
  }
};

const get = async (key) => {
  const value = await client.get(key);
  if (value === null) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const del = async (...keys) => client.del(...keys);

const exists = async (key) => {
  const count = await client.exists(key);
  return count > 0;
};

const expire = (key, ttl) => client.expire(key, ttl);

const ttl = (key) => client.ttl(key);

const incr = (key) => client.incr(key);

const incrby = (key, amount) => client.incrby(key, amount);

const setNx = (key, value, ttlSecs) => client.set(key, value, 'EX', ttlSecs, 'NX');

const getOrSet = async (key, fn, ttlSecs = DEFAULT_TTL) => {
  const cached = await get(key);
  if (cached !== null) {
    return cached;
  }
  const fresh = await fn();
  await set(key, fresh, ttlSecs);
  return fresh;
};

const invalidatePattern = async (pattern) => {
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
    logger.debug('Cache invalidated', { pattern, count: keys.length });
  }
};

const hset = (key, field, value) => client.hset(key, field, JSON.stringify(value));

const hget = async (key, field) => {
  const value = await client.hget(key, field);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const hdel = (key, ...fields) => client.hdel(key, ...fields);

module.exports = {
  set,
  get,
  del,
  exists,
  expire,
  ttl,
  incr,
  incrby,
  setNx,
  getOrSet,
  invalidatePattern,
  hset,
  hget,
  hdel,
};
