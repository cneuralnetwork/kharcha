import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export interface BackupRecord {
  id: string;
  tokenHash: string;
  ciphertext: string;
  version: number;
  updatedAt: string;
}

export interface BackupStore {
  create(id: string, tokenHash: string, ciphertext: string): Promise<BackupRecord | null>;
  get(id: string): Promise<BackupRecord | null>;
  replace(id: string, version: number, ciphertext: string): Promise<BackupRecord | null>;
  remove(id: string): Promise<boolean>;
  close(): Promise<void>;
}

function fromRow(row: Record<string, unknown>): BackupRecord {
  return {
    id: String(row.id), tokenHash: String(row.token_hash), ciphertext: String(row.ciphertext),
    version: Number(row.version), updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PostgresBackupStore implements BackupStore {
  private readonly pool: pg.Pool;
  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
  }

  async initialize(): Promise<void> {
    const migration = await readFile(fileURLToPath(new URL('../sql/001_init.sql', import.meta.url)), 'utf8');
    await this.pool.query(migration);
  }

  async create(id: string, tokenHash: string, ciphertext: string): Promise<BackupRecord | null> {
    const result = await this.pool.query('INSERT INTO backups (id,token_hash,ciphertext) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING *', [id, tokenHash, ciphertext]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async get(id: string): Promise<BackupRecord | null> {
    const result = await this.pool.query('SELECT * FROM backups WHERE id=$1', [id]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async replace(id: string, version: number, ciphertext: string): Promise<BackupRecord | null> {
    const result = await this.pool.query('UPDATE backups SET ciphertext=$3,version=version+1,updated_at=now() WHERE id=$1 AND version=$2 RETURNING *', [id, version, ciphertext]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    return (await this.pool.query('DELETE FROM backups WHERE id=$1', [id])).rowCount === 1;
  }

  async close(): Promise<void> { await this.pool.end(); }
}
