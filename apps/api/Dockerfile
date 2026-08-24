# ==========================================
# Builder Stage
# ==========================================
FROM oven/bun:1 as builder

WORKDIR /app

# Copy root workspace config
COPY package.json ./
COPY bun.lockb* ./

# Copy packages (types) and the specific app we want to build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies at the workspace root
RUN bun install

# Generate Prisma Client
WORKDIR /app/apps/api
RUN bunx prisma generate

# ==========================================
# Consumer Stage (Runner)
# ==========================================
FROM oven/bun:1-slim

WORKDIR /app

# Copy everything from the builder stage (maintains monorepo symlinks)
COPY --from=builder /app /app

WORKDIR /app/apps/api

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run the API server
CMD ["bun", "run", "src/index.ts"]
