# =============================================================================
# Stage 1 — Dependencies
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY src/database/prisma/schema.prisma ./src/database/prisma/schema.prisma

RUN npm ci --only=production && \
    npx prisma generate

# =============================================================================
# Stage 2 — Builder (dev deps for any transpilation / type checks)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# =============================================================================
# Stage 3 — Production runner
# =============================================================================
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/src ./src

# Create log & upload directories
RUN mkdir -p src/logs uploads && \
    chown -R appuser:nodejs src/logs uploads

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
