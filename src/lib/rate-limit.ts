/**
 * Client-side rate limiter for auth forms.
 *
 * This is a first-line deterrent against brute-force attacks from a single
 * browser tab. It complements Supabase Auth's own server-side rate limiting
 * and Cloudflare's DDoS / bot mitigation.
 *
 * Uses a sliding window: after `maxAttempts` within `windowMs`, subsequent
 * calls are blocked until the window rolls forward.
 */

interface RateLimiterOptions {
  /** Maximum attempts allowed in the window (default 5). */
  maxAttempts?: number;
  /** Window length in milliseconds (default 60 000 = 1 minute). */
  windowMs?: number;
}

export function createRateLimiter(opts: RateLimiterOptions = {}) {
  const maxAttempts = opts.maxAttempts ?? 5;
  const windowMs = opts.windowMs ?? 60_000;
  const timestamps: number[] = [];

  return {
    /** Returns `true` if the action is allowed, `false` if rate-limited. */
    check(): boolean {
      const now = Date.now();
      // Evict timestamps outside the window
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxAttempts) return false;
      timestamps.push(now);
      return true;
    },

    /** Seconds until the next attempt is allowed (0 if not limited). */
    get retryAfterSeconds(): number {
      if (timestamps.length < maxAttempts) return 0;
      const oldest = timestamps[0];
      const unlockAt = oldest + windowMs;
      return Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
    },
  };
}
