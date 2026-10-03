import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { dateLabel, signedMoney } from '@/lib/format';
import type { Category, Transaction, TransactionStatus } from '@/lib/model';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';

function TransactionSummary({ transaction: t }: { transaction: Transaction }) {
  const p = usePalette();
  const source = t.status === 'manual' ? 'Added by you' : `from ${t.sender ?? 'SMS'}`;
  return <View style={{ marginTop: 5, marginBottom: 26 }}>
    <Text style={{ fontFamily: fonts.mono, fontSize: 33, color: t.direction === 'debit' ? p.debit : p.credit }}>
      {signedMoney(t.amountPaise, t.direction, true)}
    </Text>
    <Caption style={{ marginTop: 5 }}>{dateLabel(t.occurredAt)} · {source}</Caption>
  </View>;
}

const statusLabels: Record<TransactionStatus, string> = {
  review: 'Needs review', ignored: 'Ignored', manual: 'Manual', auto: 'In ledger',
};

function TransactionFacts({ transaction: t }: { transaction: Transaction }) {
  const p = usePalette();
  return <View style={{ backgroundColor: p.surface, borderRadius: 12, padding: 15, gap: 13, marginBottom: 28 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Paid from</Caption><Body>{t.accountLast4 ? `Account ··${t.accountLast4}` : 'Not in source'}</Body></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Reference</Caption><Body>{t.reference ?? 'Not in source'}</Body></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Current state</Caption><Body>{statusLabels[t.status]}</Body></View>
  </View>;
}

function TransactionActions({ transaction, busy, onSave }: { transaction: Transaction; busy: boolean; onSave: (status: TransactionStatus) => void }) {
  return <View style={{ gap: 9, paddingBottom: 15 }}>
    <Action title={busy ? 'Saving…' : 'Save and include'} disabled={busy} onPress={() => onSave(transaction.status === 'manual' ? 'manual' : 'auto')} />
    {transaction.status !== 'ignored' ? <Action title="Ignore this message" variant="ghost" disabled={busy} onPress={() => onSave('ignored')} /> : null}
  </View>;
}

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, setTransaction } = useLedger();
  const t = transactions.find(item => item.id === id);
  const [merchant, setMerchant] = useState(t?.merchant ?? '');
  const [category, setCategory] = useState<Category>(t?.category ?? 'Transfers');
  const [busy, setBusy] = useState(false);
  if (!t) return <Screen><ScreenHead title="Entry not found" back /><Body muted>This entry may have been removed when a backup was restored.</Body></Screen>;
  async function save(status: TransactionStatus) {
    if (!t) return;
    setBusy(true);
    try { await setTransaction(t.id, merchant, category, status); router.back(); }
    catch (e) { showMessage('Could not save', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><ScreenHead title="The whole story" back />
    <TransactionSummary transaction={t} />
    <View style={{ gap: 19, marginBottom: 28 }}><Field label="Name or place" value={merchant} onChangeText={setMerchant} /><CategoryPicker value={category} onChange={setCategory} /></View>
    <TransactionFacts transaction={t} />
    {t.rawBody ? <View style={{ marginBottom: 24 }}><SmsSlip transaction={t} /></View> : null}
    <TransactionActions transaction={t} busy={busy} onSave={status => void save(status)} />
  </Screen>;
}
