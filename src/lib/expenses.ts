// Shared expense types and helpers, used by the app screens and the scan API.

export const CATEGORIES = [
  { id: 'food', label: 'مطاعم ومقاهي', emoji: '🍽️', color: '#E07A5F' },
  { id: 'groceries', label: 'بقالة', emoji: '🛒', color: '#3D9970' },
  { id: 'transport', label: 'مواصلات ووقود', emoji: '⛽', color: '#3B82F6' },
  { id: 'shopping', label: 'تسوق', emoji: '🛍️', color: '#A855F7' },
  { id: 'bills', label: 'فواتير وخدمات', emoji: '💡', color: '#F2B705' },
  { id: 'health', label: 'صحة', emoji: '💊', color: '#EF4444' },
  { id: 'entertainment', label: 'ترفيه', emoji: '🎬', color: '#EC4899' },
  { id: 'other', label: 'أخرى', emoji: '📦', color: '#6B7280' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function category(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export type ExpenseItem = { name: string; price: number | null };

export type Expense = {
  id: string;
  merchant: string;
  amount: number;
  currency: string; // ISO 4217, e.g. OMR
  date: string; // YYYY-MM-DD
  category: CategoryId;
  items: ExpenseItem[];
  note?: string;
  source: 'scan' | 'manual';
  createdAt: number;
};

// What the scan API returns; the review screen turns it into an Expense.
export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'> & { id?: string; createdAt?: number };

export const DEFAULT_CURRENCY = 'OMR';

const CURRENCY_LABELS: Record<string, string> = {
  OMR: 'ر.ع',
  SAR: 'ر.س',
  AED: 'د.إ',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: 'د.ب',
  USD: '$',
  EUR: '€',
};

// Gulf currencies with 1000 subunits show 3 decimals.
const THREE_DECIMALS = new Set(['OMR', 'KWD', 'BHD']);

export function formatMoney(amount: number, currency: string) {
  const digits = THREE_DECIMALS.has(currency) ? 3 : 2;
  const value = amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${value} ${CURRENCY_LABELS[currency] ?? currency}`;
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function monthKey(date: string) {
  return date.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDay(date: string) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Totals per currency, most-used currency first. */
export function totalsByCurrency(expenses: Expense[]) {
  const totals = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const t = totals.get(e.currency) ?? { total: 0, count: 0 };
    t.total += e.amount;
    t.count += 1;
    totals.set(e.currency, t);
  }
  return [...totals.entries()]
    .map(([currency, t]) => ({ currency, ...t }))
    .sort((a, b) => b.count - a.count);
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
