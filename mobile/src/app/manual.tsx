import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Screen, ScreenHead } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { Category, Direction } from '@/lib/model';
import { showMessage } from '@/ui/dialog';

export default function Manual() {
  const p = usePalette();
  const { addManual } = useLedger();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food & dining');
  const [direction, setDirection] = useState<Direction>('debit');
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await addManual(merchant, Number(amount), direction, category); router.back(); }
    catch (e) { showMessage('Check the entry', e instanceof Error ? e.message : 'Try again.'); }
    finally { setSaving(false); }
  }
  return <Screen><ScreenHead title="Add an entry" back />
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
      {(['debit', 'credit'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: direction === value }} onPress={() => setDirection(value)} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: direction === value ? p.leaf : p.surface }}><Text style={{ fontFamily: fonts.bodyMedium, color: direction === value ? p.onLeaf : p.ink }}>{value === 'debit' ? 'Spent' : 'Received'}</Text></Pressable>)}
    </View>
    <View style={{ gap: 20 }}><Field label="Amount in rupees" value={amount} onChangeText={setAmount} numeric placeholder="0.00" /><Field label={direction === 'debit' ? 'Paid to' : 'Received from'} value={merchant} onChangeText={setMerchant} placeholder="Name or place" /><CategoryPicker value={category} onChange={setCategory} /><Action title={saving ? 'Saving…' : 'Save entry'} disabled={saving} onPress={() => void save()} /></View>
  </Screen>;
}
