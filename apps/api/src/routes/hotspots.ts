import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/db.js';
import { getCache, setCache } from '../lib/redis.js';

export async function hotspotsRoutes(app: FastifyInstance) {
  // GET /api/hotspots
  app.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    const cached = await getCache('hotspots:all');
    if (cached) return reply.send(cached);

    const hotspots = await prisma.hotspot.findMany({
      orderBy: { priorityScore: 'desc' },
      include: { recommendations: { take: 1, orderBy: { priorityScore: 'desc' } } },
    });

    await setCache('hotspots:all', hotspots, 60);
    return reply.send(hotspots);
  });

  // GET /api/hotspots/:id
  app.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const hotspot = await prisma.hotspot.findUnique({
      where: { id },
      include: { recommendations: true },
    });
    if (!hotspot) return reply.status(404).send({ error: 'Hotspot not found' });
    return reply.send(hotspot);
  });
}
