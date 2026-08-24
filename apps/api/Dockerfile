# ==========================================
# Single-stage: Bun runs TypeScript natively,
# no compilation step needed.
# ==========================================
FROM oven/bun:1-slim

WORKDIR /app

# Copy workspace config and shared packages first (better layer caching)
COPY package.json ./
COPY packages/ ./packages/

# Copy the API app
COPY apps/api/ ./apps/api/

# Install dependencies at workspace root (resolves @nasmr/types etc.)
RUN bun install

# Generate Prisma client
WORKDIR /app/apps/api
RUN bunx prisma generate

# Run from apps/api so Bun picks up tsconfig.json for correct module resolution.
# Packages are resolved via workspace: /app/node_modules is accessible because
# bun install created symlinks in /app/apps/api/node_modules.
WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
