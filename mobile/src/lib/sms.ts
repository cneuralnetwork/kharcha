import { PermissionsAndroid, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { parseBankSms } from './parser';
import type { SenderRule, Transaction } from './model';

export function canReadSms(): boolean { return Platform.OS === 'android'; }

export async function requestSmsPermission(): Promise<boolean> {
  if (!canReadSms()) return false;
  return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
    title: 'Read bank transaction SMS',
    message: 'Kharcha reads messages only from the bank senders you allow. OTPs and personal chats are not added to your ledger.',
    buttonPositive: 'Allow', buttonNegative: 'Not now',
  })) === PermissionsAndroid.RESULTS.GRANTED;
}

export async function readBankSms(senders: SenderRule[], since: number, autoAdd: boolean): Promise<Transaction[]> {
  if (!canReadSms()) return [];
  const allowed = senders.filter(sender => sender.enabled).map(sender => sender.address);
  if (!allowed.length) return [];
  const native = (await import('../../modules/kharcha-sms/src/KharchaSmsModule')).default;
  const messages = await native.listMessages(allowed, since);
  const result: Transaction[] = [];
  for (const sms of messages) {
    const parsed = parseBankSms(sms.body);
    if (!parsed) continue;
    const sourceHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${sms.sender}\n${sms.receivedAt}\n${sms.body}`,
    );
    const now = Date.now();
    result.push({
      id: Crypto.randomUUID(), sourceHash, sender: sms.sender, rawBody: sms.body,
      occurredAt: sms.receivedAt, merchant: parsed.merchant, amountPaise: parsed.amountPaise,
      direction: parsed.direction, category: parsed.category,
      status: autoAdd && parsed.confidence >= 0.9 ? 'auto' : 'review',
      accountLast4: parsed.accountLast4, reference: parsed.reference,
      confidence: parsed.confidence, createdAt: now, updatedAt: now,
    });
  }
  return result;
}
