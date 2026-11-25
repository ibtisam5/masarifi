import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Muted, Row, Title } from '@/components/ui';
import { row, textStart, useTheme } from '@/constants/theme';
import {
  category,
  CATEGORIES,
  DEFAULT_CURRENCY,
  formatMoney,
  monthKey,
  monthLabel,
  shiftMonth,
  today,
  totalsByCurrency,
} from '@/lib/expenses';
import { useExpenses } from '@/lib/expenses-store';

export default function ReportScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const [month, setMonth] = useState(monthKey(today()));

  const monthExpenses = useMemo(() => expenses.filter((e) => monthKey(e.date) === month), [expenses, month]);
  const totals = totalsByCurrency(monthExpenses);
  const currency = totals[0]?.currency ?? DEFAULT_CURRENCY;
  const inCurrency = monthExpenses.filter((e) => e.currency === currency);
  const total = inCurrency.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    amount: inCurrency.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const merchants = Object.entries(
    inCurrency.reduce<Record<string, number>>((acc, e) => {
      const name = e.merchant || category(e.category).label;
      acc[name] = (acc[name] ?? 0) + e.amount;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const isCurrentMonth = month === monthKey(today());

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100, gap: 16 }}>
      <Title>التقرير</Title>

      <Row style={{ justifyContent: 'space-between' }}>
        <MonthArrow label="‹ السابق" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{monthLabel(month)}</Text>
        <MonthArrow label="التالي ›" disabled={isCurrentMonth} onPress={() => setMonth(shiftMonth(month, 1))} />
      </Row>

      <Card style={{ gap: 4 }}>
        <Muted>المجموع</Muted>
        <Text style={[textStart, { color: t.text, fontSize: 30, fontWeight: '800' }]}>{formatMoney(total, currency)}</Text>
        {totals.slice(1).map((o) => (
          <Muted key={o.currency}>+ {formatMoney(o.total, o.currency)}</Muted>
        ))}
        <Muted size={13}>{monthExpenses.length} مصروف</Muted>
      </Card>

      {byCategory.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
          <Text style={{ fontSize: 32 }}>📊</Text>
          <Text style={{ color: t.muted }}>ما فيه مصاريف في هذا الشهر.</Text>
        </Card>
      ) : (
        <>
          <Card style={{ gap: 14 }}>
            <Text style={[textStart, { color: t.text, fontSize: 17, fontWeight: '700' }]}>حسب التصنيف</Text>
            {byCategory.map((c) => {
              const pct = total ? Math.round((c.amount / total) * 100) : 0;
              return (
                <View key={c.id} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={{ color: t.text, fontSize: 15 }}>
                      {c.emoji} {c.label}
                    </Text>
                    <Text style={{ color: t.muted, fontSize: 14 }}>
                      {formatMoney(c.amount, currency)} · {pct}%
                    </Text>
                  </Row>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: t.border, flexDirection: row }}>
                    <View style={{ width: `${Math.max(pct, 2)}%`, borderRadius: 5, backgroundColor: c.color }} />
                  </View>
                </View>
              );
            })}
          </Card>

          <Card style={{ gap: 10 }}>
            <Text style={[textStart, { color: t.text, fontSize: 17, fontWeight: '700' }]}>أكثر الأماكن صرفًا</Text>
            {merchants.map(([name, amount], i) => (
              <Row key={name} style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontSize: 15 }} numberOfLines={1}>
                  {i + 1}. {name}
                </Text>
                <Text style={{ color: t.muted, fontSize: 14 }}>{formatMoney(amount, currency)}</Text>
              </Row>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function MonthArrow({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={10}>
      <Text style={{ color: disabled ? t.border : t.accent, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
