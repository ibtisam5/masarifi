import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { CATEGORY_IDS, DEFAULT_CURRENCY, today, type ExpenseDraft } from '@/lib/expenses';
import { checkScanLimit, LIMIT_STORE } from '@/server/rate-limit';

// Code in +api files runs only on the server, so the API key never reaches the app.
const anthropic = new Anthropic();
const MODEL = 'claude-opus-5-5';
const MAX_BASE64_CHARS = 5_000_000; // ~3.7 MB image, safely under hosting body limits
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const ReceiptSchema = z.object({
  is_receipt: z.boolean(),
  merchant: z.string().nullable(),
  date: z.string().nullable(),
  total: z.number().nullable(),
  currency: z.string().nullable(),
  category: z.enum(CATEGORY_IDS),
  items: z.array(z.object({ name: z.string(), price: z.number().nullable() })),
});

const SYSTEM = `You read photos of receipts and invoices for an expense-tracking app used in Oman and the Gulf.
Receipts may be in Arabic, English, or both, printed or handwritten.

Return:
- is_receipt: false if the image is not a receipt or bill; then leave the other fields null or empty.
- merchant: the store or company name as printed (keep Arabic if it is in Arabic).
- date: the purchase date as YYYY-MM-DD, or null if not shown.
- total: the final amount paid, including VAT and after discounts. Not the subtotal.
- currency: ISO 4217 code. "ر.ع", "R.O", "RO", "OMR" and "Bz/Baisa" mean OMR; infer from symbols, language and context. If nothing indicates it, use null.
- category: the best fit for what was bought.
- items: up to 15 line items with their prices. Use an empty list if they are unreadable.

Never guess a number you cannot read; use null instead.`;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'X-RateLimit-Store': LIMIT_STORE, ...headers } });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'مفتاح ANTHROPIC_API_KEY غير موجود في السيرفر.' }, 500);
  }

  const body = (await request.json().catch(() => null)) as
    | { image?: unknown; mediaType?: unknown }
    | null;
  const image = body?.image;
  const mediaType = body?.mediaType;
  if (
    typeof image !== 'string' ||
    image.length === 0 ||
    image.length > MAX_BASE64_CHARS ||
    !MEDIA_TYPES.includes(mediaType as (typeof MEDIA_TYPES)[number])
  ) {
    return json({ error: 'الصورة غير صالحة أو حجمها كبير.' }, 400);
  }

  const limit = await checkScanLimit(request);
  if (!limit.ok) {
    return json({ error: limit.message }, 429, { 'Retry-After': String(limit.retryAfterSeconds) });
  }

  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: 'low', format: betaZodOutputFormat(ReceiptSchema) },
      // If a safety classifier declines, the API retries on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as (typeof MEDIA_TYPES)[number],
                data: image,
              },
            },
            { type: 'text', text: 'Extract the expense from this receipt.' },
          ],
        },
      ],
    });

    const receipt = response.parsed_output;
    if (response.stop_reason === 'refusal' || !receipt) {
      return json({ error: 'ما قدرت أقرأ الصورة، جرّب صورة أوضح أو أضف المصروف يدويًا.' }, 422);
    }
    if (!receipt.is_receipt) {
      return json({ error: 'الصورة ما تبدو فاتورة. جرّب تصوّر الفاتورة كاملة.' }, 422);
    }

    const validDate = receipt.date && /^\d{4}-\d{2}-\d{2}$/.test(receipt.date) ? receipt.date : null;
    const draft: ExpenseDraft = {
      merchant: receipt.merchant?.trim() || '',
      amount: receipt.total ?? 0,
      currency: (receipt.currency ?? DEFAULT_CURRENCY).toUpperCase(),
      date: validDate ?? today(),
      category: receipt.category,
      items: receipt.items.slice(0, 15),
      source: 'scan',
    };
    return json({ draft, remaining: limit.remaining, missingDate: !validDate });
  } catch (error) {
    console.error('scan failed', error);
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: 'مفتاح ANTHROPIC_API_KEY غير صحيح.' }, 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'ضغط على الخدمة، حاول بعد شوي.' }, 503);
    }
    return json({ error: 'صار خطأ في قراءة الفاتورة، حاول مرة ثانية.' }, 502);
  }
}
