'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');

jest.mock('../../src/database', () => ({
  prisma: {},
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({ status: 'ok', db: 'postgresql' }),
}));

jest.mock('../../src/cache/redis', () => ({
  client: {},
  disconnect: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({ status: 'ok', store: 'redis' }),
}));

jest.mock('../../src/cache/cache.service', () => ({
  exists: jest.fn().mockResolvedValue(false),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
}));

const app = createApp();

describe('Health Endpoints', () => {
  it('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services).toHaveProperty('cache');
  });

  it('GET /api/v1/health returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('v1');
  });

  it('GET /api/unknown-route returns 404', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
