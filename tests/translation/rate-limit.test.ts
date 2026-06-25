import { afterEach, describe, expect, it } from "vitest";
import {
  checkTranslationRateLimit,
  resetTranslationRateLimits,
} from "@/lib/translation/rate-limit";

describe("checkTranslationRateLimit", () => {
  afterEach(() => {
    resetTranslationRateLimits();
  });

  it("allows requests under the limit", () => {
    const now = Date.now();
    expect(checkTranslationRateLimit("user-1", 3, 60_000, now)).toBe(true);
    expect(checkTranslationRateLimit("user-1", 3, 60_000, now + 1)).toBe(true);
    expect(checkTranslationRateLimit("user-1", 3, 60_000, now + 2)).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const now = Date.now();
    expect(checkTranslationRateLimit("user-1", 2, 60_000, now)).toBe(true);
    expect(checkTranslationRateLimit("user-1", 2, 60_000, now + 1)).toBe(true);
    expect(checkTranslationRateLimit("user-1", 2, 60_000, now + 2)).toBe(false);
  });

  it("tracks users independently", () => {
    const now = Date.now();
    expect(checkTranslationRateLimit("user-a", 1, 60_000, now)).toBe(true);
    expect(checkTranslationRateLimit("user-a", 1, 60_000, now + 1)).toBe(false);
    expect(checkTranslationRateLimit("user-b", 1, 60_000, now + 1)).toBe(true);
  });

  it("expires old timestamps outside the window", () => {
    const now = Date.now();
    expect(checkTranslationRateLimit("user-1", 1, 1_000, now)).toBe(true);
    expect(checkTranslationRateLimit("user-1", 1, 1_000, now + 500)).toBe(false);
    expect(checkTranslationRateLimit("user-1", 1, 1_000, now + 1_001)).toBe(true);
  });
});
