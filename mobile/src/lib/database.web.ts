import { DEFAULT_PREFERENCES, DEFAULT_SENDERS } from './model';
import type { Budget, Category, Preferences, SenderRule, Transaction } from './model';

const KEY = 'kharcha.browser-ledger.v1';

export interface Snapshot {
  schema: 1;
  transactions: Transaction[];
  budgets: Budget[];
  senders: SenderRule[];
  preferences: Preferences;
  exportedAt: number;
}

function empty(): Snapshot {
  return { schema: 1, transactions: [], budgets: [], senders: DEFAULT_SENDERS, preferences: DEFAULT_PREFERENCES, exportedAt: 0 };
}

function read(): Snapshot {
  const stored = localStorage.getItem(KEY);
  if (!stored) return empty();
  const value = JSON.parse(stored) as Snapshot;
  if (value.schema !== 1 || !Array.isArray(value.transactions) || !Array.isArray(value.budgets) || !Array.isArray(value.senders)) {
    throw new Error('Browser ledger format is not supported.');
  }
  return value;
}

function write(snapshot: Snapshot): void {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export async function getDatabase(): Promise<void> { read(); }

export async function listTransactions(): Promise<Transaction[]> {
  return read().transactions.sort((a, b) => b.occurredAt - a.occurredAt || b.createdAt - a.createdAt);
}

export async function addTransaction(transaction: Transaction): Promise<boolean> {
  const snapshot = read();
  if (snapshot.transactions.some(item => item.id === transaction.id || !!transaction.sourceHash && item.sourceHash === transaction.sourceHash)) return false;
  snapshot.transactions.push(transaction);
  write(snapshot);
  return true;
}

export async function editTransaction(id: string, values: Pick<Transaction, 'merchant' | 'category' | 'status'>): Promise<void> {
  const snapshot = read();
  const item = snapshot.transactions.find(transaction => transaction.id === id);
  if (!item) throw new Error('Entry not found.');
  Object.assign(item, values, { merchant: values.merchant.trim(), updatedAt: Date.now() });
  write(snapshot);
}

export async function listBudgets(): Promise<Budget[]> { return read().budgets.sort((a, b) => a.category.localeCompare(b.category)); }
export async function saveBudget(category: Category, amountPaise: number): Promise<void> {
  const snapshot = read();
  snapshot.budgets = snapshot.budgets.filter(item => item.category !== category);
  snapshot.budgets.push({ category, amountPaise });
  write(snapshot);
}
export async function removeBudget(category: Category): Promise<void> {
  const snapshot = read();
  snapshot.budgets = snapshot.budgets.filter(item => item.category !== category);
  write(snapshot);
}

export async function listSenders(): Promise<SenderRule[]> { return read().senders.sort((a, b) => a.address.localeCompare(b.address)); }
export async function saveSender(sender: SenderRule): Promise<void> {
  const snapshot = read();
  snapshot.senders = snapshot.senders.filter(item => item.address !== sender.address);
  snapshot.senders.push({ ...sender, address: sender.address.toUpperCase().trim(), label: sender.label.trim() });
  write(snapshot);
}
export async function removeSender(address: string): Promise<void> {
  const snapshot = read();
  snapshot.senders = snapshot.senders.filter(item => item.address !== address);
  write(snapshot);
}

export async function loadPreferences(): Promise<Preferences> { return { ...DEFAULT_PREFERENCES, ...read().preferences }; }
export async function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
  const snapshot = read();
  snapshot.preferences[key] = value;
  write(snapshot);
}

export async function exportSnapshot(): Promise<Snapshot> { return { ...read(), exportedAt: Date.now() }; }
export async function restoreSnapshot(snapshot: Snapshot): Promise<void> {
  if (snapshot.schema !== 1 || !Array.isArray(snapshot.transactions) || !Array.isArray(snapshot.budgets) || !Array.isArray(snapshot.senders)) {
    throw new Error('This backup format is not supported.');
  }
  write(snapshot);
}
