import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/db';
import { analyzeReport, transcribeAudio } from '../lib/ai-client';
import { invalidateCache } from '../lib/redis';

const CreateReportSchema = z.object({
  text: z.string().min(10, 'Report must be at least 10 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  imageUrl: z.string().url().optional(),
  audioBase64: z.string().optional(),
});

export async function reportsRoutes(app: FastifyInstance) {
  // ── POST /api/reports ──────────────────────────────────────
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateReportSchema.parse(req.body);

    // If voice input, transcribe first
    let reportText = body.text;
    if (body.audioBase64) {
      const transcription = await transcribeAudio(body.audioBase64);
      reportText = transcription.text;
    }

    // Create report in DB
    const report = await prisma.report.create({
      data: {
        text: reportText,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        imageUrl: body.imageUrl,
        status: 'ANALYZING',
      },
    });

    // Kick off AI analysis (async — don't block response)
    analyzeReport({
      text: reportText,
      latitude: body.latitude,
      longitude: body.longitude,
    })
      .then(async (analysis) => {
        await prisma.aIAnalysis.create({
          data: {
            reportId: report.id,
            category: analysis.category,
            severity: analysis.severity,
            urgency: analysis.urgency,
            summary: analysis.summary,
            entities: analysis.entities,
            confidence: analysis.confidence,
          },
        });

        await prisma.report.update({
          where: { id: report.id },
          data: {
            category: analysis.category,
            severity: analysis.severity,
            urgency: analysis.urgency,
            status: 'ANALYZED',
          },
        });

        // Invalidate dashboard and map cache
        await invalidateCache('dashboard:*');
        await invalidateCache('map:*');
      })
      .catch((err) => {
        console.error('AI analysis failed for report', report.id, err.message);
        prisma.report.update({
          where: { id: report.id },
          data: { status: 'PENDING' },
        });
      });

    return reply.status(201).send({ ...report, status: 'ANALYZING' });
  });

  // ── GET /api/reports ───────────────────────────────────────
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as {
      limit?: string;
      offset?: string;
      category?: string;
      status?: string;
    };

    const limit = Math.min(Number(query.limit ?? 50), 100);
    const offset = Number(query.offset ?? 0);

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        take: limit,
        skip: offset,
        where: {
          ...(query.category ? { category: query.category as never } : {}),
          ...(query.status ? { status: query.status as never } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { aiAnalysis: true },
      }),
      prisma.report.count(),
    ]);

    return reply.send({ reports, total, limit, offset });
  });

  // ── GET /api/reports/:id ────────────────────────────────────
  app.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const report = await prisma.report.findUnique({
      where: { id },
      include: { aiAnalysis: true },
    });
    if (!report) return reply.status(404).send({ error: 'Report not found' });
    return reply.send(report);
  });
}
