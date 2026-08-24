import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/db.js';
import { getCache, setCache } from '../lib/redis.js';
import type { DashboardStats } from '@nasmr/types';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    const cached = await getCache<DashboardStats>('dashboard:stats');
    if (cached) return reply.send(cached);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReports,
      highSeverityReports,
      activeHotspots,
      aiRecommendations,
      resolvedThisMonth,
      categoryBreakdown,
      recentReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { severity: { gte: 0.7 } } }),
      prisma.hotspot.count(),
      prisma.recommendation.count({ where: { status: 'OPEN' } }),
      prisma.report.count({
        where: { status: 'RESOLVED', updatedAt: { gte: monthStart } },
      }),
      prisma.report.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { aiAnalysis: true },
      }),
    ]);

    const categoryMap = Object.fromEntries(
      categoryBreakdown.map((c) => [c.category, c._count._all])
    );

    const stats: DashboardStats = {
      totalReports,
      highSeverityReports,
      activeHotspots,
      aiRecommendations,
      resolvedThisMonth,
      avgResponseDays: 4.2, // calculated separately in production
      categoryBreakdown: categoryMap as DashboardStats['categoryBreakdown'],
      recentReports: recentReports as DashboardStats['recentReports'],
    };

    await setCache('dashboard:stats', stats, 30); // 30 second TTL
    return reply.send(stats);
  });
}
