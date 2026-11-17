interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 20; // 20 requests per minute per IP

// In-memory store
const ipStore = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();

function cleanupStaleEntries(now: number) {
  if (now - lastCleanup < 60 * 1000) return;
  lastCleanup = now;

  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(ip);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  cleanupStaleEntries(now);

  const existing = ipStore.get(ip);

  if (!existing || now > existing.resetTime) {
    const resetTime = now + WINDOW_MS;
    ipStore.set(ip, { count: 1, resetTime });
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      resetTime,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - existing.count,
    resetTime: existing.resetTime,
    retryAfterSeconds: 0,
  };
}
