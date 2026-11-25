import Storage from 'expo-sqlite/kv-store';

import type { Expense } from './expenses';

// Expenses are stored on the device (SQLite key-value store), not on a server.
const KEY = 'masarifi.expenses.v1';

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await Storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]) {
  await Storage.setItem(KEY, JSON.stringify(expenses));
}
