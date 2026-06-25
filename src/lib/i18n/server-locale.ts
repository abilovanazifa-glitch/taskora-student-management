import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

/** Call at the top of async server components (especially inside Suspense). */
export function bindAppLocale(locale: AppLocale) {
  setRequestLocale(locale);
}

export function getAppTranslations(locale: AppLocale, namespace: string) {
  return getTranslations({ locale, namespace });
}
