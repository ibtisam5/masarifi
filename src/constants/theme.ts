import { I18nManager, useColorScheme, type TextStyle } from 'react-native';

export const palette = {
  light: {
    bg: '#F7F7F5',
    card: '#FFFFFF',
    text: '#1C1C1A',
    muted: '#6B6B66',
    border: '#E4E4DF',
    accent: '#0F766E',
    accentText: '#FFFFFF',
    accentSoft: '#E6F2F0',
    danger: '#DC2626',
  },
  dark: {
    bg: '#121211',
    card: '#1C1C1A',
    text: '#ECECEA',
    muted: '#9B9B95',
    border: '#2E2E2B',
    accent: '#2DD4BF',
    accentText: '#0B2622',
    accentSoft: '#15302D',
    danger: '#F87171',
  },
};

export type Palette = typeof palette.light;

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

// The UI is Arabic (right to left). When the phone itself is in an RTL
// language React Native already flips rows and text; otherwise we flip them.
const rtl = I18nManager.isRTL;
export const row = (rtl ? 'row' : 'row-reverse') as 'row' | 'row-reverse';
export const textStart: TextStyle = {
  textAlign: rtl ? 'left' : 'right',
  writingDirection: 'rtl',
};
