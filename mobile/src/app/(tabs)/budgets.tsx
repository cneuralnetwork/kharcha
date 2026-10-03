import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, CategoryDot, EmptyState, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { money, startOfMonth } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';

export default function Budgets() {
  const p = usePalette();
  const now = useNow();
  const { budgets, transactions } = useLedger();
  const spent = transactions.filter(t => t.occurredAt >= startOfMonth(now) && t.direction === 'debit' && t.status !== 'ignored');
  const totalBudget = budgets.reduce((sum, b) => sum + b.amountPaise, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + spent.filter(t => t.category === b.category).reduce((n, t) => n + t.amountPaise, 0), 0);
  return <Screen>
    <ScreenHead title="Keep room for life" action={{ icon: 'plus', label: 'Add a budget', onPress: () => router.push('/budget') }} />
    <View style={{ backgroundColor: p.leaf, borderRadius: 18, padding: 18, marginTop: 6 }}>
      <Text style={{ fontFamily: fonts.body, color: p.onLeaf }}>Across your budgets</Text>
      <Text style={{ fontFamily: fonts.mono, color: p.onLeaf, fontSize: 29, marginTop: 8 }}>{money(totalBudget - totalSpent)}</Text>
      <Text style={{ fontFamily: fonts.body, color: p.onLeaf, marginTop: 5 }}>left of {money(totalBudget)} this month</Text>
      {totalBudget ? <View style={{ height: 7, borderRadius: 4, backgroundColor: `${p.onLeaf}45`, marginTop: 20, overflow: 'hidden' }}><View style={{ backgroundColor: p.marigold, width: `${Math.min(100, totalSpent / totalBudget * 100)}%`, height: 7 }} /></View> : null}
    </View>
    <View style={{ marginTop: 31, marginBottom: 11 }}><SectionTitle>Categories</SectionTitle></View>
    {budgets.length ? budgets.map(b => {
      const used = spent.filter(t => t.category === b.category).reduce((sum, t) => sum + t.amountPaise, 0);
      return <Pressable key={b.category} accessibilityRole="button" accessibilityLabel={`Edit ${b.category} budget`} onPress={() => router.push({ pathname: '/budget', params: { category: b.category } })} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><CategoryDot category={b.category} size={11} /><Text style={{ flex: 1, color: p.ink, fontFamily: fonts.bodyMedium, fontSize: 15 }}>{b.category}</Text><Text style={{ color: p.ink, fontFamily: fonts.mono }}>{money(used)}</Text></View>
        <View style={{ height: 6, backgroundColor: p.sunk, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, used / b.amountPaise * 100)}%`, height: 6, backgroundColor: used > b.amountPaise ? p.debit : p.leaf }} /></View>
        <Text style={{ marginTop: 6, color: p.muted, fontFamily: fonts.body, fontSize: 12 }}>{money(Math.max(0, b.amountPaise - used))} left of {money(b.amountPaise)}{used > b.amountPaise ? ' · Over budget' : ''}</Text>
      </Pressable>;
    }) : <EmptyState title="Make a little room" detail="Set a monthly amount for a category. Kharcha will show how much is left as you spend." action={<Action compact title="Set a budget" icon="plus" onPress={() => router.push('/budget')} />} />}
  </Screen>;
}
