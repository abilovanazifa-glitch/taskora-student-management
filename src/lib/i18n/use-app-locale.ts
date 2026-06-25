"use client";

import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

/** Active UI locale from next-intl — use for pickLocalized and date-fns. */
export function useAppLocale() {
  return useLocale() as AppLocale;
}
