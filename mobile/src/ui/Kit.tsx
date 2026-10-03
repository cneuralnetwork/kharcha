import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import type { Category, Transaction } from '@/lib/model';
import { dateLabel, money, signedMoney, timeLabel } from '@/lib/format';
import { categoryColors, fonts, usePalette } from './theme';
import type { Palette } from './theme';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export function Body({ children, muted = false, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  const p = usePalette();
  return <Text style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: muted ? p.muted : p.ink }, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  const p = usePalette();
  return <Text style={[{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: p.ink }, style]}>{children}</Text>;
}

export function Caption({ children, style, numberOfLines }: { children: React.ReactNode; style?: object; numberOfLines?: number }) {
  const p = usePalette();
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: p.muted }, style]}>{children}</Text>;
}

export function Title({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const p = usePalette();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: compact ? 25 : 36, lineHeight: compact ? 31 : 40, color: p.ink, letterSpacing: -.5 }}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.displayMedium, fontSize: 18, color: p.ink, lineHeight: 24 }}>{children}</Text>;
}

export function Screen({ children, scroll = true, inset = true }: { children: React.ReactNode; scroll?: boolean; inset?: boolean }) {
  const p = usePalette();
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}>
    {scroll ? <ScrollView contentContainerStyle={{ paddingHorizontal: inset ? 16 : 0, paddingBottom: 28, flexGrow: 1 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      : <View style={{ flex: 1, paddingHorizontal: inset ? 16 : 0 }}>{children}</View>}
  </SafeAreaView>;
}

export function ScreenHead({ title, back = false, action }: { title: string; back?: boolean; action?: { icon: IconName; label: string; onPress: () => void } }) {
  const p = usePalette();
  return <View style={{ paddingTop: 18, paddingBottom: 16 }}>
    <View style={{ minHeight: back || action ? 35 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {back ? <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={{ padding: 5, marginLeft: -5 }}><Icon name="back" color={p.ink} /></Pressable>
        : action ? <View style={{ flex: 1 }} /> : null}
      {action ? <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} style={{ padding: 7, marginRight: -7 }}><Icon name={action.icon} color={p.ink} size={21} /></Pressable> : null}
    </View>
    <Title compact={back}>{title}</Title>
  </View>;
}

export function Action({ title, onPress, icon, variant = 'primary', disabled = false, compact = false }: {
  title: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'secondary' | 'ghost' | 'leaf'; disabled?: boolean; compact?: boolean;
}) {
  const p = usePalette();
  const backgroundColor = variant === 'primary' ? p.marigold : variant === 'leaf' ? p.leaf : variant === 'secondary' ? p.surface : 'transparent';
  const color = variant === 'primary' ? p.onMarigold : variant === 'leaf' ? p.onLeaf : p.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ minHeight: compact ? 38 : 48, paddingHorizontal: compact ? 12 : 18, borderRadius: 12,
      backgroundColor, borderWidth: variant === 'secondary' ? 1 : 0, borderColor: p.strongLine,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      opacity: disabled ? .45 : pressed ? .82 : 1 }]}>
    {icon ? <Icon name={icon} color={color} size={18} /> : null}
    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: compact ? 13 : 15, color }}>{title}</Text>
  </Pressable>;
}

export function CategoryDot({ category, size = 8 }: { category: Category; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: categoryColors[category] }} />;
}

export function CategoryChip({ category, onPress }: { category: Category; onPress?: () => void }) {
  const p = usePalette();
  const inner = <><CategoryDot category={category} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: p.ink }}>{category}</Text></>;
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'flex-start' as const, gap: 6,
    minHeight: 27 };
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={category} style={style}>{inner}</Pressable>
    : <View style={style}>{inner}</View>;
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const p = usePalette();
  const t = transaction;
  return <Pressable onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })}
    accessibilityRole="button" accessibilityLabel={`${t.merchant}, ${t.direction === 'debit' ? 'spent' : 'received'} ${money(t.amountPaise)}, ${t.category}`}
    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: t.status === 'review' ? 8 : 0,
      gap: 12, borderRadius: 12, backgroundColor: t.status === 'review' ? p.marigoldSoft : pressed ? p.surface : 'transparent', borderBottomWidth: t.status === 'review' ? 0 : StyleSheet.hairlineWidth, borderBottomColor: p.line }]}>
    <View style={{ width: 36, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: p.ink }}>{t.merchant[0]?.toUpperCase() ?? '?'}</Text>
      <View style={{ position: 'absolute', right: 0, bottom: 0 }}><CategoryDot category={t.category} size={7} /></View>
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Label style={{ fontSize: 15 }}><Text numberOfLines={1}>{t.merchant}</Text></Label>
      <Caption style={{ marginTop: 2 }} numberOfLines={1}>{t.category} · {timeLabel(t.occurredAt)}{t.accountLast4 ? ` · ··${t.accountLast4}` : ''}</Caption>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 3 }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: t.direction === 'debit' ? p.debit : p.credit }}>{signedMoney(t.amountPaise, t.direction)}</Text>
      <Caption style={{ color: t.status === 'review' ? p.review : p.muted }}>{t.status === 'review' ? 'Needs review' : t.status === 'manual' ? 'Added by you' : 'from SMS'}</Caption>
    </View>
  </Pressable>;
}

