# مصاريفي · Masarifi

A mobile expense tracker that reads receipts with AI. Take a photo of a receipt (Arabic or English, printed or handwritten) and the app extracts the store, date, total, category and line items, ready to review and save.

> صوّر الفاتورة، والتطبيق يقرأها لك: المحل، والتاريخ، والمبلغ، والتصنيف، والأصناف. وبعدها تشوف تقرير شهري لمصاريفك.

<!-- TODO: live demo link, screenshots and a short video -->

## Features

- **Receipt scanning with Claude Vision.** Photos are turned into structured data (JSON schema enforced with structured outputs), not free text.
- **Picks the right number.** The prompt targets the final amount paid including VAT, not the subtotal, and returns `null` instead of guessing unreadable values.
- **Gulf-ready.** Understands Arabic receipts and currencies (ر.ع / OMR with 3 decimals, SAR, AED, ...).
- **Review before saving.** Every scan opens an editable form; manual entry uses the same screen.
- **Monthly report.** Spending by category and top merchants per month.
- **Private by default.** Expenses are stored on the device (SQLite key-value store), with no account needed.
- **Cost protection.** Images are resized to 1568 px before upload; scans are rate-limited per visitor and per day (Redis-backed in production, fail-closed).
- **Native feel.** Expo Router native tabs on iOS (Liquid Glass), dark mode, right-to-left Arabic UI. Also runs on the web.

## Tech stack

| Layer | Tech |
|---|---|
| App | Expo SDK 58, React Native, Expo Router, TypeScript |
| AI | Claude API (`@anthropic-ai/sdk`): vision + structured outputs (zod) |
| API | Expo Router API routes (`src/app/api/scan+api.ts`), so the API key stays on the server |
| Storage | `expo-sqlite/kv-store` on device, `localStorage` on web |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` (in-memory fallback in development) |
| Hosting | Expo Hosting |

## How it works

```
Camera / Photos ─▶ resize to 1568px JPEG ─▶ POST /api/scan ─▶ Claude (vision, structured output)
                                                   │
        review screen ◀── draft {merchant, date, total, currency, category, items}
              │
              └─▶ saved on the device ─▶ list + monthly report
```

## Run locally

Requirements: Node.js 20+, a Claude API key, and the **Expo Go** app on your phone.

```bash
npm install
cp .env.example .env.local   # put your key in ANTHROPIC_API_KEY
npx expo start
```

Scan the QR code with your phone (same Wi-Fi as the computer). Expo Go asks you to sign in to an Expo account; run `npx expo login` on the computer with the same account. A sample receipt to try is in [`samples/`](samples/).

## Deploy (Expo Hosting)

Set `ANTHROPIC_API_KEY` (and optionally `KV_REST_API_URL` / `KV_REST_API_TOKEN` for Redis rate limits) as **sensitive** environment variables for the `production` environment on expo.dev, then:

```bash
npx expo export --platform web
npx eas-cli@latest deploy --prod --environment production
```

## Roadmap

- [ ] Accounts and cloud sync (Supabase)
- [ ] Monthly budgets and alerts
- [ ] Export to CSV / Excel
- [ ] App Store / TestFlight build
