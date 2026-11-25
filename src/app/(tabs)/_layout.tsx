import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/constants/theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <NativeTabs backgroundColor={t.card} indicatorColor={t.accentSoft} labelStyle={{ selected: { color: t.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>مصاريفي</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle.portrait" md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Label>التقرير</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.pie.fill" md="pie_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
