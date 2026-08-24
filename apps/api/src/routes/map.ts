import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/db.ts';
import { getCache, setCache } from '../lib/redis.ts';

export async function mapRoutes(app: FastifyInstance) {
  // GET /api/map/layers — returns GeoJSON for all map layers
  app.get('/layers', async (_req: FastifyRequest, reply: FastifyReply) => {
    const cached = await getCache('map:layers');
    if (cached) return reply.send(cached);

    const [reports, hotspots] = await Promise.all([
      prisma.report.findMany({
        select: { id: true, latitude: true, longitude: true, category: true, severity: true, text: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
      prisma.hotspot.findMany({
        select: { id: true, name: true, category: true, centerLat: true, centerLng: true, priorityScore: true, reportCount: true, severity: true },
      }),
    ]);

    const reportsGeoJSON = {
      type: 'FeatureCollection',
      features: reports.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { id: r.id, category: r.category, severity: r.severity, status: r.status, text: r.text.slice(0, 100), createdAt: r.createdAt },
      })),
    };

    const hotspotsGeoJSON = {
      type: 'FeatureCollection',
      features: hotspots.map((h) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [h.centerLng, h.centerLat] },
        properties: { id: h.id, name: h.name, category: h.category, priorityScore: h.priorityScore, reportCount: h.reportCount, severity: h.severity },
      })),
    };

    const heatmapPoints = reports.map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      weight: r.severity,
    }));

    const layers = { reports: reportsGeoJSON, hotspots: hotspotsGeoJSON, heatmapPoints };
    await setCache('map:layers', layers, 60);
    return reply.send(layers);
  });
}
