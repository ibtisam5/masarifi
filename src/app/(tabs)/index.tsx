import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Button, Card, Muted, Row, Title } from '@/components/ui';
import { row, textStart, useTheme } from '@/constants/theme';
import {
  category,
  DEFAULT_CURRENCY,
  formatDay,
  formatMoney,
  monthKey,
  monthLabel,
  today,
  totalsByCurrency,
  type Expense,
} from '@/lib/expenses';
import { draftHolder, useExpenses } from '@/lib/expenses-store';
import { scanReceipt } from '@/lib/scan';

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, loaded } = useExpenses();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thisMonth = monthKey(today());
  const monthExpenses = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === thisMonth),
    [expenses, thisMonth],
  );
  const totals = totalsByCurrency(monthExpenses);
  const [main, ...others] = totals.length ? totals : [{ currency: DEFAULT_CURRENCY, total: 0, count: 0 }];

  async function scan(source: 'camera' | 'library') {
    setError(null);
    setScanning(true);
    const result = await scanReceipt(source);
    setScanning(false);
    if (result.ok) {
      draftHolder.set(result.draft);
      router.push({ pathname: '/review', params: { scanned: '1', missingDate: result.missingDate ? '1' : '' } });
    } else if (!('canceled' in result)) {
      setError(result.error);
    }
  }

  function addManually() {
    draftHolder.set({
      merchant: '',
      amount: 0,
      currency: main.currency,
      date: today(),
      category: 'other',
      items: [],
      source: 'manual',
    });
    router.push('/review');
  }

  function open(expense: Expense) {
    draftHolder.set(expense);
    router.push('/review');
  }

  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <View style={{ gap: 2 }}>
        <Title>مصاريفي</Title>
        <Muted>{monthLabel(thisMonth)}</Muted>
      </View>

      <Card style={{ backgroundColor: t.accent, borderColor: t.accent, gap: 6 }}>
        <Text style={[textStart, { color: t.accentText, opacity: 0.85, fontSize: 14 }]}>مصاريف هذا الشهر</Text>
        <Text style={[textStart, { color: t.accentText, fontSize: 34, fontWeight: '800' }]}>
          {formatMoney(main.total, main.currency)}
        </Text>
        {others.map((o) => (
          <Text key={o.currency} style={[textStart, { color: t.accentText, opacity: 0.85 }]}>
            + {formatMoney(o.total, o.currency)}
          </Text>
        ))}
        <Text style={[textStart, { color: t.accentText, opacity: 0.85, fontSize: 13 }]}>
          {monthExpenses.length} {monthExpenses.length === 1 ? 'مصروف' : 'مصاريف'}
        </Text>
      </Card>

      <Button label="📷  صوّر فاتورة" onPress={() => scan('camera')} />
      <Row style={{ gap: 10 }}>
        <Button label="🖼️  من الصور" variant="secondary" onPress={() => scan('library')} style={{ flex: 1 }} />
        <Button label="✍️  إضافة يدوية" variant="secondary" onPress={addManually} style={{ flex: 1 }} />
      </Row>

      {error && <Banner text={error} tone="error" />}

      {expenses.length > 0 && (
        <Text style={[textStart, { color: t.text, fontSize: 18, fontWeight: '700', marginTop: 8 }]}>
          آخر المصاريف
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100, gap: 10 }}
        ListEmptyComponent={
          loaded ? (
            <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 28 }}>
              <Text style={{ fontSize: 36 }}>🧾</Text>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>ما فيه مصاريف للحين</Text>
              <Text style={{ color: t.muted, textAlign: 'center' }}>صوّر أول فاتورة، والتطبيق يقرأها لك.</Text>
            </Card>
          ) : (
            <ActivityIndicator color={t.accent} />
          )
        }
        renderItem={({ item }) => <ExpenseRow expense={item} onPress={() => open(item)} />}
      />

      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.overlay}>
          <Card style={{ alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={t.accent} />
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>جاري قراءة الفاتورة...</Text>
            <Text style={{ color: t.muted, fontSize: 13 }}>يستغرق عادة بضع ثواني</Text>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

function ExpenseRow({ expense, onPress }: { expense: Expense; onPress: () => void }) {
  const t = useTheme();
  const c = category(expense.category);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <View style={[styles.icon, { backgroundColor: c.color + '22' }]}>
          <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={[textStart, { color: t.text, fontSize: 16, fontWeight: '600' }]}>
            {expense.merchant || c.label}
          </Text>
          <Text style={[textStart, { color: t.muted, fontSize: 13 }]}>
            {c.label} · {formatDay(expense.date)}
          </Text>
        </View>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
          {formatMoney(expense.amount, expense.currency)}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
