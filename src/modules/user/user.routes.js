'use strict';

const { Router } = require('express');
const controller = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/permission.middleware');
const { requireMinRole } = require('../../middleware/role.middleware');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validation.middleware');
const { auditLog } = require('../../middleware/audit.middleware');
const { idParam } = require('../../validators/common.validator');
const {
  updateProfileSchema,
  updateStatusSchema,
  updateRoleSchema,
  listQuerySchema,
  searchQuerySchema,
} = require('./user.validator');
const { PERMISSIONS } = require('../../permissions');

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// Swagger Tag
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: >
 *     User profile management, role & status administration, and search.
 *     All endpoints require a valid `Bearer` token.
 *     Admin-level operations additionally require `user.manage` permission
 *     (ADMIN role or above).
 */

// =============================================================================
// GET /users/me — own profile
// =============================================================================

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the authenticated user's full profile
 *     description: >
 *       Returns the complete, database-fresh profile of the caller.
 *       Unlike `GET /auth/me` (which returns the JWT payload), this endpoint
 *       fetches the latest data from the database and applies role-aware
 *       serialization (e.g. admins see `loginCount`, `lastLoginIp`, etc.).
 *       Response is cached for **5 minutes** per user ID in Redis.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Own profile
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
 *                 avatar: null
 *                 phone: "+14155552671"
 *                 role: USER
 *                 status: ACTIVE
 *                 emailVerified: true
 *                 lastLoginAt: "2024-06-01T10:30:00.000Z"
 *                 createdAt: "2024-01-15T08:00:00.000Z"
 *                 updatedAt: "2024-06-01T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me', controller.getMe.bind(controller));

// =============================================================================
// PATCH /users/me — update own profile
// =============================================================================

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update the authenticated user's own profile
 *     description: >
 *       Updates one or more mutable profile fields for the caller.
 *       At least one field must be provided. The cache entry for this user
 *       is invalidated on success.
 *
 *       **Note:** `email`, `role`, and `status` cannot be changed via this endpoint.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           examples:
 *             updateName:
 *               summary: Change display name
 *               value:
 *                 firstName: Janet
 *                 lastName: Doe-Smith
 *             updateUsername:
 *               summary: Change username
 *               value:
 *                 username: janet_doe
 *             updateAll:
 *               summary: Update everything
 *               value:
 *                 firstName: Janet
 *                 lastName: Doe-Smith
 *                 username: janet_doe
 *                 phone: "+14155559999"
 *                 avatar: "https://cdn.example.com/avatars/janet.jpg"
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: Profile updated
 *               data:
 *                 id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 email: jane.doe@example.com
 *                 firstName: Janet
 *                 lastName: Doe-Smith
 *                 username: janet_doe
 *                 avatar: "https://cdn.example.com/avatars/janet.jpg"
 *                 phone: "+14155559999"
 *                 role: USER
 *                 status: ACTIVE
 *                 emailVerified: true
 *                 lastLoginAt: "2024-06-01T10:30:00.000Z"
 *                 createdAt: "2024-01-15T08:00:00.000Z"
 *                 updatedAt: "2024-06-02T09:00:00.000Z"
 *       409:
 *         description: The requested username is already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *             example:
 *               success: false
 *               message: Username is already taken
 *               code: CONFLICT
 *               errors: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/me', validateBody(updateProfileSchema), controller.updateProfile.bind(controller));

// =============================================================================
// GET /users/search — search users
// =============================================================================

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Full-text search across users
 *     description: >
 *       Case-insensitive search across `email`, `firstName`, `lastName`,
 *       and `username`. Requires `user.read` permission (STAFF and above).
 *       Results are paginated.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Search term (min 2, max 100 characters)
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: jane
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Matching users (paginated)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *             example:
 *               success: true
 *               message: Search results
 *               data:
 *                 - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   email: jane.doe@example.com
 *                   firstName: Jane
 *                   lastName: Doe
 *                   username: janedoe
 *                   role: USER
 *                   status: ACTIVE
 *                   emailVerified: true
 *               pagination:
 *                 total: 1
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *                 nextPage: null
 *                 prevPage: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/search',
  authorize([PERMISSIONS.USER_READ]),
  validateQuery(searchQuerySchema),
  controller.search.bind(controller)
);

