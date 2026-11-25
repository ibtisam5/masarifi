import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Protects the Claude API budget once the app is public.
// - Each visitor (by IP) gets a number of scans per day.
// - All visitors together share a daily cap, so daily spend has a ceiling.
// Counters live in Upstash Redis when its env vars exist (shared by every
// server instance); otherwise in memory, which is fine for local development.

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const LIMITS = {
  scansPerVisitor: num(process.env.RATE_LIMIT_SCANS_PER_VISITOR, 15),
  scansPerDayTotal: num(process.env.RATE_LIMIT_SCANS_PER_DAY, 150),
};

type Check = { success: boolean; remaining: number; reset: number };
type Limiter = { limit: (id: string) => Promise<Check> };

function findRedisEnv() {
  const env = process.env;
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
  }
  for (const [name, url] of Object.entries(env)) {
    const match = name.match(/^(.*)(KV_REST_API|REDIS_REST)_URL$/);
    const token = match && env[`${match[1]}${match[2]}_TOKEN`];
    if (url && token) return { url, token };
  }
  return null;
}

const redisEnv = findRedisEnv();
const redis = redisEnv ? new Redis(redisEnv) : null;
export const LIMIT_STORE = redis ? 'redis' : 'memory';

const DAY_MS = 24 * 60 * 60 * 1000;

function memoryLimiter(max: number): Limiter {
  const hits = new Map<string, { count: number; reset: number }>();
  return {
    async limit(id) {
      const now = Date.now();
      let entry = hits.get(id);
      if (!entry || entry.reset <= now) {
        entry = { count: 0, reset: now + DAY_MS };
        hits.set(id, entry);
      }
      if (entry.count >= max) return { success: false, remaining: 0, reset: entry.reset };
      entry.count++;
      return { success: true, remaining: max - entry.count, reset: entry.reset };
    },
  };
}

function makeLimiter(prefix: string, max: number, window: 'sliding' | 'fixed'): Limiter {
  if (!redis) return memoryLimiter(max);
  const ratelimit = new Ratelimit({
    redis,
    prefix: `masarifi:${prefix}`,
    timeout: 3000,
    limiter:
      window === 'sliding' ? Ratelimit.slidingWindow(max, '1 d') : Ratelimit.fixedWindow(max, '1 d'),
  });
  return {
    async limit(id) {
      const result = await ratelimit.limit(id);
      // The library lets requests through on a Redis timeout; block instead.
      if (result.reason === 'timeout') throw new Error('rate limit check timed out');
      return result;
    },
  };
}

const visitorLimiter = makeLimiter('scan', LIMITS.scansPerVisitor, 'sliding');
const globalLimiter = makeLimiter('global-scans', LIMITS.scansPerDayTotal, 'fixed');

function visitorId(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; message: string; retryAfterSeconds: number };

export async function checkScanLimit(request: Request): Promise<LimitResult> {
  try {
    const visitor = await visitorLimiter.limit(visitorId(request));
    if (!visitor.success) {
      return {
        ok: false,
        message: `وصلت للحد اليومي (${LIMITS.scansPerVisitor} فاتورة). جرّب بكرة، أو أضف المصروف يدويًا.`,
        retryAfterSeconds: Math.max(1, Math.ceil((visitor.reset - Date.now()) / 1000)),
      };
    }
    const global = await globalLimiter.limit('all');
    if (!global.success) {
      return {
        ok: false,
        message: 'التطبيق وصل للحد اليومي لقراءة الفواتير. جرّب بكرة، أو أضف المصروف يدويًا.',
        retryAfterSeconds: Math.max(1, Math.ceil((global.reset - Date.now()) / 1000)),
      };
    }
    return { ok: true, remaining: visitor.remaining };
  } catch (error) {
    console.error('rate limit check failed', error);
    return { ok: false, message: 'الخدمة مشغولة حاليًا، حاول بعد شوي.', retryAfterSeconds: 60 };
  }
}
