import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, EmptyState, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { TransactionStatus } from '@/lib/model';
import { showMessage } from '@/ui/dialog';

const tabs: { title: string; status: TransactionStatus }[] = [
  { title: 'To review', status: 'review' }, { title: 'In ledger', status: 'auto' }, { title: 'Ignored', status: 'ignored' },
];

export default function Inbox() {
  const p = usePalette();
  const { transactions, setTransaction } = useLedger();
  const [selected, setSelected] = useState<TransactionStatus>('review');
  const visible = transactions.filter(t => t.status === selected && t.rawBody);
  async function change(id: string, merchant: string, category: typeof transactions[number]['category'], status: TransactionStatus) {
    try { await setTransaction(id, merchant, category, status); }
    catch (e) { showMessage('Could not update', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title="Needs your eye" action={{ icon: 'plus', label: 'Add a transaction', onPress: () => router.push('/manual') }} />
    <Body muted>Kharcha keeps the original bank message beside what it understood. You have the last word.</Body>
    <View style={{ flexDirection: 'row', marginTop: 22, padding: 4, backgroundColor: p.sunk, borderRadius: 12, gap: 3 }}>
      {tabs.map(tab => <Pressable key={tab.status} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.status }} onPress={() => setSelected(tab.status)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: selected === tab.status ? p.surface : 'transparent', borderRadius: 9 }}><Text style={{ fontFamily: selected === tab.status ? fonts.bodyMedium : fonts.body, color: selected === tab.status ? p.ink : p.muted, fontSize: 12 }}>{tab.title}</Text></Pressable>)}
    </View>
    <View style={{ marginTop: 16, gap: 15 }}>
      {visible.length ? visible.map(t => <SmsSlip key={t.id} transaction={t} actions={<View style={{ flexDirection: 'row', gap: 7 }}>
        {selected !== 'ignored' ? <View style={{ flex: 1 }}><Action compact title="Not a spend" variant="ghost" onPress={() => void change(t.id, t.merchant, t.category, 'ignored')} /></View> : null}
        <View style={{ flex: 1 }}><Action compact title="Fix" variant="secondary" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })} /></View>
        {selected !== 'auto' ? <View style={{ flex: 1 }}><Action compact title="Looks right" variant="leaf" onPress={() => void change(t.id, t.merchant, t.category, 'auto')} /></View> : null}
      </View>} />) : <EmptyState title={selected === 'review' ? 'All caught up' : 'Nothing here yet'} detail={selected === 'review' ? 'New messages that need a closer look will land here.' : 'Bank messages will appear after an Android scan.'} />}
    </View>
  </Screen>;
}
