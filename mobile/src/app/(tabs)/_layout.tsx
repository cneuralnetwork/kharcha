import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';

const items: { name: string; label: string; icon: IconName }[] = [
  { name: 'home', label: 'Home', icon: 'home' }, { name: 'inbox', label: 'Inbox', icon: 'inbox' },
  { name: 'insights', label: 'Insights', icon: 'insights' }, { name: 'budgets', label: 'Budgets', icon: 'budgets' },
  { name: 'you', label: 'You', icon: 'you' },
];

export default function TabLayout() {
  const p = usePalette();
  return <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false,
    tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, height: 72, paddingTop: 8, paddingBottom: 8, elevation: 0 },
    tabBarItemStyle: { height: 55 } }}>
    {items.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.label,
      tabBarAccessibilityLabel: item.label,
      tabBarIcon: ({ focused }) => <View style={{ alignItems: 'center', gap: 2, minWidth: 57 }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 3 }}><Icon name={item.icon} color={focused ? p.marigold : p.muted} size={22} /></View>
        <Text style={{ fontFamily: focused ? fonts.bodyMedium : fonts.body, fontSize: 10, color: focused ? p.marigold : p.muted }}>{item.label}</Text>
      </View> }} />)}
  </Tabs>;
}
