import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytesAsync, randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { Snapshot } from './database';

const STORAGE_KEY = 'kharcha.backup.credentials.v1';
const apiUrl = process.env.EXPO_PUBLIC_BACKUP_API_URL?.replace(/\/$/, '');

interface Credentials { id: string; token: string; key: string }

function toBase64Url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, value => String.fromCharCode(value)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeRecoveryCode(code: string): Credentials {
  const parts = code.trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'kharcha1' || !/^[0-9a-f-]{36}$/i.test(parts[1]) ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[2]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[3])) {
    throw new Error('That recovery code is not valid.');
  }
  return { id: parts[1], token: parts[2], key: parts[3].replaceAll('-', '+').replaceAll('_', '/') + '=' };
}

function recoveryCode(credentials: Credentials): string {
  return `kharcha1.${credentials.id}.${credentials.token}.${credentials.key.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`;
}

function endpoint(id: string): string {
  if (!apiUrl || !apiUrl.startsWith('https://')) throw new Error('Set EXPO_PUBLIC_BACKUP_API_URL to your HTTPS Render API URL.');
  return `${apiUrl}/v1/backups/${id}`;
}

async function getCredentials(): Promise<Credentials | null> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return value ? JSON.parse(value) as Credentials : null;
}

export async function getRecoveryCode(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials ? recoveryCode(credentials) : null;
}

export async function enableBackup(): Promise<string> {
  let credentials = await getCredentials();
  if (!credentials) {
    const key = await AESEncryptionKey.generate();
    credentials = {
      id: randomUUID(),
      token: toBase64Url(await getRandomBytesAsync(32)),
      key: await key.encoded('base64'),
    };
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(credentials));
  }
  return recoveryCode(credentials);
}

export async function uploadBackup(snapshot: Snapshot): Promise<void> {
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Turn on backup first.');
  const key = await AESEncryptionKey.import(credentials.key, 'base64');
  const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(snapshot)), key);
  const ciphertext = await sealed.combined('base64') as string;
  const headers = { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' };
  const current = await fetch(endpoint(credentials.id), { headers });
  if (!current.ok && current.status !== 404) throw new Error('Could not check the current backup. Try again.');
  const version = current.ok ? (await current.json() as { version: number }).version : 0;
  const response = await fetch(endpoint(credentials.id), {
    method: 'PUT', headers, body: JSON.stringify({ version, ciphertext }),
  });
  if (response.status === 409) throw new Error('The backup changed on another device. Restore it before uploading again.');
  if (!response.ok) throw new Error('Backup could not be saved. Try again.');
}

export async function downloadBackup(code: string): Promise<Snapshot> {
  const credentials = decodeRecoveryCode(code);
  const response = await fetch(endpoint(credentials.id), { headers: { Authorization: `Bearer ${credentials.token}` } });
  if (!response.ok) throw new Error('Backup not found. Check the recovery code.');
  const { ciphertext } = await response.json() as { ciphertext: string };
  const key = await AESEncryptionKey.import(credentials.key, 'base64');
  let snapshot: Snapshot;
  try {
    const clear = await aesDecryptAsync(AESSealedData.fromCombined(ciphertext), key) as Uint8Array;
    snapshot = JSON.parse(new TextDecoder().decode(clear)) as Snapshot;
  } catch {
    throw new Error('Could not decrypt this backup. Check the recovery code.');
  }
  if (snapshot.schema !== 1) throw new Error('This backup was made by an unsupported version of Kharcha.');
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(credentials));
  return snapshot;
}

export async function deleteRemoteBackup(): Promise<void> {
  const credentials = await getCredentials();
  if (!credentials) return;
  const response = await fetch(endpoint(credentials.id), {
    method: 'DELETE', headers: { Authorization: `Bearer ${credentials.token}` },
  });
  if (!response.ok && response.status !== 404) throw new Error('Could not delete the remote backup. Try again.');
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
