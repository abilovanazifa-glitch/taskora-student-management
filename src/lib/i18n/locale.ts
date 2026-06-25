import type { PreferredLanguage, Theme } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

export function preferredLanguageToLocale(language: PreferredLanguage): AppLocale {
  if (language === "UZ") return "uz";
  if (language === "EN") return "en";
  return "ja";
}

export function localeToPreferredLanguage(locale: AppLocale): PreferredLanguage {
  if (locale === "uz") return "UZ";
  if (locale === "en") return "EN";
  return "JA";
}

export function dbThemeToNextTheme(theme: Theme): "light" | "dark" | "system" {
  if (theme === "LIGHT") return "light";
  if (theme === "DARK") return "dark";
  return "system";
}

export function nextThemeToDbTheme(theme: string): Theme {
  if (theme === "light") return "LIGHT";
  if (theme === "dark") return "DARK";
  return "SYSTEM";
}
