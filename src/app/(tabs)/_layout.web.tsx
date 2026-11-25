import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text, View, type PressableProps } from 'react-native';

import { row, useTheme } from '@/constants/theme';

// Native tabs have no system tab bar on the web, so the web gets its own
// bottom bar built from Expo Router's headless tabs.
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs style={{ flex: 1, backgroundColor: t.bg }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={{
          flexDirection: row,
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.card,
        }}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="🧾" label="مصاريفي" />
        </TabTrigger>
        <TabTrigger name="report" href="/report" asChild>
          <TabButton icon="📊" label="التقرير" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: string; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      // TabTriggerSlotProps types its ref differently from Pressable; the
      // runtime props match, so cast to keep the type checker happy.
      {...(props as PressableProps)}
      style={{
        flex: 1,
        maxWidth: 220,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: isFocused ? t.accentSoft : 'transparent',
      }}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text style={{ fontSize: 13, fontWeight: isFocused ? '700' : '500', color: isFocused ? t.accent : t.muted }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
