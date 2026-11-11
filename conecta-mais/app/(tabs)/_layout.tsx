import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { usePreferences } from '../../src/state/preferences';
import { MIN_TOUCH } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Início', icon: 'home' },
  { name: 'historico', title: 'Histórico', icon: 'time' },
  { name: 'atividades', title: 'Atividades', icon: 'grid' },
  { name: 'configuracoes', title: 'Configurações', icon: 'settings' },
];

export default function TabsLayout() {
  const { palette, fontScale } = usePreferences();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: { fontSize: 11 * Math.min(fontScale, 1.25), fontWeight: '600' },
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border, borderTopWidth: palette.borderWidth, minHeight: MIN_TOUCH + 16 },
        tabBarItemStyle: { minHeight: MIN_TOUCH },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarAccessibilityLabel: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
