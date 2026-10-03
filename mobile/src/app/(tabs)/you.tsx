import React from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';

export default function You() {
  const p = usePalette();
  const { preferences, senders, setPreference, enableSms } = useLedger();
  async function toggleRead(value: boolean) {
    try {
      if (value) { const granted = await enableSms(); if (!granted) showMessage('Permission needed', 'SMS reading needs Android READ_SMS permission.'); }
      else await setPreference('readSms', false);
    } catch (e) { showMessage('Could not change setting', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title="Reading rules" />
    <Body muted>Kharcha reads only allowlisted bank senders on Android. Your ledger stays on this device until you choose to back it up.</Body>
    <View style={{ marginTop: 31, marginBottom: 8 }}><SectionTitle>On this phone</SectionTitle></View>
    {Platform.OS === 'android' ? <Setting title="Read bank SMS" detail="Look for transactions when the app opens" value={preferences.readSms} onChange={value => void toggleRead(value)} /> : <View style={{ paddingVertical: 15 }}><Body>SMS reading is available on Android builds.</Body><Caption>Manual entries work here too.</Caption></View>}
    <Setting title="Auto-add when confident" detail="Uncertain reads wait in your inbox" value={preferences.autoAdd} onChange={value => void setPreference('autoAdd', value)} />
    <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.line }}><Body>OTP patterns are filtered</Body><Caption>Review uncertain messages before keeping them in your ledger.</Caption></View>
    <View style={{ marginTop: 30, marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between' }}><SectionTitle>Bank senders</SectionTitle><Pressable accessibilityRole="button" accessibilityLabel="Add a bank sender" onPress={() => router.push('/sender')}><Icon name="plus" color={p.ink} size={21} /></Pressable></View>
    {senders.map(sender => <Pressable key={sender.address} accessibilityRole="button" accessibilityLabel={`Edit ${sender.label}`} onPress={() => router.push({ pathname: '/sender', params: { address: sender.address } })} style={{ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1 }}><Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{sender.label}</Text><Caption>{sender.address} · {sender.enabled ? 'Reading' : 'Paused'}</Caption></View><Icon name="chevron" color={p.muted} size={17} /></Pressable>)}
    <View style={{ marginTop: 32, marginBottom: 9 }}><SectionTitle>Your data</SectionTitle></View>
    <Menu title="Paste a bank SMS" detail="Parse a message you choose" icon="sms" onPress={() => router.push('/import')} />
    <Menu title="Encrypted backup" detail="Optional · stored on your Render API" icon="cloud" onPress={() => router.push('/backup')} />
    <View style={{ height: 24 }} />
  </Screen>;
}

function Setting({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  const p = usePalette();
  return <View style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center', gap: 15 }}><View style={{ flex: 1 }}><Body>{title}</Body><Caption>{detail}</Caption></View><Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: p.line, true: p.leaf }} thumbColor={value ? p.onLeaf : p.muted} /></View>;
}
function Menu({ title, detail, icon, onPress }: { title: string; detail: string; icon: 'sms' | 'cloud'; onPress: () => void }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name={icon} color={p.ink} size={21} /><View style={{ flex: 1 }}><Body>{title}</Body><Caption>{detail}</Caption></View><Icon name="chevron" color={p.muted} size={17} /></Pressable>;
}
