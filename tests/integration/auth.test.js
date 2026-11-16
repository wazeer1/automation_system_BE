'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');
const authRepository = require('../../src/modules/auth/auth.repository');
const { hash } = require('../../src/utils/bcrypt');
const { makeUser } = require('../fixtures/user.fixture');

jest.mock('../../src/modules/auth/auth.repository');
jest.mock('../../src/cache/cache.service', () => ({
  exists: jest.fn().mockResolvedValue(false),
  set: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/helpers/mailer.helper', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendMail: jest.fn().mockResolvedValue(true),
}));

const app = createApp();

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue(
        makeUser({ emailVerified: false, status: 'PENDING_VERIFICATION' })
      );
      authRepository.deleteTokensByUser.mockResolvedValue(true);
      authRepository.createToken.mockResolvedValue({ id: 'token-id' });

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'newuser@example.com',
        password: 'Pass@word1',
        firstName: 'New',
        lastName: 'User',
        username: 'newuser',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 409 when email already exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue(makeUser());

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'existing@example.com',
        password: 'Pass@word1',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'Pass@word1',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in successfully with valid credentials', async () => {
      const passwordHash = await hash('Pass@word1');
      const user = makeUser({ passwordHash, emailVerified: true, status: 'ACTIVE' });

      authRepository.findUserByEmail.mockResolvedValue(user);
      authRepository.updateUser.mockResolvedValue(user);
      authRepository.createRefreshToken.mockResolvedValue({ id: 'rt-id' });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'Pass@word1',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('returns 401 for wrong password', async () => {
      const passwordHash = await hash('CorrectPass@1');
      const user = makeUser({ passwordHash, emailVerified: true });
      authRepository.findUserByEmail.mockResolvedValue(user);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'WrongPass@1',
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown user', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'ghost@example.com',
        password: 'Pass@word1',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
