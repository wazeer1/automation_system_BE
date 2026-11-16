'use strict';

const { Router } = require('express');
const controller = require('./auth.controller');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rate-limit.middleware');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  resendVerificationSchema,
} = require('./auth.validator');

const router = Router();

// =============================================================================
// Swagger Tag
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: >
 *     Registration, login, JWT token rotation, email verification,
 *     and password management.
 *     All auth mutation routes are rate-limited to 10 req / 15 min per IP.
 */

// =============================================================================
// POST /auth/register
// =============================================================================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: >
 *       Creates a new user in `PENDING_VERIFICATION` status and sends a
 *       verification email. The account cannot log in until the email is verified.
 *       Rate limited to **10 requests / 15 min** per IP.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             standard:
 *               summary: Typical registration
 *               value:
 *                 email: jane.doe@example.com
 *                 password: "SecureP@ss1"
 *                 firstName: Jane
 *                 lastName: Doe
 *                 username: janedoe
 *                 phone: "+14155552671"
 *             minimal:
 *               summary: Minimal (no phone)
 *               value:
 *                 email: john.smith@example.com
 *                 password: "P@ssw0rd!"
 *                 firstName: John
 *                 lastName: Smith
 *                 username: johnsmith
 *     responses:
 *       201:
 *         description: Account created — verification email dispatched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *             example:
 *               success: true
 *               message: "Registration successful. Please verify your email."
 *               data:
 *                 id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 email: jane.doe@example.com
 *                 firstName: Jane
 *                 lastName: Doe
 *                 username: janedoe
 *                 avatar: null
 *                 phone: "+14155552671"
 *                 role: USER
 *                 status: PENDING_VERIFICATION
 *                 emailVerified: false
 *                 lastLoginAt: null
 *                 createdAt: "2024-06-01T10:00:00.000Z"
 *                 updatedAt: "2024-06-01T10:00:00.000Z"
 *       409:
 *         description: Email address is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *             example:
 *               success: false
 *               message: "An account with this email already exists"
 *               code: CONFLICT
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/register', authLimiter, validateBody(registerSchema), controller.register.bind(controller));

// =============================================================================
// POST /auth/login
// =============================================================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: >
 *       Validates credentials and returns a JWT **access token** (15 min)
 *       and a **refresh token** (7 days). The refresh token is rotated on each
 *       use and invalidated on logout.
 *       Rate limited to **10 requests / 15 min** per IP.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: jane.doe@example.com
 *             password: "SecureP@ss1"
 *     responses:
 *       200:
 *         description: Login successful — token pair returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExYjJjM2Q0IiwiZW1haWwiOiJqYW5lLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIiwianRpIjoianRpLXV1aWQiLCJpYXQiOjE3MTcyMzAwMDB9.sig"
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.sig"
 *                 user:
 *                   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   email: jane.doe@example.com
 *                   firstName: Jane
 *                   lastName: Doe
 *                   username: janedoe
 *                   role: USER
 *                   status: ACTIVE
 *                   emailVerified: true
 *                   lastLoginAt: "2024-06-01T10:30:00.000Z"
 *       401:
 *         description: Invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             examples:
 *               badCredentials:
 *                 summary: Wrong email or password
 *                 value:
 *                   success: false
 *                   message: "Invalid email or password"
 *                   code: UNAUTHORIZED
 *                   errors: []
 *               unverifiedEmail:
 *                 summary: Email not verified
 *                 value:
 *                   success: false
 *                   message: "Please verify your email address before logging in"
 *                   code: FORBIDDEN
 *                   errors: []
 *       403:
 *         description: Account suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *             example:
 *               success: false
 *               message: "Your account has been suspended"
 *               code: FORBIDDEN
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', authLimiter, validateBody(loginSchema), controller.login.bind(controller));

// =============================================================================
// POST /auth/refresh
// =============================================================================

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate the JWT token pair
 *     description: >
 *       Exchanges a valid **refresh token** for a fresh access token + refresh
 *       token pair. The old refresh token is immediately revoked (token rotation).
 *
 *       **Reuse detection:** if a previously-used refresh token is submitted, the
 *       entire token family is revoked, forcing a fresh login.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.sig"
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *             example:
 *               success: true
 *               message: Tokens refreshed
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-access.sig"
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-refresh.sig"
 *       401:
 *         description: Refresh token is invalid, expired, or has been reused
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             examples:
 *               invalid:
 *                 summary: Token not found or revoked
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired refresh token"
 *                   code: UNAUTHORIZED
 *                   errors: []
 *               reuse:
 *                 summary: Token reuse detected (family revoked)
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired refresh token"
 *                   code: UNAUTHORIZED
 *                   errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh.bind(controller));

// =============================================================================
// POST /auth/logout
// =============================================================================

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and invalidate all tokens
 *     description: >
 *       Revokes **all refresh tokens** for the authenticated user and adds the
 *       current access token's `jti` to the Redis blocklist (TTL = remaining
 *       token lifetime). Subsequent requests with the same access token will
 *       receive `401 Token has been revoked`.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: Logged out successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/logout', authenticate, controller.logout.bind(controller));

