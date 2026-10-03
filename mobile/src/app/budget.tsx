import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Screen, ScreenHead } from '@/ui/Kit';
import { CategoryPicker, Field, Note } from '@/ui/Forms';
import { CATEGORIES } from '@/lib/model';
import type { Category } from '@/lib/model';
import { useLedger } from '@/state/LedgerProvider';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function BudgetEditor() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { budgets, setBudget, removeBudget } = useLedger();
  const existing = budgets.find(b => b.category === params.category);
  const [category, setCategory] = useState<Category>(CATEGORIES.includes(params.category as Category) ? params.category as Category : 'Food & dining');
  const [amount, setAmount] = useState(existing ? String(existing.amountPaise / 100) : '');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await setBudget(category, Math.round(Number(amount) * 100)); if (existing && category !== existing.category) await removeBudget(existing.category); router.back(); }
    catch (e) { showMessage('Check the budget', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><ScreenHead title={existing ? 'Edit budget' : 'Set a budget'} back /><View style={{ gap: 22, marginTop: 10 }}>
    <CategoryPicker value={category} onChange={value => { setCategory(value); const other = budgets.find(b => b.category === value); setAmount(other ? String(other.amountPaise / 100) : ''); }} />
    <Field label="Monthly amount in rupees" value={amount} onChangeText={setAmount} numeric placeholder="5,000" />
    <Note>Resets at the start of each calendar month. Your past transactions stay in the ledger.</Note>
    <Action title={busy ? 'Saving…' : 'Save budget'} disabled={busy} onPress={() => void save()} />
    {existing ? <Action title="Remove budget" variant="ghost" onPress={() => confirmAction('Remove budget?', 'Your transactions will stay as they are.', 'Remove', () => void removeBudget(existing.category).then(() => router.back()).catch(() => showMessage('Could not remove budget', 'Try again.')))} /> : null}
  </View></Screen>;
}
