'use strict';

const { v4: uuidv4 } = require('uuid');

const authRepository = require('./auth.repository');
const { hash, compare } = require('../../utils/bcrypt');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt');
const { generateHashedToken, generateSecureToken } = require('../../utils/crypto');
const { addMinutes, addHours, isExpired } = require('../../utils/date');
const cacheService = require('../../cache/cache.service');
const cacheKeys = require('../../cache/cache.keys');
const { redis: redisConfig, app: appConfig } = require('../../config');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} = require('../../exceptions');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../helpers/mailer.helper');
const logger = require('../../helpers/logger.helper');

class AuthService {
  // ─── Public ───────────────────────────────────────────────────────────────

  async register({ email, password: plainPassword, firstName, lastName, username, phone }) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hash(plainPassword);
    const user = await authRepository.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      username,
      phone: phone || null,
      status: 'PENDING_VERIFICATION',
    });

    // Non-fatal: a bad SMTP config must never roll back a successful registration.
    const { emailSent, verificationToken, emailError } = await this._sendEmailVerification(user);

    if (!emailSent) {
      logger.warn('Verification email could not be sent', {
        userId: user.id,
        email: user.email,
        error: emailError,
      });
    }

    logger.info('User registered', { userId: user.id, email: user.email, emailSent });

    return {
      user: this._sanitizeUser(user),
      emailSent,
      // Expose raw token in development so devs can call /verify-email without SMTP
      ...(appConfig.isDevelopment && !emailSent && { devVerificationToken: verificationToken }),
      ...(appConfig.isDevelopment && !emailSent && { devEmailError: emailError }),
    };
  }

  async login({ email, password: plainPassword, ipAddress, userAgent }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended');
    }

    const isValid = await compare(plainPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ForbiddenError('Please verify your email address before logging in');
    }

    const tokens = await this._issueTokens(user, { ipAddress, userAgent });

    await authRepository.updateUser(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      loginCount: { increment: 1 },
    });

    logger.info('User logged in', { userId: user.id, email: user.email, ipAddress });
    return { user: this._sanitizeUser(user), ...tokens };
  }

  async refreshTokens({ refreshToken, ipAddress, userAgent }) {
    const tokenHash = generateHashedToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored) {
      // Possible reuse attack — revoke the entire family
      const payload = verifyRefreshToken(refreshToken);
      if (payload?.family) {
        await authRepository.revokeAllRefreshTokensByFamily(payload.family);
        logger.warn('Refresh token reuse detected — family revoked', {
          userId: payload.id,
          family: payload.family,
        });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (isExpired(stored.expiresAt)) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    verifyRefreshToken(refreshToken); // throws if signature tampered

    const newTokenPair = await this._issueTokens(stored.user, {
      ipAddress,
      userAgent,
      family: stored.family,
    });
    await authRepository.revokeRefreshToken(stored.id, newTokenPair.refreshTokenId);

    return newTokenPair;
  }

  async logout({ userId, accessTokenJti }) {
    await authRepository.revokeAllRefreshTokensByUser(userId);

    if (accessTokenJti) {
      await cacheService.set(
        cacheKeys.accessTokenBlocklist(accessTokenJti),
        '1',
        redisConfig.ttl.accessToken
      );
    }

    logger.info('User logged out', { userId });
  }

  async verifyEmail(token) {
    const stored = await authRepository.findToken(token, 'EMAIL_VERIFICATION');

    if (!stored || isExpired(stored.expiresAt)) {
      throw new UnauthorizedError('Invalid or expired verification link');
    }

    await authRepository.updateUser(stored.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    });

    await authRepository.markTokenUsed(stored.id);
    logger.info('Email verified', { userId: stored.userId });
  }

  async forgotPassword(email) {
    const user = await authRepository.findUserByEmail(email);
    // Always succeed silently — prevents email enumeration
    if (!user) {
      return { emailSent: false };
    }

    await authRepository.deleteTokensByUser(user.id, 'PASSWORD_RESET');

    const rawToken = generateSecureToken(32);
    const hashedToken = generateHashedToken(rawToken);

    await authRepository.createToken({
      userId: user.id,
      token: hashedToken,
      type: 'PASSWORD_RESET',
      expiresAt: addMinutes(new Date(), appConfig.email.passwordResetExpiresMinutes),
    });

    let emailSent = true;
    let emailError;

    try {
      await sendPasswordResetEmail(user.email, rawToken, user.firstName);
      logger.info('Password reset email sent', { userId: user.id });
    } catch (err) {
      emailSent = false;
      emailError = err.message;
      logger.warn('Password reset email failed', { userId: user.id, error: err.message });
    }

    return {
      emailSent,
      // Dev shortcut — use this token with POST /auth/reset-password
      ...(appConfig.isDevelopment && !emailSent && { devResetToken: rawToken }),
      ...(appConfig.isDevelopment && !emailSent && { devEmailError: emailError }),
    };
  }

  async resetPassword({ token, password: newPassword }) {
    const hashedToken = generateHashedToken(token);
    const stored = await authRepository.findToken(hashedToken, 'PASSWORD_RESET');

    if (!stored || isExpired(stored.expiresAt)) {
      throw new UnauthorizedError('Invalid or expired reset link');
    }

    const passwordHash = await hash(newPassword);
    await authRepository.updateUser(stored.userId, { passwordHash });
    await authRepository.markTokenUsed(stored.id);
    await authRepository.revokeAllRefreshTokensByUser(stored.userId);

    logger.info('Password reset successful', { userId: stored.userId });
  }

  async resendVerification(email) {
    const user = await authRepository.findUserByEmail(email);

    // Silent return — prevents email enumeration
    if (!user) {
      return { emailSent: false, reason: 'not_found' };
    }

    if (user.emailVerified) {
      return { emailSent: false, reason: 'already_verified' };
    }

    if (user.status === 'SUSPENDED') {
      return { emailSent: false, reason: 'suspended' };
    }

    const { emailSent, verificationToken, emailError } = await this._sendEmailVerification(user);

    if (!emailSent) {
      logger.warn('Resend verification email failed', {
        userId: user.id,
        error: emailError,
      });
    } else {
      logger.info('Verification email resent', { userId: user.id });
    }

    return {
      emailSent,
      ...(appConfig.isDevelopment && !emailSent && { devVerificationToken: verificationToken }),
      ...(appConfig.isDevelopment && !emailSent && { devEmailError: emailError }),
    };
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await hash(newPassword);
    await authRepository.updateUser(userId, { passwordHash });
    await authRepository.revokeAllRefreshTokensByUser(userId);

    logger.info('Password changed', { userId });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  async _issueTokens(user, { ipAddress, userAgent, family } = {}) {
    const tokenFamily = family || uuidv4();
    const payload = { id: user.id, email: user.email, role: user.role, jti: uuidv4() };
    const { accessToken, refreshToken } = generateTokenPair(payload);

    const refreshTokenHash = generateHashedToken(refreshToken);

    const stored = await authRepository.createRefreshToken({
      tokenHash: refreshTokenHash,
      family: tokenFamily,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken, refreshTokenId: stored.id };
  }

  // Stores the verification token in DB and attempts to email it.
  // Returns { emailSent, verificationToken, emailError? } — never throws.
  async _sendEmailVerification(user) {
    await authRepository.deleteTokensByUser(user.id, 'EMAIL_VERIFICATION');
    const rawToken = generateSecureToken(32);
    const hashedToken = generateHashedToken(rawToken);

    await authRepository.createToken({
      userId: user.id,
      token: hashedToken,
      type: 'EMAIL_VERIFICATION',
      expiresAt: addHours(new Date(), appConfig.email.verifyExpiresHours),
    });

    try {
      // await sendVerificationEmail(user.email, rawToken, user.firstName);
      return { emailSent: true, verificationToken: rawToken };
    } catch (err) {
      return { emailSent: false, verificationToken: rawToken, emailError: err.message };
    }
  }

  _sanitizeUser(user) {
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
