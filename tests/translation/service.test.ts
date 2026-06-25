import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTranslationConfigured, translateWithDeepL } from "@/lib/translation/service";

describe("translation service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects missing API key", () => {
    delete process.env.TRANSLATION_API_KEY;
    expect(isTranslationConfigured()).toBe(false);
  });

  it("detects configured API key", () => {
    process.env.TRANSLATION_API_KEY = "test-key";
    expect(isTranslationConfigured()).toBe(true);
  });

  it("calls DeepL with uz to ja mapping", async () => {
    process.env.TRANSLATION_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "こんにちは" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const translated = await translateWithDeepL({
      text: "Salom",
      sourceLang: "uz",
      targetLang: "ja",
    });

    expect(translated).toBe("こんにちは");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deepl.com");
    expect(options.headers).toMatchObject({
      Authorization: "DeepL-Auth-Key test-key",
    });
    expect(String(options.body)).toContain("source_lang=UZ");
    expect(String(options.body)).toContain("target_lang=JA");
  });

  it("throws when provider returns non-ok response", async () => {
    process.env.TRANSLATION_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      }),
    );

    await expect(
      translateWithDeepL({
        text: "Salom",
        sourceLang: "uz",
        targetLang: "ja",
      }),
    ).rejects.toThrow("TRANSLATION_PROVIDER_403");
  });
});
