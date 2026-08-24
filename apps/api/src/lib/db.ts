import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client.$extends({
    query: {
      user: {
        async create({ args, query }) {
          if (args.data.password) {
            args.data.password = await bcrypt.hash(args.data.password, 10);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.password && typeof args.data.password === 'string') {
            args.data.password = await bcrypt.hash(args.data.password, 10);
          }
          return query(args);
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// Establish initial connection and log status
prisma.$connect()
  .then(() => {
    console.log('Prisma connected to database');
  })
  .catch((err) => {
    console.error('Prisma failed to connect:', err.message);
  });
