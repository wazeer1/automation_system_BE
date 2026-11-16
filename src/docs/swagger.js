'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const { app: appConfig } = require('../config');

// =============================================================================
// Reusable Schema Definitions
// =============================================================================

const schemas = {
  // ── Core Entities ──────────────────────────────────────────────────────────

  User: {
    type: 'object',
    description: 'A platform user account',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique identifier (UUIDv4)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Primary email address (unique)',
        example: 'jane.doe@example.com',
      },
      firstName: { type: 'string', example: 'Jane' },
      lastName: { type: 'string', example: 'Doe' },
      username: {
        type: 'string',
        description: 'Unique alphanumeric handle (3–30 chars)',
        example: 'janedoe',
      },
      avatar: {
        type: 'string',
        format: 'uri',
        nullable: true,
        description: 'Profile picture URL',
        example: 'https://cdn.example.com/avatars/janedoe.jpg',
      },
      phone: {
        type: 'string',
        nullable: true,
        description: 'E.164 phone number',
        example: '+14155552671',
      },
      role: {
        type: 'string',
        enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'USER'],
        description: 'RBAC role — determines permissions',
        example: 'USER',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
        description: 'Account lifecycle status',
        example: 'ACTIVE',
      },
      emailVerified: {
        type: 'boolean',
        description: 'Whether the email address has been verified',
        example: true,
      },
      lastLoginAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Timestamp of the most recent successful login',
        example: '2024-06-01T10:30:00.000Z',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T08:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T10:30:00.000Z',
      },
    },
  },

  AuthTokens: {
    type: 'object',
    description: 'JWT access + refresh token pair',
    required: ['accessToken', 'refreshToken'],
    properties: {
      accessToken: {
        type: 'string',
        description: 'Short-lived JWT (15 min) — send as Bearer header',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExYjJjM2Q0LWU1ZjYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImVtYWlsIjoiamFuZS5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImp0aSI6InV1aWQtaGVyZSIsImlhdCI6MTcxNzIzMDAwMH0.signature',
      },
      refreshToken: {
        type: 'string',
        description: 'Long-lived token (7 days) — use to rotate the pair',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature',
      },
    },
  },

  // ── Request Bodies ─────────────────────────────────────────────────────────

  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName', 'username'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Must be unique across the platform',
        example: 'jane.doe@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        maxLength: 128,
        description: 'Min 8 chars — must contain uppercase, lowercase, digit, and special char',
        example: 'SecureP@ss1',
      },
      firstName: { type: 'string', minLength: 1, maxLength: 100, example: 'Jane' },
      lastName: { type: 'string', minLength: 1, maxLength: 100, example: 'Doe' },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        description: 'Alphanumeric, unique, lowercased on save',
        example: 'janedoe',
      },
      phone: {
        type: 'string',
        description: 'Optional E.164 phone number',
        example: '+14155552671',
      },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
      password: { type: 'string', format: 'password', example: 'SecureP@ss1' },
    },
  },

  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        description: 'The refresh token received at login',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature',
      },
    },
  },

  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Registered email address — a reset link will be sent if found',
        example: 'jane.doe@example.com',
      },
    },
  },

  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'password', 'confirmPassword'],
    properties: {
      token: {
        type: 'string',
        description: 'Token received via the password-reset email link',
        example: 'a3f2b1e4d5c6...',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description: 'New password — same complexity rules as registration',
        example: 'NewP@ssword1',
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        description: 'Must exactly match `password`',
        example: 'NewP@ssword1',
      },
    },
  },

  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        description: 'The account\'s existing password',
        example: 'OldP@ssword1',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewP@ssword1',
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        description: 'Must exactly match `newPassword`',
        example: 'NewP@ssword1',
      },
    },
  },

  UpdateProfileRequest: {
    type: 'object',
    minProperties: 1,
    description: 'All fields are optional — at least one must be provided',
    properties: {
      firstName: { type: 'string', minLength: 1, maxLength: 100, example: 'Janet' },
      lastName: { type: 'string', minLength: 1, maxLength: 100, example: 'Doe' },
      username: { type: 'string', minLength: 3, maxLength: 30, example: 'janet_doe' },
      phone: { type: 'string', example: '+14155559999' },
      avatar: { type: 'string', format: 'uri', example: 'https://cdn.example.com/avatar.jpg' },
    },
  },

  UpdateStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
        description: 'New account status',
        example: 'SUSPENDED',
      },
    },
  },

  UpdateRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['ADMIN', 'MANAGER', 'STAFF', 'USER'],
        description: 'New RBAC role — cannot promote to SUPER_ADMIN or to a role equal/higher than your own',
        example: 'MANAGER',
      },
    },
  },

  // ── Success Responses ──────────────────────────────────────────────────────

  RegisterResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Registration successful. Please verify your email.' },
      data: { $ref: '#/components/schemas/User' },
    },
  },

  LoginResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Login successful' },
      data: {
        allOf: [
          { $ref: '#/components/schemas/AuthTokens' },
          {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
            },
          },
        ],
      },
    },
  },

  RefreshResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Tokens refreshed' },
      data: { $ref: '#/components/schemas/AuthTokens' },
    },
  },

  UserResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User fetched' },
      data: { $ref: '#/components/schemas/User' },
    },
  },

  UserListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Users fetched' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/User' },
      },
      pagination: { $ref: '#/components/schemas/PaginationMeta' },
    },
  },

  MessageResponse: {
    type: 'object',
    description: 'Simple success response with no data payload',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { nullable: true, example: null },
    },
  },

  // ── Shared Utility ─────────────────────────────────────────────────────────

  PaginationMeta: {
    type: 'object',
    description: 'Pagination metadata attached to list responses',
    properties: {
      total: { type: 'integer', description: 'Total matching records', example: 42 },
      page: { type: 'integer', description: 'Current page number', example: 1 },
      limit: { type: 'integer', description: 'Records per page', example: 20 },
      totalPages: { type: 'integer', example: 3 },
      hasNextPage: { type: 'boolean', example: true },
      hasPrevPage: { type: 'boolean', example: false },
      nextPage: { type: 'integer', nullable: true, example: 2 },
      prevPage: { type: 'integer', nullable: true, example: null },
    },
  },

  // ── Error Responses ────────────────────────────────────────────────────────

  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Something went wrong' },
      code: { type: 'string', example: 'INTERNAL_ERROR' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'email' },
            message: { type: 'string', example: 'email is required' },
          },
        },
      },
    },
  },

  ValidationErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Validation failed' },
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          required: ['field', 'message'],
          properties: {
            field: { type: 'string', example: 'password' },
            message: {
              type: 'string',
              example: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            },
          },
        },
        example: [
          { field: 'email', message: 'email is required' },
          { field: 'password', message: 'password must be at least 8 characters' },
        ],
      },
    },
  },

  UnauthorizedResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Authentication required' },
      code: { type: 'string', example: 'UNAUTHORIZED' },
      errors: { type: 'array', items: {}, example: [] },
    },
  },

  ForbiddenResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Insufficient permissions' },
      code: { type: 'string', example: 'FORBIDDEN' },
      errors: { type: 'array', items: {}, example: [] },
    },
  },

  NotFoundResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'User not found' },
      code: { type: 'string', example: 'NOT_FOUND' },
      errors: { type: 'array', items: {}, example: [] },
    },
  },

  ConflictResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'An account with this email already exists' },
      code: { type: 'string', example: 'CONFLICT' },
      errors: { type: 'array', items: {}, example: [] },
    },
  },

  RateLimitResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Too many requests, please try again later.' },
      code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
      errors: { type: 'array', items: {}, example: [] },
    },
  },
};

