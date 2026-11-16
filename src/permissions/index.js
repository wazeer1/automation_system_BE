'use strict';

// ─── All Permissions ──────────────────────────────────────────────────────────
const PERMISSIONS = {
  // Users
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_MANAGE: 'user.manage',

  // Auth
  AUTH_IMPERSONATE: 'auth.impersonate',

  // Roles
  ROLE_ASSIGN: 'role.assign',
  ROLE_MANAGE: 'role.manage',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_MANAGE: 'settings.manage',

  // Audit
  AUDIT_READ: 'audit.read',

  // Reports
  REPORT_READ: 'report.read',
  REPORT_GENERATE: 'report.generate',
};

// ─── Role → Permission Map ────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // wildcard — all permissions

  ADMIN: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_ASSIGN,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_GENERATE,
  ],

  MANAGER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.AUDIT_READ,
  ],

  STAFF: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.REPORT_READ,
  ],

  USER: [
    PERMISSIONS.USER_READ,
  ],
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS };
