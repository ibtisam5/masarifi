import type { Expense } from './expenses';

// On the web the expenses live in the browser's localStorage.
const KEY = 'masarifi.expenses.v1';

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(expenses));
  } catch {
    // storage blocked (private mode); the session still works in memory
  }
}