// =============================================================================
// Reusable Response Components
// =============================================================================

const responses = {
  ValidationError: {
    description: 'Request body / query / params failed Joi validation',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
        example: {
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: [
            { field: 'email', message: 'email must be a valid email' },
            { field: 'password', message: 'password must be at least 8 characters' },
          ],
        },
      },
    },
  },

  Unauthorized: {
    description: 'Missing or invalid access token',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/UnauthorizedResponse' },
        examples: {
          missing: {
            summary: 'No token provided',
            value: { success: false, message: 'No token provided', code: 'UNAUTHORIZED', errors: [] },
          },
          expired: {
            summary: 'Token expired',
            value: { success: false, message: 'Access token has expired', code: 'UNAUTHORIZED', errors: [] },
          },
          revoked: {
            summary: 'Token revoked (logged out)',
            value: { success: false, message: 'Token has been revoked', code: 'UNAUTHORIZED', errors: [] },
          },
        },
      },
    },
  },

  Forbidden: {
    description: 'Authenticated but lacking the required permission or role',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ForbiddenResponse' },
        examples: {
          permission: {
            summary: 'Missing permission',
            value: { success: false, message: 'Insufficient permissions', code: 'FORBIDDEN', errors: [] },
          },
          role: {
            summary: 'Role too low',
            value: { success: false, message: 'Requires minimum role: ADMIN', code: 'FORBIDDEN', errors: [] },
          },
        },
      },
    },
  },

  NotFound: {
    description: 'The requested resource does not exist',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/NotFoundResponse' },
      },
    },
  },

  RateLimitError: {
    description: 'Too many requests — back off and retry after the window expires',
    headers: {
      'RateLimit-Limit': { description: 'Request limit per window', schema: { type: 'integer' } },
      'RateLimit-Remaining': { description: 'Remaining requests in the current window', schema: { type: 'integer' } },
      'RateLimit-Reset': { description: 'UTC epoch seconds when the window resets', schema: { type: 'integer' } },
    },
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/RateLimitResponse' },
      },
    },
  },

  InternalError: {
    description: 'Unexpected server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          errors: [],
        },
      },
    },
  },
};

