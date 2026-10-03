import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { exportSnapshot, useLedger } from '@/state/LedgerProvider';
import { deleteRemoteBackup, downloadBackup, enableBackup, getRecoveryCode, uploadBackup } from '@/lib/backup';
import { fonts, usePalette } from '@/ui/theme';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function Backup() {
  const p = usePalette();
  const { restore } = useLedger();
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getRecoveryCode().then(setCode).catch(() => {}); }, []);
  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    try { await action(); showMessage('Done', done); }
    catch (e) { showMessage('Could not finish', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  if (Platform.OS === 'web') return <Screen><ScreenHead title="Encrypted backup" back /><Body muted>Encrypted backup is available in the installed iOS and Android apps. Your web ledger remains on this browser.</Body></Screen>;
  return <Screen><ScreenHead title="Encrypted backup" back /><Body muted>Your phone encrypts the ledger before upload. The Render API sees ciphertext, never your transactions or messages.</Body>
    <View style={{ marginTop: 30, gap: 13 }}><SectionTitle>Your recovery code</SectionTitle>
      {code ? <Pressable accessibilityRole="button" accessibilityLabel="Copy recovery code" onPress={() => void Clipboard.setStringAsync(code).then(() => showMessage('Copied', 'Store this code somewhere private.'))} style={{ backgroundColor: p.surface, padding: 15, borderRadius: 12 }}><Text selectable style={{ color: p.ink, fontFamily: fonts.monoRegular, fontSize: 12, lineHeight: 20 }}>{code}</Text><Caption style={{ marginTop: 9 }}>Tap to copy</Caption></Pressable> : <Action title="Create a recovery code" onPress={() => void run(async () => { setCode(await enableBackup()); }, 'Your code is ready. Copy and store it safely.')} disabled={busy} />}
      <Note>Anyone with this code can restore your backup. We cannot recover it if you lose it. A new upload replaces the previous encrypted snapshot.</Note>
      {code ? <Action title={busy ? 'Working…' : 'Back up now'} onPress={() => void run(async () => { await uploadBackup(await exportSnapshot()); }, 'Encrypted backup saved on Render.')} disabled={busy} /> : null}
    </View>
    <View style={{ marginTop: 35, gap: 13 }}><SectionTitle>Restore on this phone</SectionTitle><Field label="Recovery code" value={input} onChangeText={setInput} placeholder="kharcha1.…" autoCapitalize="none" />
      <Action title="Restore backup" variant="secondary" disabled={busy} onPress={() => confirmAction('Replace your ledger?', 'Restoring replaces entries, budgets, and sender rules on this phone.', 'Restore', () => void run(async () => { await restore(await downloadBackup(input)); router.back(); }, 'Your ledger was restored.'))} />
    </View>
    {code ? <View style={{ marginTop: 30 }}><Action title="Delete remote backup" variant="ghost" disabled={busy} onPress={() => confirmAction('Delete remote backup?', 'Your local ledger will stay on this phone. The remote ciphertext will be removed.', 'Delete', () => void run(async () => { await deleteRemoteBackup(); setCode(null); }, 'Remote backup deleted.'))} /></View> : null}
  </Screen>;
}
