import { Redirect } from 'expo-router';
import { useLedger } from '@/state/LedgerProvider';
import { LoadingScreen } from '@/ui/Kit';

export default function Index() {
  const { ready, preferences } = useLedger();
  if (!ready) return <LoadingScreen />;
  return <Redirect href={preferences.onboardingDone ? '/(tabs)/home' : '/onboarding'} />;
}