// =============================================================================
// GET /users — list all users (admin)
// =============================================================================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (paginated, filterable)
 *     description: >
 *       Returns a paginated list of all non-deleted users.
 *       Requires `user.manage` permission — **ADMIN or above only**.
 *       Supports filtering by `role` and `status`, and sorting by any field.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/sort'
 *       - $ref: '#/components/parameters/order'
 *       - in: query
 *         name: role
 *         description: Filter by role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, MANAGER, STAFF, USER]
 *           example: USER
 *       - in: query
 *         name: status
 *         description: Filter by account status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION]
 *           example: ACTIVE
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *             example:
 *               success: true
 *               message: Users fetched
 *               data:
 *                 - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   email: jane.doe@example.com
 *                   firstName: Jane
 *                   lastName: Doe
 *                   username: janedoe
 *                   role: USER
 *                   status: ACTIVE
 *                   emailVerified: true
 *                   lastLoginAt: "2024-06-01T10:30:00.000Z"
 *                   createdAt: "2024-01-15T08:00:00.000Z"
 *                   updatedAt: "2024-06-01T10:30:00.000Z"
 *                 - id: "b2c3d4e5-f6a7-8901-bcde-f01234567890"
 *                   email: john.smith@example.com
 *                   firstName: John
 *                   lastName: Smith
 *                   username: johnsmith
 *                   role: STAFF
 *                   status: ACTIVE
 *                   emailVerified: true
 *                   lastLoginAt: null
 *                   createdAt: "2024-02-01T09:00:00.000Z"
 *                   updatedAt: "2024-02-01T09:00:00.000Z"
 *               pagination:
 *                 total: 42
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 3
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *                 nextPage: 2
 *                 prevPage: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Insufficient permission — ADMIN or above required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *             example:
 *               success: false
 *               message: Insufficient permissions
 *               code: FORBIDDEN
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/',
  authorize([PERMISSIONS.USER_MANAGE]),
  validateQuery(listQuerySchema),
  controller.getAll.bind(controller)
);

// =============================================================================
// GET /users/:id — get user by ID
// =============================================================================

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: >
 *       Fetches a single user by their UUID. The response is role-aware:
 *       - **ADMIN/SUPER_ADMIN** receive the full admin view (loginCount, lastLoginIp, tenantId, etc.)
 *       - **All other roles** receive the standard private profile.
 *       Response is cached for 5 minutes per user ID.
 *       Requires `user.read` permission.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               standard:
 *                 summary: Standard profile (non-admin caller)
 *                 value:
 *                   success: true
 *                   message: User fetched
 *                   data:
 *                     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     email: jane.doe@example.com
 *                     firstName: Jane
 *                     lastName: Doe
 *                     username: janedoe
 *                     avatar: null
 *                     phone: "+14155552671"
 *                     role: USER
 *                     status: ACTIVE
 *                     emailVerified: true
 *                     lastLoginAt: "2024-06-01T10:30:00.000Z"
 *                     createdAt: "2024-01-15T08:00:00.000Z"
 *                     updatedAt: "2024-06-01T10:30:00.000Z"
 *               admin:
 *                 summary: Admin view (ADMIN+ caller)
 *                 value:
 *                   success: true
 *                   message: User fetched
 *                   data:
 *                     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     email: jane.doe@example.com
 *                     firstName: Jane
 *                     lastName: Doe
 *                     username: janedoe
 *                     role: USER
 *                     status: ACTIVE
 *                     emailVerified: true
 *                     loginCount: 17
 *                     lastLoginIp: "203.0.113.42"
 *                     tenantId: null
 *                     createdAt: "2024-01-15T08:00:00.000Z"
 *                     updatedAt: "2024-06-01T10:30:00.000Z"
 *                     deletedAt: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               message: User not found
 *               code: NOT_FOUND
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  '/:id',
  validateParams(idParam),
  authorize([PERMISSIONS.USER_READ]),
  controller.getById.bind(controller)
);

// =============================================================================
// PATCH /users/:id — update user profile (admin)
// =============================================================================

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update another user's profile
 *     description: >
 *       Updates mutable profile fields for any user. Requires `user.update`
 *       permission (MANAGER or above). Users can only update profiles of
 *       users with a lower role than themselves. The user's cache entry is
 *       invalidated and the change is audit-logged.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             firstName: Jonathan
 *             lastName: Smith
 *             phone: "+12025551234"
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: Profile updated
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f01234567890"
 *                 email: john.smith@example.com
 *                 firstName: Jonathan
 *                 lastName: Smith
 *                 username: johnsmith
 *                 phone: "+12025551234"
 *                 role: STAFF
 *                 status: ACTIVE
 *                 emailVerified: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  '/:id',
  validateParams(idParam),
  authorize([PERMISSIONS.USER_UPDATE]),
  validateBody(updateProfileSchema),
  auditLog('users'),
  controller.updateProfile.bind(controller)
);

