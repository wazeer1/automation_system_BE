'use strict';

const authService = require('./auth.service');
const { success, created } = require('../../helpers/response.helper');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      const message = result.emailSent
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. Verification email could not be sent — use the token below to verify manually.';

      created(res, result, message);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const tokens = await authService.refreshTokens({
        refreshToken: req.body.refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      success(res, tokens, 'Tokens refreshed');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout({
        userId: req.user.id,
        accessTokenJti: req.user.jti,
      });
      success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.query.token);
      success(res, null, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const result = await authService.resendVerification(req.body.email);

      const messages = {
        already_verified: 'Your email is already verified. You can log in.',
        suspended: 'If that email is registered and eligible, a verification link has been sent.',
        not_found: 'If that email is registered and eligible, a verification link has been sent.',
      };

      const message = result.emailSent
        ? 'Verification email sent. Please check your inbox.'
        : (messages[result.reason] || 'Verification email could not be sent — use the token below.');

      success(res, result.emailSent ? null : result, message);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      // Always the same message — prevents email enumeration
      success(
        res,
        result?.devResetToken ? result : null,
        'If that email is registered, a reset link has been sent.'
      );
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body);
      success(res, null, 'Password reset successful');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      await authService.changePassword({ userId: req.user.id, ...req.body });
      success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      success(res, req.user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
