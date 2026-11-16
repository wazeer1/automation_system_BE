'use strict';

const { prisma } = require('../database');
const logger = require('../helpers/logger.helper');

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const auditLog = (resource) =>
  async (req, res, next) => {
    if (!AUDITED_METHODS.includes(req.method)) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode < 400 && req.user) {
        try {
          await prisma.auditLog.create({
            data: {
              actorId: req.user.id,
              actorRole: req.user.role,
              action: req.method,
              resource,
              resourceId: req.params.id || body?.data?.id || null,
              newValues: req.body || null,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              tenantId: req.tenantId || null,
            },
          });
        } catch (err) {
          logger.error('Audit log failed', { error: err.message });
        }
      }
      return originalJson(body);
    };

    return next();
  };

module.exports = { auditLog };