// =============================================================================
// Reusable Parameters
// =============================================================================

const parameters = {
  userId: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'User UUID',
    schema: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  },

  page: {
    name: 'page',
    in: 'query',
    description: 'Page number (1-based)',
    schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
  },

  limit: {
    name: 'limit',
    in: 'query',
    description: 'Records per page (max 100)',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
  },

  sort: {
    name: 'sort',
    in: 'query',
    description: 'Field to sort by',
    schema: { type: 'string', example: 'createdAt' },
  },

  order: {
    name: 'order',
    in: 'query',
    description: 'Sort direction',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
  },
};

// =============================================================================
// Swagger / OpenAPI 3.0 Configuration
// =============================================================================

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${appConfig.name} API`,
      version: appConfig.version,
      description: [
        '## GreenLight Platform API',
        '',
        'Enterprise-grade SaaS backend built with Node.js, Express, PostgreSQL, Prisma, and Redis.',
        '',
        '### Authentication',
        '1. Call `POST /auth/register` to create an account.',
        '2. Verify your email via the link sent to your inbox.',
        '3. Call `POST /auth/login` to receive an `accessToken` (15 min) and `refreshToken` (7 days).',
        '4. Send `Authorization: Bearer <accessToken>` on every protected endpoint.',
        '5. When the access token expires, call `POST /auth/refresh` to rotate the pair.',
        '6. Call `POST /auth/logout` to invalidate all tokens.',
        '',
        '### Role Hierarchy',
        '`SUPER_ADMIN` > `ADMIN` > `MANAGER` > `STAFF` > `USER`',
      ].join('\n'),
      contact: {
        name: 'EnergyScape Renewables Engineering',
        email: 'api@greenlight.com',
      },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    },

    servers: [
      {
        url: `{baseUrl}{apiPrefix}/v1`,
        description: 'v1 — current stable',
        variables: {
          baseUrl: {
            default: appConfig.url,
            description: 'Base URL (change for staging/prod)',
          },
          apiPrefix: {
            default: appConfig.apiPrefix,
          },
        },
      },
      {
        url: `{baseUrl}{apiPrefix}/v2`,
        description: 'v2 — preview',
        variables: {
          baseUrl: { default: appConfig.url },
          apiPrefix: { default: appConfig.apiPrefix },
        },
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your `accessToken` here (without the "Bearer " prefix — Swagger adds it).',
        },
      },
      schemas,
      responses,
      parameters,
    },

    // All endpoints require BearerAuth by default; override with `security: []` for public routes
    security: [{ BearerAuth: [] }],

    tags: [
      {
        name: 'Auth',
        description:
          'Registration, login, token lifecycle, email verification, and password management.',
      },
      {
        name: 'Users',
        description:
          'User profile management, role & status administration, and search. All routes require authentication.',
      },
    ],
  },

  apis: [
    // path.join uses OS separators; glob requires forward slashes on all platforms
    path.resolve(__dirname, '../modules').replace(/\\/g, '/') + '/**/*.routes.js',
    path.resolve(__dirname, './routes').replace(/\\/g, '/') + '/**/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: `${appConfig.name} API Docs`,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2rem; }
        .swagger-ui .scheme-container { background: #fafafa; padding: 12px 20px; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 3,
        docExpansion: 'list',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  );

  // Raw OpenAPI spec (useful for client SDK generation)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec };
