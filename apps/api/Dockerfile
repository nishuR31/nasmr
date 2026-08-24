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

# Root node_modules (all packages)
COPY --from=builder /app/node_modules           ./node_modules
COPY --from=builder /app/packages               ./packages

# API app source, schema, config
COPY --from=builder /app/apps/api/src           ./apps/api/src
COPY --from=builder /app/apps/api/prisma        ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json  ./apps/api/package.json

# Bun workspace symlinks — Bun resolves packages by walking up from the file's
# directory. apps/api/node_modules contains symlinks into /app/node_modules,
# which is the bridge Bun needs when starting from apps/api/src/
COPY --from=builder /app/apps/api/node_modules  ./apps/api/node_modules

# Stay at workspace root so Bun resolves node_modules from /app/node_modules
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run from workspace root — avoids Bun v1.4 monorepo traversal issues
CMD ["bun", "run", "apps/api/src/index.ts"]
