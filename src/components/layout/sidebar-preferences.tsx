"use client";

import { useSyncExternalStore } from "react";
import { Check, ChevronRight, Languages, Moon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { usePathname, getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  updatePreferredLanguagePreference,
  updateThemePreference,
} from "@/lib/actions/preferences";
import {
  localeToPreferredLanguage,
  nextThemeToDbTheme,
} from "@/lib/i18n/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LOCALE_SHORT: Record<AppLocale, string> = {
  uz: "UZ",
  ja: "JP",
  en: "EN",
};

const sidebarRowClass =
  "text-body-sm hover:bg-muted/60 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 font-medium transition-colors duration-200";

export function SidebarLocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const t = useTranslations("locale");

  async function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    try {
      if (session?.user?.id) {
        const preferredLanguage = localeToPreferredLanguage(nextLocale);
        await updatePreferredLanguagePreference(preferredLanguage);
        await update({ preferredLanguage });
      }

      const nextPath = getPathname({ href: pathname, locale: nextLocale });
      window.location.assign(nextPath);
    } catch (error) {
      console.error("Failed to switch locale", error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className={sidebarRowClass} aria-label={t("label")}>
            <span className="flex items-center gap-3">
              <Languages className="text-muted-foreground size-5 shrink-0" />
              {t("label")}
            </span>
            <span className="text-caption flex min-w-0 items-center gap-1.5">
              <span className="truncate">{t(locale)}</span>
              <ChevronRight className="size-4" />
            </span>
          </button>
        }
      />
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {routing.locales.map((code) => {
          const active = locale === code;
          return (
            <DropdownMenuItem
              key={code}
              className={cn("cursor-pointer", active && "bg-accent font-medium")}
              onClick={() => void switchLocale(code)}
              data-active={active ? "" : undefined}
            >
              <span className="text-muted-foreground w-7 text-body-sm font-semibold tracking-wide">
                {LOCALE_SHORT[code]}
              </span>
              <span className="flex-1">{t(code)}</span>
              {active ? <Check className="text-primary size-4" aria-hidden="true" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, update } = useSession();
  const t = useTranslations("theme");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  async function toggleDarkMode() {
    const next = isDark ? "light" : "dark";
    try {
      setTheme(next);

      if (!session?.user?.id) return;

      const dbTheme = nextThemeToDbTheme(next);
      await updateThemePreference(dbTheme);
      await update({ theme: dbTheme });
    } catch (error) {
      console.error("Failed to update theme preference", error);
    }
  }

  return (
    <div className={cn(sidebarRowClass, "cursor-default hover:bg-transparent")}>
      <span className="flex items-center gap-3">
        <Moon className="text-muted-foreground size-5 shrink-0" />
        {t("nightMode")}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={t("nightMode")}
        disabled={!mounted}
        onClick={() => void toggleDarkMode()}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50",
          isDark ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            isDark ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
