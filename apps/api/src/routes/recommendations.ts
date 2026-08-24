import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/db.ts';

export async function recommendationsRoutes(app: FastifyInstance) {
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { status?: string; limit?: string };
    const recommendations = await prisma.recommendation.findMany({
      where: query.status ? { status: query.status as never } : undefined,
      take: Math.min(Number(query.limit ?? 20), 50),
      orderBy: { priorityScore: 'desc' },
      include: { hotspot: true },
    });
    return reply.send(recommendations);
  });

  app.patch('/:id/status', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const rec = await prisma.recommendation.update({
      where: { id },
      data: { status: status as never },
    });
    return reply.send(rec);
  });
}
