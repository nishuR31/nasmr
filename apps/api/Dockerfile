# ==========================================
# Builder Stage
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace config first for layer caching
COPY package.json bun.lockb* ./

# Copy shared packages (provides @nasmr/types)
COPY packages/ ./packages/

# Copy the API app source
COPY apps/api/ ./apps/api/

# Install all workspace dependencies at monorepo root
RUN bun install --frozen-lockfile

# Generate Prisma client (needs schema + node_modules)
WORKDIR /app/apps/api
RUN bunx prisma generate

# ==========================================
# Consumer Stage (Runner)
# ==========================================
FROM oven/bun:1-slim

WORKDIR /app

# Root workspace config — Bun needs this to understand the monorepo
# and resolve packages from /app/node_modules when running inside apps/api
COPY --from=builder /app/package.json           ./package.json

# Copy ONLY what is needed to run — no build tools, no bloat
COPY --from=builder /app/node_modules           ./node_modules
COPY --from=builder /app/packages               ./packages
COPY --from=builder /app/apps/api/src           ./apps/api/src
COPY --from=builder /app/apps/api/prisma        ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json  ./apps/api/package.json

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