// =============================================================================
// POST /auth/resend-verification
// =============================================================================

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     description: >
 *       Issues a fresh verification token and re-sends the verification email
 *       for an account still in `PENDING_VERIFICATION` status.
 *       Always returns `200` regardless of whether the email exists — this
 *       prevents account enumeration.
 *
 *       **Development mode:** if the SMTP transport fails, the raw
 *       `devVerificationToken` is included in the response body so you can
 *       call `GET /auth/verify-email?token=<devVerificationToken>` directly
 *       without a working mail server.
 *
 *       Rate limited to **10 requests / 15 min** per IP.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: jane.doe@example.com
 *     responses:
 *       200:
 *         description: Request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   nullable: true
 *                   type: object
 *                   description: "`null` in production. In development (SMTP down) contains `devVerificationToken`."
 *                   properties:
 *                     devVerificationToken:
 *                       type: string
 *                       description: Raw token — paste into `GET /auth/verify-email?token=<value>` (dev only)
 *                     devEmailError:
 *                       type: string
 *                       description: SMTP error message (dev only)
 *             examples:
 *               emailSent:
 *                 summary: Email delivered
 *                 value:
 *                   success: true
 *                   message: "Verification email sent. Please check your inbox."
 *                   data: null
 *               alreadyVerified:
 *                 summary: Account already verified
 *                 value:
 *                   success: true
 *                   message: "Your email is already verified. You can log in."
 *                   data: null
 *               devSmtpDown:
 *                 summary: SMTP unavailable (development only)
 *                 value:
 *                   success: true
 *                   message: "Verification email could not be sent — use the token below."
 *                   data:
 *                     devVerificationToken: "a3f2b1e4d5c6789012345678901234567890abcdef"
 *                     devEmailError: "Invalid login: 535 5.7.0 Invalid credentials"
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/resend-verification', authLimiter, validateBody(resendVerificationSchema), controller.resendVerification.bind(controller));

// =============================================================================
// GET /auth/verify-email
// =============================================================================

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify a user's email address
 *     description: >
 *       Consumes the one-time token from the verification email link.
 *       Sets `emailVerified = true` and transitions the account status from
 *       `PENDING_VERIFICATION` → `ACTIVE`. The token is single-use and
 *       expires in **24 hours**.
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: One-time verification token from the email link
 *         schema:
 *           type: string
 *           example: "a3f2b1e4d5c6789012345678901234567890abcdef1234567890abcdef12345678"
 *     responses:
 *       200:
 *         description: Email verified — account is now ACTIVE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: Email verified successfully
 *               data: null
 *       401:
 *         description: Token is invalid, already used, or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             example:
 *               success: false
 *               message: "Invalid or expired verification link"
 *               code: UNAUTHORIZED
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/verify-email', validateQuery(verifyEmailSchema), controller.verifyEmail.bind(controller));

// =============================================================================
// POST /auth/forgot-password
// =============================================================================

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password-reset email
 *     description: >
 *       Sends a password-reset link to the supplied email address **if it
 *       belongs to a registered account**. Always returns `200` regardless of
 *       whether the email is found — this prevents email enumeration.
 *
 *       The link contains a single-use token that expires in **60 minutes**.
 *       Any existing pending reset tokens for the user are invalidated.
 *       Rate limited to **10 requests / 15 min** per IP.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: jane.doe@example.com
 *     responses:
 *       200:
 *         description: Request accepted (email sent if address is registered)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: "If that email is registered, a reset link has been sent."
 *               data: null
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), controller.forgotPassword.bind(controller));

// =============================================================================
// POST /auth/reset-password
// =============================================================================

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a reset-email token
 *     description: >
 *       Consumes the single-use reset token and sets a new password.
 *       On success, **all active refresh tokens** for the account are revoked,
 *       requiring a fresh login on all devices.
 *       The token expires in **60 minutes**.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             token: "a3f2b1e4d5c6789012345678901234567890abcdef1234567890abcdef12345678"
 *             password: "NewP@ssword1"
 *             confirmPassword: "NewP@ssword1"
 *     responses:
 *       200:
 *         description: Password reset successful — all sessions invalidated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: Password reset successful
 *               data: null
 *       401:
 *         description: Token is invalid, already used, or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             example:
 *               success: false
 *               message: "Invalid or expired reset link"
 *               code: UNAUTHORIZED
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/reset-password', validateBody(resetPasswordSchema), controller.resetPassword.bind(controller));

// =============================================================================
// POST /auth/change-password
// =============================================================================

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password while authenticated
 *     description: >
 *       Allows an authenticated user to update their own password by
 *       supplying their **current** password for verification.
 *       On success, all existing refresh tokens are revoked — the client
 *       should re-login to obtain fresh tokens.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: "OldP@ssword1"
 *             newPassword: "NewP@ssword1"
 *             confirmPassword: "NewP@ssword1"
 *     responses:
 *       200:
 *         description: Password changed — all other sessions invalidated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: Password changed successfully
 *               data: null
 *       401:
 *         description: Not authenticated, or current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *             examples:
 *               noToken:
 *                 summary: No token
 *                 value:
 *                   success: false
 *                   message: No token provided
 *                   code: UNAUTHORIZED
 *                   errors: []
 *               wrongCurrent:
 *                 summary: Wrong current password
 *                 value:
 *                   success: false
 *                   message: Current password is incorrect
 *                   code: UNAUTHORIZED
 *                   errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/change-password', authenticate, validateBody(changePasswordSchema), controller.changePassword.bind(controller));

// =============================================================================
// GET /auth/me
// =============================================================================

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     description: >
 *       Returns the JWT payload of the authenticated user. For a full,
 *       database-fresh profile (including avatar, phone, loginCount, etc.)
 *       use `GET /users/me`.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: Profile fetched
 *               data:
 *                 id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 email: jane.doe@example.com
 *                 firstName: Jane
 *                 lastName: Doe
 *                 username: janedoe
 *                 role: USER
 *                 status: ACTIVE
 *                 emailVerified: true
 *                 lastLoginAt: "2024-06-01T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me', authenticate, controller.me.bind(controller));

module.exports = router;
