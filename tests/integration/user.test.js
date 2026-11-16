'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');
const { signAccessToken } = require('../../src/utils/jwt');
const { makeUser, makeAdmin } = require('../fixtures/user.fixture');

jest.mock('../../src/modules/user/user.repository');
jest.mock('../../src/cache/cache.service', () => ({
  exists: jest.fn().mockResolvedValue(false),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  getOrSet: jest.fn().mockImplementation((_key, fn) => fn()),
}));

const userRepository = require('../../src/modules/user/user.repository');
const app = createApp();

const makeAuthToken = (user) => {
  const { v4: uuidv4 } = require('uuid');
  return signAccessToken({ id: user.id, email: user.email, role: user.role, jti: uuidv4() });
};

describe('User API', () => {
  describe('GET /api/v1/users/me', () => {
    it('returns own profile for authenticated user', async () => {
      const user = makeUser();
      userRepository.findByIdOrFail.mockResolvedValue(user);

      const token = makeAuthToken(user);
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('returns user list for ADMIN', async () => {
      const admin = makeAdmin();
      userRepository.model = {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([makeUser(), makeUser()]),
      };
      userRepository.findMany.mockResolvedValue({
        data: [makeUser(), makeUser()],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const token = makeAuthToken(admin);
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 for USER role', async () => {
      const user = makeUser({ role: 'USER' });
      const token = makeAuthToken(user);

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