// =============================================================================
// PATCH /users/:id/status — change account status
// =============================================================================

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Change a user's account status
 *     description: >
 *       Updates the lifecycle status of any user account. Requires
 *       **MANAGER** role or above. Useful for suspending, reactivating, or
 *       deactivating accounts without deletion.
 *       The change is audit-logged and the user's cache entry is invalidated.
 *
 *       **Status transitions:**
 *       - `ACTIVE` → `INACTIVE` / `SUSPENDED`
 *       - `INACTIVE` → `ACTIVE`
 *       - `SUSPENDED` → `ACTIVE` / `INACTIVE`
 *       - `PENDING_VERIFICATION` → `ACTIVE` (manual override)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *           examples:
 *             suspend:
 *               summary: Suspend an account
 *               value:
 *                 status: SUSPENDED
 *             reactivate:
 *               summary: Reactivate an account
 *               value:
 *                 status: ACTIVE
 *             deactivate:
 *               summary: Deactivate (soft-disable)
 *               value:
 *                 status: INACTIVE
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: User status updated }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION] }
 *             example:
 *               success: true
 *               message: User status updated
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f01234567890"
 *                 status: SUSPENDED
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: MANAGER or above required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *             example:
 *               success: false
 *               message: Requires minimum role MANAGER
 *               code: FORBIDDEN
 *               errors: []
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  '/:id/status',
  validateParams(idParam),
  requireMinRole('MANAGER'),
  validateBody(updateStatusSchema),
  auditLog('users'),
  controller.updateStatus.bind(controller)
);

// =============================================================================
// PATCH /users/:id/role — assign a role
// =============================================================================

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Assign a new role to a user
 *     description: >
 *       Changes a user's RBAC role. Requires **ADMIN** role or above.
 *
 *       **Constraints enforced:**
 *       - Cannot assign a role equal to or higher than the caller's own role.
 *       - Cannot change the role of a `SUPER_ADMIN`.
 *       - `SUPER_ADMIN` cannot be assigned via this endpoint.
 *
 *       The change is audit-logged and the user's cache entry is invalidated.
 *       The user's next request will reflect the new permissions.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *           examples:
 *             promote:
 *               summary: Promote to MANAGER
 *               value:
 *                 role: MANAGER
 *             demote:
 *               summary: Demote to USER
 *               value:
 *                 role: USER
 *     responses:
 *       200:
 *         description: Role assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: User role updated }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     role: { type: string, enum: [ADMIN, MANAGER, STAFF, USER] }
 *             example:
 *               success: true
 *               message: User role updated
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f01234567890"
 *                 role: MANAGER
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: ADMIN or above required, or role hierarchy violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenResponse'
 *             examples:
 *               notAdmin:
 *                 summary: Caller is not ADMIN+
 *                 value:
 *                   success: false
 *                   message: Requires minimum role ADMIN
 *                   code: FORBIDDEN
 *                   errors: []
 *               superAdmin:
 *                 summary: Cannot modify SUPER_ADMIN
 *                 value:
 *                   success: false
 *                   message: Cannot change SUPER_ADMIN role
 *                   code: FORBIDDEN
 *                   errors: []
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  '/:id/role',
  validateParams(idParam),
  requireMinRole('ADMIN'),
  validateBody(updateRoleSchema),
  auditLog('users'),
  controller.updateRole.bind(controller)
);

// =============================================================================
// DELETE /users/:id — soft delete
// =============================================================================

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete a user account
 *     description: >
 *       Sets `deletedAt` to the current timestamp — the record is **not**
 *       removed from the database. All subsequent queries automatically
 *       exclude soft-deleted records. Requires `user.delete` permission
 *       (ADMIN or above). The operation is audit-logged.
 *
 *       Returns **204 No Content** on success (no body).
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       204:
 *         description: User soft-deleted — no content returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: User not found (or already deleted)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               message: User not found
 *               code: NOT_FOUND
 *               errors: []
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  '/:id',
  validateParams(idParam),
  authorize([PERMISSIONS.USER_DELETE]),
  auditLog('users'),
  controller.delete.bind(controller)
);

module.exports = router;
