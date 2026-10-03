import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';
import type { BackupRecord, BackupStore } from '../src/store.js';

class MemoryStore implements BackupStore {
  data = new Map<string, BackupRecord>();
  async create(id: string, tokenHash: string, ciphertext: string) {
    if (this.data.has(id)) return null;
    const record = { id, tokenHash, ciphertext, version: 1, updatedAt: new Date().toISOString() };
    this.data.set(id, record); return record;
  }
  async get(id: string) { return this.data.get(id) ?? null; }
  async replace(id: string, version: number, ciphertext: string) {
    const current = this.data.get(id);
    if (!current || current.version !== version) return null;
    const next = { ...current, ciphertext, version: version + 1, updatedAt: new Date().toISOString() };
    this.data.set(id, next); return next;
  }
  async remove(id: string) { return this.data.delete(id); }
  async close() {}
}

test('encrypted backups require the bearer token and reject stale writes', async () => {
  const app = buildApp(new MemoryStore());
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const auth = { authorization: `Bearer ${token}` };
  const ciphertext = randomBytes(40).toString('base64');
  assert.equal((await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, headers: auth, payload: { version: 0, ciphertext } })).statusCode, 201);
  assert.equal((await app.inject({ method: 'GET', url: `/v1/backups/${id}` })).statusCode, 404);
  assert.equal((await app.inject({ method: 'GET', url: `/v1/backups/${id}`, headers: { authorization: `Bearer ${randomBytes(32).toString('base64url')}` } })).statusCode, 404);
  const read = await app.inject({ method: 'GET', url: `/v1/backups/${id}`, headers: auth });
  assert.equal(read.json().ciphertext, ciphertext);
  assert.equal((await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, headers: auth, payload: { version: 0, ciphertext } })).statusCode, 409);
  assert.equal((await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, headers: auth, payload: { version: 1, ciphertext } })).json().version, 2);
  assert.equal((await app.inject({ method: 'DELETE', url: `/v1/backups/${id}`, headers: auth })).statusCode, 204);
  assert.equal((await app.inject({ method: 'GET', url: `/v1/backups/${id}`, headers: auth })).statusCode, 404);
  await app.close();
});

test('server retains only ciphertext and a hash of the access token', async () => {
  const store = new MemoryStore();
  const app = buildApp(store);
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const ciphertext = randomBytes(40).toString('base64');
  await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, headers: { authorization: `Bearer ${token}` }, payload: { version: 0, ciphertext } });
  const record = store.data.get(id)!;
  assert.equal(record.tokenHash, createHash('sha256').update(token).digest('hex'));
  assert.equal(record.ciphertext, ciphertext);
  assert.equal(JSON.stringify(record).includes(token), false);
  await app.close();
});

test('rejects malformed backup writes before storing anything', async () => {
  const store = new MemoryStore();
  const app = buildApp(store);
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const auth = { authorization: `Bearer ${token}` };
  const ciphertext = randomBytes(40).toString('base64');
  const invalid = [
    { version: -1, ciphertext },
    { version: 0.5, ciphertext },
    { version: 0, ciphertext: 'short' },
    { version: 0, ciphertext: '*'.repeat(40) },
    { ciphertext },
  ];
  for (const payload of invalid) {
    const response = await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, headers: auth, payload });
    assert.equal(response.statusCode, 400);
  }
  assert.equal((await app.inject({ method: 'PUT', url: `/v1/backups/${id}`, payload: { version: 0, ciphertext } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'PUT', url: '/v1/backups/not-an-id', headers: auth, payload: { version: 0, ciphertext } })).statusCode, 400);
  assert.equal(store.data.size, 0);
  await app.close();
});
