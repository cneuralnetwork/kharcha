import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, Caption, EmptyState, Screen, ScreenHead, SectionTitle, SummarySlip, TransactionRow } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { monthLabel, startOfMonth, money } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { showMessage } from '@/ui/dialog';

export default function Home() {
  const p = usePalette();
  const now = useNow();
  const { transactions, budgets, preferences, scan, busy, error, clearError } = useLedger();
  const start = startOfMonth(now);
  const current = transactions.filter(t => t.occurredAt >= start && t.status !== 'ignored');
  const spent = current.filter(t => t.direction === 'debit').reduce((sum, t) => sum + t.amountPaise, 0);
  const received = current.filter(t => t.direction === 'credit').reduce((sum, t) => sum + t.amountPaise, 0);
  const budget = budgets.reduce((sum, item) => sum + item.amountPaise, 0);
  const review = transactions.filter(t => t.status === 'review').length;
  async function readNow() {
    try { const count = await scan(true); showMessage('SMS checked', count ? `${count} new ${count === 1 ? 'entry' : 'entries'} added.` : 'No new bank transactions found.'); }
    catch (e) { showMessage('Could not read SMS', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title={`${monthLabel(now)}, so far`} action={{ icon: 'plus', label: 'Add a transaction', onPress: () => router.push('/manual') }} />
    <SummarySlip spent={spent} received={received} budget={budget} lastScanAt={preferences.lastScanAt} />
    {error ? <Pressable onPress={clearError} style={{ marginTop: 17, padding: 12, backgroundColor: p.debitSoft, borderRadius: 10 }}><Body>{error}  ×</Body></Pressable> : null}
    {review ? <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/inbox')} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: p.marigoldSoft, borderRadius: 12, padding: 15, marginTop: 19 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{review} {review === 1 ? 'entry needs' : 'entries need'} your eye</Text><Text style={{ color: p.review }}>Review ›</Text>
    </Pressable> : null}
    <View style={{ marginTop: 32, marginBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><SectionTitle>Latest</SectionTitle><Caption>{current.length} this month</Caption></View>
    {current.length ? current.slice(0, 8).map(t => <TransactionRow key={t.id} transaction={t} />) : <EmptyState title="A clean page, for now" detail="Add your first expense or let Kharcha read bank messages on this phone." action={<Action compact title="Add an expense" icon="plus" onPress={() => router.push('/manual')} />} />}
    <View style={{ marginTop: 23, gap: 10 }}>
      {preferences.readSms ? <Action title={busy ? 'Reading messages…' : 'Read new bank SMS'} icon="refresh" variant="secondary" disabled={busy} onPress={() => void readNow()} /> : null}
      <Pressable onPress={() => router.push('/(tabs)/budgets')} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}><Body muted>Monthly budgets</Body><Text style={{ fontFamily: fonts.mono, color: p.ink }}>{budget ? money(budget) : 'Set up ›'}</Text></Pressable>
    </View>
  </Screen>;
}
