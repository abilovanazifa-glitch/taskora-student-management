import type { ContentLanguage } from "@/lib/translation/types";

export function resolveTranslationDirection(input: {
  uzText: string;
  jaText: string;
}): { sourceLang: ContentLanguage; targetLang: ContentLanguage; sourceText: string } | null {
  const uz = input.uzText.trim();
  const ja = input.jaText.trim();

  if (uz && !ja) {
    return { sourceLang: "uz", targetLang: "ja", sourceText: uz };
  }

  if (ja && !uz) {
    return { sourceLang: "ja", targetLang: "uz", sourceText: ja };
  }

  return null;
}

export function pickSourceForOverwrite(input: {
  uzText: string;
  jaText: string;
  preferredSource?: ContentLanguage;
}): { sourceLang: ContentLanguage; targetLang: ContentLanguage; sourceText: string } | null {
  const uz = input.uzText.trim();
  const ja = input.jaText.trim();

  if (!uz && !ja) {
    return null;
  }

  if (input.preferredSource === "uz" && uz) {
    return { sourceLang: "uz", targetLang: "ja", sourceText: uz };
  }

  if (input.preferredSource === "ja" && ja) {
    return { sourceLang: "ja", targetLang: "uz", sourceText: ja };
  }

  const resolved = resolveTranslationDirection({ uzText: uz, jaText: ja });
  if (resolved) {
    return resolved;
  }

  if (uz && ja) {
    return { sourceLang: "uz", targetLang: "ja", sourceText: uz };
  }

  return null;
}
