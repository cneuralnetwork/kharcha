import * as SQLite from 'expo-sqlite';
import { DEFAULT_PREFERENCES, DEFAULT_SENDERS } from './model';
import type { Budget, Category, Preferences, SenderRule, Transaction } from './model';

let database: Promise<SQLite.SQLiteDatabase> | undefined;

type TransactionRow = Omit<Transaction, 'sourceHash' | 'rawBody' | 'occurredAt' | 'amountPaise' | 'accountLast4' | 'createdAt' | 'updatedAt'> & {
  source_hash: string | null;
  raw_body: string | null;
  occurred_at: number;
  amount_paise: number;
  account_last4: string | null;
  created_at: number;
  updated_at: number;
};

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id, sourceHash: row.source_hash, sender: row.sender, rawBody: row.raw_body,
    occurredAt: row.occurred_at, merchant: row.merchant, amountPaise: row.amount_paise,
    direction: row.direction, category: row.category, status: row.status,
    accountLast4: row.account_last4, reference: row.reference, confidence: row.confidence,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = (async () => {
      const db = await SQLite.openDatabaseAsync('kharcha.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          source_hash TEXT UNIQUE,
          sender TEXT,
          raw_body TEXT,
          occurred_at INTEGER NOT NULL,
          merchant TEXT NOT NULL,
          amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
          direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
          category TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('auto','review','ignored','manual')),
          account_last4 TEXT,
          reference TEXT,
          confidence REAL NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS transactions_by_date ON transactions (occurred_at DESC);
        CREATE INDEX IF NOT EXISTS transactions_by_status ON transactions (status, occurred_at DESC);
        CREATE TABLE IF NOT EXISTS budgets (
          category TEXT PRIMARY KEY,
          amount_paise INTEGER NOT NULL CHECK (amount_paise > 0)
        );
        CREATE TABLE IF NOT EXISTS senders (
          address TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
      const seeded = await db.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key=?', 'default_senders');
      if (!seeded) {
        const existingUser = await db.getFirstAsync('SELECT 1 FROM preferences WHERE key=?', 'onboardingDone');
        if (!existingUser) for (const sender of DEFAULT_SENDERS) {
          await db.runAsync('INSERT OR IGNORE INTO senders (address,label,enabled) VALUES (?,?,?)', sender.address, sender.label, Number(sender.enabled));
        }
        await db.runAsync('INSERT INTO metadata (key,value) VALUES (?,?)', 'default_senders', '1');
      }
      return db;
    })().catch(error => { database = undefined; throw error; });
  }
  return database;
}

export async function listTransactions(): Promise<Transaction[]> {
  const rows = await (await getDatabase()).getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY occurred_at DESC, created_at DESC');
  return rows.map(fromRow);
}

export async function addTransaction(t: Transaction): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(`INSERT OR IGNORE INTO transactions
    (id,source_hash,sender,raw_body,occurred_at,merchant,amount_paise,direction,category,status,account_last4,reference,confidence,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    t.id, t.sourceHash, t.sender, t.rawBody, t.occurredAt, t.merchant, t.amountPaise,
    t.direction, t.category, t.status, t.accountLast4, t.reference, t.confidence,
    t.createdAt, t.updatedAt);
  return result.changes > 0;
}

export async function editTransaction(id: string, values: Pick<Transaction, 'merchant' | 'category' | 'status'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE transactions SET merchant=?,category=?,status=?,updated_at=? WHERE id=?',
    values.merchant.trim(), values.category, values.status, Date.now(), id);
}

export async function listBudgets(): Promise<Budget[]> {
  return (await getDatabase()).getAllAsync<Budget>('SELECT category, amount_paise AS amountPaise FROM budgets ORDER BY category');
}

export async function saveBudget(category: Category, amountPaise: number): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO budgets (category,amount_paise) VALUES (?,?) ON CONFLICT(category) DO UPDATE SET amount_paise=excluded.amount_paise', category, amountPaise);
}

export async function removeBudget(category: Category): Promise<void> {
  await (await getDatabase()).runAsync('DELETE FROM budgets WHERE category=?', category);
}

export async function listSenders(): Promise<SenderRule[]> {
  const rows = await (await getDatabase()).getAllAsync<{ address: string; label: string; enabled: number }>('SELECT address,label,enabled FROM senders ORDER BY address');
  return rows.map(row => ({ ...row, enabled: !!row.enabled }));
}

export async function saveSender(sender: SenderRule): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO senders (address,label,enabled) VALUES (?,?,?) ON CONFLICT(address) DO UPDATE SET label=excluded.label,enabled=excluded.enabled',
    sender.address.toUpperCase().trim(), sender.label.trim(), Number(sender.enabled));
}

export async function removeSender(address: string): Promise<void> {
  await (await getDatabase()).runAsync('DELETE FROM senders WHERE address=?', address);
}

export async function loadPreferences(): Promise<Preferences> {
  const rows = await (await getDatabase()).getAllAsync<{ key: string; value: string }>('SELECT key,value FROM preferences');
  const values = Object.fromEntries(rows.map(({ key, value }) => [key, JSON.parse(value)]));
  return { ...DEFAULT_PREFERENCES, ...values };
}

export async function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, JSON.stringify(value));
}

export interface Snapshot {
  schema: 1;
  transactions: Transaction[];
  budgets: Budget[];
  senders: SenderRule[];
  preferences: Preferences;
  exportedAt: number;
}

export async function exportSnapshot(): Promise<Snapshot> {
  const [transactions, budgets, senders, preferences] = await Promise.all([
    listTransactions(), listBudgets(), listSenders(), loadPreferences(),
  ]);
  return { schema: 1, transactions, budgets, senders, preferences, exportedAt: Date.now() };
}

export async function restoreSnapshot(snapshot: Snapshot): Promise<void> {
  if (snapshot.schema !== 1 || !Array.isArray(snapshot.transactions) || !Array.isArray(snapshot.budgets) || !Array.isArray(snapshot.senders)) {
    throw new Error('This backup format is not supported.');
  }
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.execAsync('DELETE FROM transactions; DELETE FROM budgets; DELETE FROM senders; DELETE FROM preferences;');
    for (const t of snapshot.transactions) {
      await tx.runAsync(`INSERT INTO transactions (id,source_hash,sender,raw_body,occurred_at,merchant,amount_paise,direction,category,status,account_last4,reference,confidence,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        t.id, t.sourceHash, t.sender, t.rawBody, t.occurredAt, t.merchant, t.amountPaise, t.direction,
        t.category, t.status, t.accountLast4, t.reference, t.confidence, t.createdAt, t.updatedAt);
    }
    for (const b of snapshot.budgets) await tx.runAsync('INSERT INTO budgets VALUES (?,?)', b.category, b.amountPaise);
    for (const s of snapshot.senders) await tx.runAsync('INSERT INTO senders VALUES (?,?,?)', s.address, s.label, Number(s.enabled));
    for (const [key, value] of Object.entries(snapshot.preferences)) {
      await tx.runAsync('INSERT INTO preferences VALUES (?,?)', key, JSON.stringify(value));
    }
  });
}
