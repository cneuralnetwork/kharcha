import { createHash, timingSafeEqual } from 'node:crypto';
import Fastify from 'fastify';
import type { BackupStore } from './store.js';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const ciphertextPattern = /^[A-Za-z0-9+/]+={0,2}$/;

function authorized(storedHash: string, authorization: unknown): boolean {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return false;
  const token = authorization.slice(7);
  if (!tokenPattern.test(token)) return false;
  const actual = createHash('sha256').update(token).digest();
  const expected = Buffer.from(storedHash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type BackupPayload = { version?: number; ciphertext?: string };

function validBackup(id: string, token: string, body: BackupPayload | undefined): body is { version: number; ciphertext: string } {
  if (!idPattern.test(id) || !tokenPattern.test(token) || !body) return false;
  const { version, ciphertext } = body;
  return Number.isSafeInteger(version) && version! >= 0 &&
    typeof ciphertext === 'string' && ciphertext.length <= 5_000_000 &&
    ciphertext.length >= 32 && ciphertextPattern.test(ciphertext);
}

export function buildApp(store: BackupStore, allowedOrigins: string[] = []) {
  const app = Fastify({ bodyLimit: 5_500_000, logger: false });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    }
    if (request.method === 'OPTIONS') return reply.code(204).send();
  });

  app.get('/healthz', async () => ({ ok: true }));

  app.get<{ Params: { id: string } }>('/v1/backups/:id', async (request, reply) => {
    const { id } = request.params;
    if (!idPattern.test(id)) return reply.code(400).send({ error: 'invalid_id' });
    const record = await store.get(id);
    if (!record || !authorized(record.tokenHash, request.headers.authorization)) {
      return reply.code(404).send({ error: 'not_found' });
    }
    return { version: record.version, ciphertext: record.ciphertext, updatedAt: record.updatedAt };
  });

  app.put<{ Params: { id: string }; Body: BackupPayload }>('/v1/backups/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : '';
    if (!validBackup(id, token, body)) {
      return reply.code(400).send({ error: 'invalid_backup' });
    }
    const existing = await store.get(id);
    if (!existing) {
      if (body.version !== 0) return reply.code(409).send({ error: 'version_conflict' });
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const created = await store.create(id, tokenHash, body.ciphertext);
      return created ? reply.code(201).send({ version: created.version, updatedAt: created.updatedAt })
        : reply.code(409).send({ error: 'version_conflict' });
    }
    if (!authorized(existing.tokenHash, request.headers.authorization)) return reply.code(404).send({ error: 'not_found' });
    if (existing.version !== body.version) return reply.code(409).send({ error: 'version_conflict', version: existing.version });
    const updated = await store.replace(id, existing.version, body.ciphertext);
    return updated ? { version: updated.version, updatedAt: updated.updatedAt }
      : reply.code(409).send({ error: 'version_conflict' });
  });

  app.delete<{ Params: { id: string } }>('/v1/backups/:id', async (request, reply) => {
    const { id } = request.params;
    if (!idPattern.test(id)) return reply.code(400).send({ error: 'invalid_id' });
    const record = await store.get(id);
    if (!record || !authorized(record.tokenHash, request.headers.authorization)) {
      return reply.code(404).send({ error: 'not_found' });
    }
    await store.remove(id);
    return reply.code(204).send();
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number(error.statusCode) : 500;
    if (statusCode >= 400 && statusCode < 500) return reply.code(statusCode).send({ error: 'bad_request' });
    return reply.code(500).send({ error: 'internal_error' });
  });
  return app;
}
