import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { reportsRoutes } from './routes/reports';
import { hotspotsRoutes } from './routes/hotspots';
import { dashboardRoutes } from './routes/dashboard';
import { mapRoutes } from './routes/map';
import { recommendationsRoutes } from './routes/recommendations';
import { authRoutes } from './routes/auth';

const app = Fastify({ logger: { level: 'info' } });

// ─── Plugins ────────────────────────────────────────────────
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
});
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
});

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

await app.register(rateLimit, {
  max: 200,
  timeWindow: '1 minute',
  redis: redis,
});

// ─── Routes ─────────────────────────────────────────────────
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(reportsRoutes, { prefix: '/api/reports' });
await app.register(hotspotsRoutes, { prefix: '/api/hotspots' });
await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
await app.register(mapRoutes, { prefix: '/api/map' });
await app.register(recommendationsRoutes, { prefix: '/api/recommendations' });

// ─── Health ─────────────────────────────────────────────────
app.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ──────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\nNASMR API running at http://localhost:${PORT}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
