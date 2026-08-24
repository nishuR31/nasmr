import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import prisma from '../lib/db';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' });

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  // POST /api/auth/register
  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, name, password } = req.body as { email: string; name: string; password: string };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(409).send({ error: 'Email already registered' });

    const user = await prisma.user.create({
      data: { email, name, password },
    });

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role }, { expiresIn: '7d' });
    return reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [(app as any).authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = req.user as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send(user);
  });
}
