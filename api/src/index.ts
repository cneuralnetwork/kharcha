import { buildApp } from './app.js';
import { PostgresBackupStore } from './store.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const store = new PostgresBackupStore(connectionString);
await store.initialize();
const origins = (process.env.CORS_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
const app = buildApp(store, origins);

const port = Number(process.env.PORT ?? 4000);
await app.listen({ host: '0.0.0.0', port });

const shutdown = async () => { await app.close(); await store.close(); };
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
