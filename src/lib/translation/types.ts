export type ContentLanguage = "uz" | "ja";

export type TranslationFieldType = "title" | "description" | "location" | "name";

export type TranslationErrorCode =
  | "notConfigured"
  | "emptySource"
  | "sameLanguage"
  | "tooLong"
  | "rateLimited"
  | "providerError"
  | "forbidden";

export const TRANSLATION_MAX_LENGTH: Record<TranslationFieldType, number> = {
  title: 200,
  name: 120,
  description: 5000,
  location: 200,
};

export function toDeepLLanguageCode(language: ContentLanguage) {
  return language === "ja" ? "JA" : "UZ";
}

export function mapDeepLTarget(language: ContentLanguage) {
  return language === "ja" ? "JA" : "UZ";
}
