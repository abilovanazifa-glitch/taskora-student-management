import type { ContentLanguage } from "@/lib/translation/types";
import { mapDeepLTarget, toDeepLLanguageCode } from "@/lib/translation/types";

type DeepLResponse = {
  translations: { text: string }[];
};

export function isTranslationConfigured() {
  return Boolean(process.env.TRANSLATION_API_KEY?.trim());
}

export function getTranslationApiUrl() {
  return (
    process.env.TRANSLATION_API_URL?.trim() || "https://api-free.deepl.com/v2/translate"
  );
}

export async function translateWithDeepL(input: {
  text: string;
  sourceLang: ContentLanguage;
  targetLang: ContentLanguage;
}) {
  const apiKey = process.env.TRANSLATION_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TRANSLATION_NOT_CONFIGURED");
  }

  const body = new URLSearchParams({
    text: input.text,
    source_lang: toDeepLLanguageCode(input.sourceLang),
    target_lang: mapDeepLTarget(input.targetLang),
  });

  const response = await fetch(getTranslationApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TRANSLATION_PROVIDER_${response.status}`);
  }

  const payload = (await response.json()) as DeepLResponse;
  const translated = payload.translations[0]?.text?.trim();

  if (!translated) {
    throw new Error("TRANSLATION_EMPTY_RESPONSE");
  }

  return translated;
}
