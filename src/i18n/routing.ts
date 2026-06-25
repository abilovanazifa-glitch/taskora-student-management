import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "uz", "en"],
  defaultLocale: "uz",
  localePrefix: "always",
  localeDetection: false,
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type AppLocale = (typeof routing.locales)[number];
