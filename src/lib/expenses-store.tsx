import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { newId, type Expense, type ExpenseDraft } from './expenses';
import { loadExpenses, saveExpenses } from './storage';

type Store = {
  expenses: Expense[];
  loaded: boolean;
  save: (draft: ExpenseDraft) => void;
  remove: (id: string) => void;
};

const ExpensesContext = createContext<Store | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadExpenses().then((list) => {
      setExpenses(list);
      setLoaded(true);
    });
  }, []);

  const update = useCallback((fn: (list: Expense[]) => Expense[]) => {
    setExpenses((prev) => {
      const next = fn(prev).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
      saveExpenses(next);
      return next;
    });
  }, []);

  const save = useCallback(
    (draft: ExpenseDraft) => {
      const expense: Expense = { ...draft, id: draft.id ?? newId(), createdAt: draft.createdAt ?? Date.now() };
      update((list) => [...list.filter((e) => e.id !== expense.id), expense]);
    },
    [update],
  );

  const remove = useCallback((id: string) => update((list) => list.filter((e) => e.id !== id)), [update]);

  const value = useMemo(() => ({ expenses, loaded, save, remove }), [expenses, loaded, save, remove]);
  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses() {
  const store = useContext(ExpensesContext);
  if (!store) throw new Error('useExpenses must be used inside ExpensesProvider');
  return store;
}

// The draft being reviewed lives here while the review screen is open, so we
// don't have to squeeze line items into route params.
let pendingDraft: ExpenseDraft | null = null;
export const draftHolder = {
  set(draft: ExpenseDraft) {
    pendingDraft = draft;
  },
  take(): ExpenseDraft | null {
    const d = pendingDraft;
    pendingDraft = null;
    return d;
  },
};
