import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { dateLabel, signedMoney } from '@/lib/format';
import type { Category, TransactionStatus } from '@/lib/model';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';

export default function TransactionDetail() {
  const p = usePalette();
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
    <View style={{ marginTop: 5, marginBottom: 26 }}><Text style={{ fontFamily: fonts.mono, fontSize: 33, color: t.direction === 'debit' ? p.debit : p.credit }}>{signedMoney(t.amountPaise, t.direction, true)}</Text><Caption style={{ marginTop: 5 }}>{dateLabel(t.occurredAt)} · {t.status === 'manual' ? 'Added by you' : `from ${t.sender ?? 'SMS'}`}</Caption></View>
    <View style={{ gap: 19, marginBottom: 28 }}><Field label="Name or place" value={merchant} onChangeText={setMerchant} /><CategoryPicker value={category} onChange={setCategory} /></View>
    <View style={{ backgroundColor: p.surface, borderRadius: 12, padding: 15, gap: 13, marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Paid from</Caption><Body>{t.accountLast4 ? `Account ··${t.accountLast4}` : 'Not in source'}</Body></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Reference</Caption><Body>{t.reference ?? 'Not in source'}</Body></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Caption>Current state</Caption><Body>{t.status === 'review' ? 'Needs review' : t.status === 'ignored' ? 'Ignored' : t.status === 'manual' ? 'Manual' : 'In ledger'}</Body></View>
    </View>
    {t.rawBody ? <View style={{ marginBottom: 24 }}><SmsSlip transaction={t} /></View> : null}
    <View style={{ gap: 9, paddingBottom: 15 }}><Action title={busy ? 'Saving…' : 'Save and include'} disabled={busy} onPress={() => void save(t.status === 'manual' ? 'manual' : 'auto')} />
      {t.status !== 'ignored' ? <Action title="Ignore this message" variant="ghost" disabled={busy} onPress={() => void save('ignored')} /> : null}
    </View>
  </Screen>;
}
