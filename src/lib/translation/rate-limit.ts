const buckets = new Map<string, number[]>();

export function checkTranslationRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
  now = Date.now(),
): boolean {
  const timestamps = (buckets.get(key) ?? []).filter((entry) => now - entry < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

export function resetTranslationRateLimits() {
  buckets.clear();
}

export function getTranslationRateLimit() {
  const parsed = Number(process.env.TRANSLATION_RATE_LIMIT_PER_MINUTE ?? "20");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}
