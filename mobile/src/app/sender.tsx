import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function SenderEditor() {
  const p = usePalette();
  const { address: paramAddress } = useLocalSearchParams<{ address?: string }>();
  const { senders, setSender, removeSender } = useLedger();
  const existing = senders.find(s => s.address === paramAddress);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [busy, setBusy] = useState(false);
  async function save() {
    const clean = address.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,25}$/.test(clean) || !label.trim()) { showMessage('Check the sender', 'Enter a sender ID and a name.'); return; }
    setBusy(true);
    try { await setSender({ address: clean, label: label.trim(), enabled }); if (existing && existing.address !== clean) await removeSender(existing.address); router.back(); }
    catch (e) { showMessage('Could not save sender', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><ScreenHead title={existing ? 'Bank sender' : 'Add a sender'} back /><View style={{ gap: 21, marginTop: 9 }}>
    <Field label="Sender ID as shown in SMS" value={address} onChangeText={setAddress} autoCapitalize="characters" placeholder="HDFCBK or VM-HDFCBK" />
    <Field label="Name for you" value={label} onChangeText={setLabel} placeholder="HDFC Bank" />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Body>Read this sender</Body><Caption>Only when SMS reading is on</Caption></View><Switch accessibilityLabel="Read this sender" value={enabled} onValueChange={setEnabled} trackColor={{ false: p.line, true: p.leaf }} /></View>
    <Note>Only listed sender IDs reach the parser. Standard two-letter routing prefixes are ignored when matching, so HDFCBK also matches VM-HDFCBK.</Note>
    <Action title={busy ? 'Saving…' : 'Save sender'} disabled={busy} onPress={() => void save()} />
    {existing ? <Action title="Remove sender" variant="ghost" onPress={() => confirmAction('Remove sender?', 'Existing entries stay in your ledger.', 'Remove', () => void removeSender(existing.address).then(() => router.back()).catch(() => showMessage('Could not remove sender', 'Try again.')))} /> : null}
  </View></Screen>;
}
