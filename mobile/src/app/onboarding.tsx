import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Action, Body } from '@/ui/Kit';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';

export default function Onboarding() {
  const p = usePalette();
  const { enableSms, setPreference } = useLedger();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  async function finish(readSms: boolean) {
    setBusy(true);
    setFailure(null);
    try {
      if (readSms) {
        const granted = await enableSms();
        if (!granted) Alert.alert('Permission not granted', 'You can add expenses manually and enable SMS reading later.');
      }
      await setPreference('onboardingDone', true);
      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again.';
      setFailure(message);
      if (Platform.OS !== 'web') Alert.alert('Could not continue', message);
    }
    finally { setBusy(false); }
  }
  return <Screen><View style={{ flex: 1, minHeight: 620, paddingTop: 24, paddingBottom: 26, justifyContent: 'space-between' }}>
    <View>
      <Text style={{ fontFamily: fonts.display, fontSize: 30, color: p.ink }}>kharcha<Text style={{ color: p.marigold }}>.</Text></Text>
      <View style={{ marginTop: 40, marginBottom: 22, alignSelf: 'flex-start', transform: [{ rotate: '-5deg' }] }}>
        <View style={{ width: 190, height: 190, backgroundColor: p.leaf, padding: 17, borderRadius: 16, justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: p.onLeaf, fontSize: 13 }}>A quieter way to see spending</Text>
          <View><Text style={{ fontFamily: fonts.mono, color: p.onLeaf, fontSize: 25 }}>₹ 2,480.00</Text><Text style={{ fontFamily: fonts.body, color: p.onLeaf, marginTop: 7 }}>UPI · Today, 12:40 pm</Text></View>
          <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: p.onLeaf, paddingTop: 14 }}><Text style={{ fontFamily: fonts.bodyMedium, color: p.onLeaf }}>Read. Sorted. Yours.</Text></View>
        </View>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 43, color: p.ink, maxWidth: 480 }}>Your money, decoded.</Text>
      <Body muted style={{ marginTop: 14, maxWidth: 420 }}>Kharcha reads bank SMS on your phone and turns them into a private spending ledger. Keep the message beside every entry, so you can always check the source.</Body>
    </View>
    <View style={{ gap: 12, paddingTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="lock" color={p.leaf} size={19} /><Body>Stays on this device. Backup is your choice.</Body></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="sms" color={p.leaf} size={19} /><Body>Bank senders only. OTP patterns are filtered.</Body></View>
      <Action title={busy ? 'One moment…' : Platform.OS === 'android' ? 'Read my bank SMS' : 'Start my ledger'} onPress={() => void finish(Platform.OS === 'android')} disabled={busy} />
      {failure ? <Text accessibilityRole="alert" style={{ color: p.debit, fontFamily: fonts.body }}>{failure}</Text> : null}
      {Platform.OS === 'android' ? <Pressable accessibilityRole="button" onPress={() => void finish(false)} disabled={busy} style={{ paddingVertical: 12, alignItems: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.ink }}>Start with manual entries</Text></Pressable> : null}
    </View>
  </View></Screen>;
}
