import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Banner, Button, Card, Chip, Row } from '@/components/ui';
import { row, textStart, useTheme } from '@/constants/theme';
import {
  CATEGORIES,
  DEFAULT_CURRENCY,
  formatMoney,
  today,
  type CategoryId,
  type ExpenseDraft,
} from '@/lib/expenses';
import { draftHolder, useExpenses } from '@/lib/expenses-store';

const CURRENCIES = ['OMR', 'SAR', 'AED', 'USD'];

const blankDraft = (): ExpenseDraft => ({
  merchant: '',
  amount: 0,
  currency: DEFAULT_CURRENCY,
  date: today(),
  category: 'other',
  items: [],
  source: 'manual',
});

export default function ReviewScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ scanned?: string; missingDate?: string }>();
  const { save, remove } = useExpenses();

  const [draft] = useState<ExpenseDraft>(() => draftHolder.take() ?? blankDraft());
  const [merchant, setMerchant] = useState(draft.merchant);
  const [amount, setAmount] = useState(draft.amount ? String(draft.amount) : '');
  const [currency, setCurrency] = useState(draft.currency);
  const [date, setDate] = useState(draft.date);
  const [cat, setCat] = useState<CategoryId>(draft.category);
  const [note, setNote] = useState(draft.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(draft.id);
  const currencies = CURRENCIES.includes(currency) ? CURRENCIES : [currency, ...CURRENCIES];

  function onSave() {
    const value = Number(amount.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return setError('اكتب مبلغ صحيح أكبر من صفر.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('اكتب التاريخ بهذا الشكل: 2026-11-21');
    save({ ...draft, merchant: merchant.trim(), amount: value, currency, date, category: cat, note: note.trim() || undefined });
    router.back();
  }

  function onDelete() {
    if (draft.id) remove(draft.id);
    router.back();
  }

  const input = [styles.input, textStart, { color: t.text, borderColor: t.border, backgroundColor: t.card }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {params.scanned === '1' && <Banner text="✨ قرأنا الفاتورة. راجع البيانات وعدّل أي شي قبل الحفظ." />}
        {params.missingDate === '1' && <Banner text="ما لقينا تاريخ في الفاتورة، فحطينا تاريخ اليوم." />}

        <Field label="المبلغ">
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.000"
            placeholderTextColor={t.muted}
            style={[input, { fontSize: 28, fontWeight: '800' }]}
          />
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {currencies.map((c) => (
              <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
            ))}
          </Row>
        </Field>

        <Field label="المحل">
          <TextInput value={merchant} onChangeText={setMerchant} placeholder="مثال: لولو هايبرماركت" placeholderTextColor={t.muted} style={input} />
        </Field>

        <Field label="التاريخ">
          <Row style={{ gap: 8 }}>
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={t.muted} style={[input, { flex: 1 }]} />
            <Chip label="اليوم" selected={date === today()} onPress={() => setDate(today())} />
          </Row>
        </Field>

        <Field label="التصنيف">
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={`${c.emoji} ${c.label}`} selected={cat === c.id} onPress={() => setCat(c.id)} />
            ))}
          </Row>
        </Field>

        {draft.items.length > 0 && (
          <Field label={`الأصناف (${draft.items.length})`}>
            <Card style={{ gap: 8, paddingVertical: 10 }}>
              {draft.items.map((item, i) => (
                <View key={i} style={{ flexDirection: row, justifyContent: 'space-between', gap: 12 }}>
                  <Text style={[textStart, { color: t.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                  {item.price != null && <Text style={{ color: t.muted }}>{formatMoney(item.price, currency)}</Text>}
                </View>
              ))}
            </Card>
          </Field>
        )}

        <Field label="ملاحظة (اختياري)">
          <TextInput value={note} onChangeText={setNote} placeholder="مثال: غداء مع الفريق" placeholderTextColor={t.muted} style={input} />
        </Field>

        {error && <Banner text={error} tone="error" />}

        <Button label={isEdit ? 'حفظ التعديلات' : 'حفظ المصروف'} onPress={onSave} />
        {isEdit && <Button label="حذف المصروف" variant="danger" onPress={onDelete} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[textStart, { color: t.muted, fontSize: 14, fontWeight: '600' }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