function highlightedBody(body: string, p: Palette): React.ReactNode[] {
  const pattern = /((?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{1,2})?|(?:A\/c|Acct|Card)\s*(?:[Xx*·-]+)?\d{3,4}|[\w.+-]+@[\w.-]+)/gi;
  const output: React.ReactNode[] = [];
  let cursor = 0; let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    if (match.index > cursor) output.push(body.slice(cursor, match.index));
    const isAmount = /^(?:Rs|INR|₹)/i.test(match[0]);
    output.push(<Text key={match.index} style={isAmount ? { backgroundColor: p.marigoldSoft, color: p.ink, fontFamily: fonts.mono } : { textDecorationLine: 'underline', color: p.ink }}>{match[0]}</Text>);
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) output.push(body.slice(cursor));
  return output;
}

export function SmsSlip({ transaction, actions }: { transaction: Transaction; actions?: React.ReactNode }) {
  const p = usePalette();
  if (!transaction.rawBody) return null;
  return <View style={{ backgroundColor: p.surface, borderRadius: 20, borderWidth: 1, borderColor: transaction.status === 'review' ? p.marigold : p.line, overflow: 'hidden' }}>
    <View style={{ paddingHorizontal: 15, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="sms" color={p.muted} size={15} /><Text style={{ fontFamily: fonts.mono, fontSize: 12, color: p.muted }}>{transaction.sender}</Text></View>
      <Caption>{timeLabel(transaction.occurredAt)}</Caption>
    </View>
    <View style={{ margin: 12, padding: 12, backgroundColor: p.sunk, borderRadius: 12 }}>
      <Text selectable style={{ fontFamily: fonts.monoRegular, fontSize: 12, lineHeight: 19, color: p.ink }}>{highlightedBody(transaction.rawBody, p)}</Text>
    </View>
    <View style={{ marginTop: 9, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: p.line, padding: 15, gap: 9 }}>
      <View style={{ position: 'absolute', top: -8, left: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }} />
      <View style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }} />
      <Caption>Read as</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Label style={{ flex: 1 }}><Text numberOfLines={1}>{transaction.merchant}</Text></Label>
        <Text style={{ fontFamily: fonts.mono, color: transaction.direction === 'debit' ? p.debit : p.credit, fontSize: 14 }}>{signedMoney(transaction.amountPaise, transaction.direction)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryChip category={transaction.category} />
        <Caption style={{ color: transaction.status === 'review' ? p.review : p.leaf }}>{transaction.status === 'review' ? 'Needs review' : transaction.status === 'ignored' ? 'Ignored' : 'In ledger'}</Caption>
      </View>
      {actions ? <View style={{ marginTop: 7 }}>{actions}</View> : null}
    </View>
  </View>;
}

export function SummarySlip({ spent, received, budget, lastScanAt }: { spent: number; received: number; budget: number; lastScanAt: number }) {
  const p = usePalette();
  const [width, setWidth] = useState(350);
  const ratio = budget ? Math.min(1, spent / budget) : 0;
  const [progress] = useState(() => new Animated.Value(ratio));
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (reduceMotion) { progress.setValue(ratio); return; }
    const animation = Animated.timing(progress, { toValue: ratio, duration: 380, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [ratio, progress, reduceMotion]);
  const count = Math.ceil(width / 16);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ backgroundColor: p.leaf, borderRadius: 20, marginBottom: 9, padding: 16, paddingBottom: 24 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ backgroundColor: p.marigold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: p.onMarigold }}>{new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date())}</Text></View>
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: p.onLeaf }}>{lastScanAt ? `Read ${dateLabel(lastScanAt)}` : 'On this phone'}</Text>
    </View>
    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: p.onLeaf, marginTop: 20 }}>Spent</Text>
    <Text style={{ fontFamily: fonts.mono, fontSize: 34, lineHeight: 45, color: p.onLeaf }}>{money(spent)}</Text>
    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: p.onLeaf, marginTop: 7 }}>↙ In {signedMoney(received, 'credit')}     ↗ Out {signedMoney(spent, 'debit')}</Text>
    {budget > 0 ? <View style={{ marginTop: 16 }}>
      <View style={{ height: 6, borderRadius: 4, backgroundColor: `${p.onLeaf}45`, overflow: 'hidden' }}><Animated.View style={{ width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: 6, backgroundColor: p.marigold }} /></View>
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: p.onLeaf, marginTop: 5 }}>{Math.round(spent / budget * 100)}% of {money(budget)} budget</Text>
    </View> : null}
    <Svg pointerEvents="none" width={width} height={9} style={{ position: 'absolute', bottom: -8, left: 0 }}>
      {Array.from({ length: count }, (_, index) => <Circle key={index} cx={index * 16 + 8} cy={8} r={6} fill={p.bg} />)}
    </Svg>
  </View>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  const p = usePalette();
  return <View style={{ paddingVertical: 36, paddingHorizontal: 22, alignItems: 'flex-start', gap: 10, backgroundColor: p.surface, borderRadius: 18 }}>
    <SectionTitle>{title}</SectionTitle><Body muted>{detail}</Body>{action ? <View style={{ marginTop: 10 }}>{action}</View> : null}
  </View>;
}

export function LoadingScreen() {
  const p = usePalette();
  return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}><ActivityIndicator color={p.marigold} /></SafeAreaView>;
}
