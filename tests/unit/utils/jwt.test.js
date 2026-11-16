'use strict';

const { signAccessToken, verifyAccessToken, generateTokenPair } = require('../../../src/utils/jwt');
const { UnauthorizedError } = require('../../../src/exceptions');

describe('JWT Utils', () => {
  const payload = { id: 'test-user-id', email: 'test@example.com', role: 'USER', jti: 'test-jti' };

  describe('signAccessToken', () => {
    it('signs a token with the given payload', () => {
      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('verifies a valid token and returns the payload', () => {
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('throws UnauthorizedError for an invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for a tampered token', () => {
      const token = signAccessToken(payload);
      const tampered = `${token}xxx`;
      expect(() => verifyAccessToken(tampered)).toThrow(UnauthorizedError);
    });
  });

  describe('generateTokenPair', () => {
    it('generates accessToken and refreshToken', () => {
      const { accessToken, refreshToken } = generateTokenPair(payload);
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken).not.toBe(refreshToken);
    });
  });
});
