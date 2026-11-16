# GreenLight — Coding Standards & Architecture Guide

## Architecture Principles

- **Clean Architecture**: deps point inward — routes → controllers → services → repositories → database.
- **SOLID**: single responsibility per class; open for extension, closed for modification.
- **Repository Pattern**: all DB access goes through a repository; services never call `prisma` directly.
- **Service Layer**: all business logic lives in services; controllers only orchestrate HTTP.
- **Dependency Injection Ready**: singletons exported as instances; swap them in tests via `jest.mock()`.

---

## Project Structure Conventions

```
src/
├── config/          # Environment-bound config objects (one file per concern)
├── constants/       # Frozen enums and string literals
├── exceptions/      # AppError subclasses — one class per error type
├── utils/           # Pure functions with no side effects
├── helpers/         # Stateful helpers (logger, mailer, response formatter)
├── middleware/      # Express middleware — one concern per file
├── validators/      # Joi schemas — shared + per-module
├── permissions/     # RBAC role→permission mapping
├── database/        # Prisma client singleton + transaction helpers
├── repositories/    # BaseRepository + module-level repositories
├── services/        # BaseService + module-level services
├── modules/         # Feature modules (see Module Structure below)
├── routes/          # API versioning (v1/, v2/, index.js)
├── cache/           # Redis client + cache service + cache key builders
├── sockets/         # Socket.IO init + namespaces + event handlers
├── jobs/            # BullMQ queues + workers + processors + schedulers
├── storage/         # Adapter pattern: local | s3 | cloudinary
├── docs/            # Swagger config + JSDoc route annotations
└── shared/          # Re-exports of shared concerns
```

---

## Module Structure (every feature)

```
modules/feature/
├── feature.controller.js   # HTTP request/response only — no business logic
├── feature.service.js      # Business logic — extends BaseService
├── feature.repository.js   # Data access — extends BaseRepository
├── feature.routes.js       # Express router with middleware chain
├── feature.validator.js    # Joi schemas
├── feature.policy.js       # Authorization rules (canUpdate, canDelete, etc.)
├── feature.constants.js    # Module-scoped constants
├── feature.events.js       # EventEmitter for domain events
├── feature.socket.js       # Socket.IO event bridges
├── feature.mapper.js       # User → DTO transformations
├── feature.serializer.js   # Role-aware serialization
├── feature.transformer.js  # Input normalization (trim, lowercase, etc.)
└── index.js                # Public API: { router, service, repository, ... }
```

---

## RBAC Quick Reference

```js
// Single permission required
router.get('/', authenticate, authorize(['user.read']), controller.getAll);

// Minimum role required
router.delete('/:id', authenticate, requireMinRole('ADMIN'), controller.delete);

// Multiple permissions (user must have ALL)
router.post('/', authenticate, authorize(['user.create', 'user.manage']), controller.create);
```

---

## Error Handling Rules

1. **Operational errors** (expected failures) → throw an `AppError` subclass from `src/exceptions/`.
2. **Never throw raw `Error`** from a service or repository — always use typed exceptions.
3. **Prisma errors** are mapped to `AppError` in `error.middleware.js`.
4. **Unhandled errors** crash the process (by design) — `server.js` catches and logs.

---

## Response Format

**Success:**
```json
{ "success": true,  "message": "...", "data": {} }
```

**Paginated:**
```json
{ "success": true, "message": "...", "data": [], "pagination": { "total": 0, "page": 1, ... } }
```

**Error:**
```json
{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": [] }
```

---

## Database Conventions

- All models have: `id` (UUID), `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`.
- **Never hard-delete** user-facing records — use `softDelete(id)` on `BaseRepository`.
- All queries go through `BaseRepository` methods — never `prisma.*` directly in services.
- Use `withTransaction(fn)` from `database/transactions/` for multi-step writes.

---

## Adding a New Module

1. Create `src/modules/feature/` with all required files.
2. Add the router to `src/routes/v1/index.js`.
3. Add permissions to `src/permissions/index.js`.
4. Register socket handlers in `src/sockets/namespaces.js` if needed.
5. Add a BullMQ processor in `src/jobs/processors/` if the module needs background work.
6. Write unit tests in `tests/unit/` and integration tests in `tests/integration/`.

---

## Security Checklist

- [ ] All mutations behind `authenticate` middleware
- [ ] All admin actions behind `authorize()` or `requireMinRole()`
- [ ] All inputs validated with Joi before reaching the service layer
- [ ] No raw SQL — use Prisma parameterized queries only
- [ ] Secrets in `.env` — never hardcoded
- [ ] CORS restricted to known origins
- [ ] Rate limiting on all auth endpoints (`authLimiter`)
- [ ] Helmet configured
- [ ] NoSQL injection protection (`sanitizeNoSQL`)
- [ ] HPP protection (`preventHPP`)

---

## Production Deployment Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong JWT secrets (64+ chars, random)
- [ ] `DB_SSL=true` with a valid cert
- [ ] Redis password set, TLS enabled
- [ ] `CORS_ORIGIN` restricted to production domains
- [ ] `AUTH_RATE_LIMIT_MAX` tuned for expected traffic
- [ ] `LOG_LEVEL=warn` (not `debug`)
- [ ] Docker image built from `runner` stage (not `builder`)
- [ ] `prisma migrate deploy` run before app start
- [ ] Health check endpoint wired to load balancer
- [ ] Graceful shutdown timeout tuned (30s default in `server.js`)
- [ ] Monitoring / alerting on error logs and DB connection pool

---

## npm Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Production start |
| `npm test` | Run all Jest tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier format |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations (prod) |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start all Docker services |
| `npm run docker:down` | Stop all Docker services |
