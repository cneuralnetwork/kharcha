import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import {
  addTransaction, editTransaction, exportSnapshot, getDatabase, listBudgets, listSenders,
  listTransactions, loadPreferences, removeBudget, removeSender, restoreSnapshot,
  saveBudget, savePreference, saveSender,
} from '@/lib/database';
import type { Snapshot } from '@/lib/database';
import { DEFAULT_PREFERENCES } from '@/lib/model';
import type { Budget, Category, Direction, Preferences, SenderRule, Transaction, TransactionStatus } from '@/lib/model';
import { readBankSms, requestSmsPermission } from '@/lib/sms';

interface LedgerContextValue {
  ready: boolean;
  busy: boolean;
  error: string | null;
  transactions: Transaction[];
  budgets: Budget[];
  senders: SenderRule[];
  preferences: Preferences;
  refresh: () => Promise<void>;
  scan: (full?: boolean) => Promise<number>;
  enableSms: () => Promise<boolean>;
  addManual: (merchant: string, rupees: number, direction: Direction, category: Category, occurredAt?: number) => Promise<void>;
  setTransaction: (id: string, merchant: string, category: Category, status: TransactionStatus) => Promise<void>;
  setBudget: (category: Category, amountPaise: number) => Promise<void>;
  removeBudget: (category: Category) => Promise<void>;
  setSender: (sender: SenderRule) => Promise<void>;
  removeSender: (address: string) => Promise<void>;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
  restore: (snapshot: Snapshot) => Promise<void>;
  clearError: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function scanStart(full: boolean, lastScanAt: number): number {
  return full || !lastScanAt ? Date.now() - 90 * 86400_000 : lastScanAt - 120_000;
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [senders, setSenders] = useState<SenderRule[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const scanBusyRef = useRef(false);

  const refresh = useCallback(async () => {
    const [nextTransactions, nextBudgets, nextSenders, nextPreferences] = await Promise.all([
      listTransactions(), listBudgets(), listSenders(), loadPreferences(),
    ]);
    setTransactions(nextTransactions);
    setBudgets(nextBudgets);
    setSenders(nextSenders);
    setPreferences(nextPreferences);
  }, []);

  useEffect(() => {
    getDatabase().then(refresh).then(() => setReady(true)).catch(e => {
      setError(e instanceof Error ? e.message : 'Could not open the ledger.');
      setReady(true);
    });
  }, [refresh]);

  const scan = useCallback(async (full = false): Promise<number> => {
    if (Platform.OS !== 'android' || !preferences.readSms) return 0;
    if (scanBusyRef.current) return 0;
    scanBusyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const since = scanStart(full, preferences.lastScanAt);
      const candidates = await readBankSms(senders, since, preferences.autoAdd);
      let added = 0;
      for (const candidate of candidates) if (await addTransaction(candidate)) added++;
      await savePreference('lastScanAt', Date.now());
      await refresh();
      return added;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read SMS.';
      setError(message);
      throw e;
    } finally { scanBusyRef.current = false; setBusy(false); }
  }, [preferences, senders, refresh]);

  const scanRef = useRef(scan);
  useEffect(() => { scanRef.current = scan; }, [scan]);

  useEffect(() => {
    if (!ready || !preferences.readSms || Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void scanRef.current().catch(() => {});
    });
    void scanRef.current().catch(() => {});
    return () => subscription.remove();
  }, [ready, preferences.readSms]);

  const enableSms = useCallback(async () => {
    const granted = await requestSmsPermission();
    if (granted) {
      await savePreference('readSms', true);
      await refresh();
    }
    return granted;
  }, [refresh]);

  const addManual = useCallback(async (merchant: string, rupees: number, direction: Direction, category: Category, occurredAt = Date.now()) => {
    const amountPaise = Math.round(rupees * 100);
    if (!merchant.trim() || !Number.isSafeInteger(amountPaise) || amountPaise <= 0) throw new Error('Enter a merchant and an amount above zero.');
    const now = Date.now();
    await addTransaction({ id: randomUUID(), sourceHash: null, sender: null, rawBody: null,
      occurredAt, merchant: merchant.trim(), amountPaise, direction, category,
      status: 'manual', accountLast4: null, reference: null, confidence: 1,
      createdAt: now, updatedAt: now });
    await refresh();
  }, [refresh]);

  const setTransaction = useCallback(async (id: string, merchant: string, category: Category, status: TransactionStatus) => {
    if (!merchant.trim()) throw new Error('Merchant is required.');
    await editTransaction(id, { merchant, category, status });
    await refresh();
  }, [refresh]);

  const changeBudget = useCallback(async (category: Category, amountPaise: number) => {
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) throw new Error('Enter a budget above zero.');
    await saveBudget(category, amountPaise);
    await refresh();
  }, [refresh]);

  const changePreference = useCallback(async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    await savePreference(key, value);
    await refresh();
  }, [refresh]);

  const value = useMemo<LedgerContextValue>(() => ({
    ready, busy, error, transactions, budgets, senders, preferences, refresh, scan, enableSms,
    addManual, setTransaction, setBudget: changeBudget,
    removeBudget: async category => { await removeBudget(category); await refresh(); },
    setSender: async sender => { await saveSender(sender); await refresh(); },
    removeSender: async address => { await removeSender(address); await refresh(); },
    setPreference: changePreference,
    restore: async snapshot => { await restoreSnapshot(snapshot); await refresh(); },
    clearError: () => setError(null),
  }), [ready, busy, error, transactions, budgets, senders, preferences, refresh, scan, enableSms, addManual, setTransaction, changeBudget, changePreference]);

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const value = useContext(LedgerContext);
  if (!value) throw new Error('LedgerProvider is missing');
  return value;
}

export { exportSnapshot };
