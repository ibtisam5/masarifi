import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { row, textStart, useTheme } from '@/constants/theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>
  );
}

export function Title({ children, size = 28 }: { children: ReactNode; size?: number }) {
  const t = useTheme();
  return <Text style={[textStart, { color: t.text, fontSize: size, fontWeight: '800' }]}>{children}</Text>;
}

export function Muted({ children, size = 14 }: { children: ReactNode; size?: number }) {
  const t = useTheme();
  return <Text style={[textStart, { color: t.muted, fontSize: size }]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.accent : variant === 'danger' ? 'transparent' : t.card;
  const fg = variant === 'primary' ? t.accentText : variant === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'primary' ? bg : t.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { borderColor: selected ? t.accent : t.border, backgroundColor: selected ? t.accentSoft : t.card },
      ]}>
      <Text style={{ color: selected ? t.accent : t.text, fontWeight: selected ? '700' : '500', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: row, alignItems: 'center' }, style]}>{children}</View>;
}

export function Banner({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  const t = useTheme();
  const color = tone === 'error' ? t.danger : t.accent;
  return (
    <View style={[styles.banner, { backgroundColor: tone === 'error' ? 'rgba(220,38,38,0.1)' : t.accentSoft }]}>
      <Text style={[textStart, { color, fontSize: 14, lineHeight: 22 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  chip: { borderRadius: 999, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  banner: { borderRadius: 12, padding: 12 },
});
