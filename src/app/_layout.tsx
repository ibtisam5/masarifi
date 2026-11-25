import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpensesProvider } from '@/lib/expenses-store';

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ExpensesProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'مصاريفي' }} />
          <Stack.Screen
            name="review"
            options={{ presentation: 'modal', title: 'مراجعة المصروف', headerTransparent: false }}
          />
        </Stack>
      </ExpensesProvider>
    </ThemeProvider>
  );
}
