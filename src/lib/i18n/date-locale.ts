import { enUS, ja, uz } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AppLocale } from "@/i18n/routing";

export function getDateLocale(locale: AppLocale): Locale {
  if (locale === "ja") return ja;
  if (locale === "en") return enUS;
  return uz;
}
