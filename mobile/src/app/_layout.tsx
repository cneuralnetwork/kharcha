import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { HankenGrotesk_400Regular, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { LedgerProvider } from '@/state/LedgerProvider';
import { LoadingScreen } from '@/ui/Kit';
import { usePalette } from '@/ui/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold,
    HankenGrotesk_400Regular, HankenGrotesk_600SemiBold, IBMPlexMono_400Regular, IBMPlexMono_500Medium });
  const p = usePalette();
  if (!loaded) return <LoadingScreen />;
  const stack = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }} />;
  return <SafeAreaProvider><LedgerProvider>
    <StatusBar style={p.bg === '#121412' ? 'light' : 'dark'} />
    {Platform.OS === 'web' ? <View style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: 520, backgroundColor: p.bg }}>{stack}</View> : stack}
  </LedgerProvider></SafeAreaProvider>;
}
