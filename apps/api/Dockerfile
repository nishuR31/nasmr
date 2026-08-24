# ==========================================
# Builder Stage
# ==========================================
FROM oven/bun:1 as builder

WORKDIR /app

# Copy package and lock files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy application source code
COPY src ./src

# ==========================================
# Consumer Stage (Runner)
# ==========================================
FROM oven/bun:1-slim

WORKDIR /app

# Copy node_modules (including generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy package config and source code
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run the API server
CMD ["bun", "run", "src/index.ts"]
