"use client";

import { Moon, Sun, Laptop, Languages, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { Session } from "next-auth";
import { Link, usePathname, getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  updatePreferredLanguagePreference,
  updateThemePreference,
} from "@/lib/actions/preferences";
import {
  localeToPreferredLanguage,
  nextThemeToDbTheme,
} from "@/lib/i18n/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const LOCALE_SHORT: Record<AppLocale, string> = {
  uz: "UZ",
  ja: "JP",
  en: "EN",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { data: session, update } = useSession();
  const t = useTranslations("theme");

  async function applyTheme(value: "light" | "dark" | "system") {
    try {
      setTheme(value);

      if (!session?.user?.id) {
        return;
      }

      const dbTheme = nextThemeToDbTheme(value);
      await updateThemePreference(dbTheme);
      await update({ theme: dbTheme });
    } catch (error) {
      console.error("Failed to update theme preference", error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative cursor-pointer"
            aria-label={t("toggle")}
          />
        }
      >
        <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("toggle")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          data-active={theme === "light" ? "" : undefined}
          onClick={() => void applyTheme("light")}
        >
          <Sun className="size-4" />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          data-active={theme === "dark" ? "" : undefined}
          onClick={() => void applyTheme("dark")}
        >
          <Moon className="size-4" />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          data-active={theme === "system" ? "" : undefined}
          onClick={() => void applyTheme("system")}
        >
          <Laptop className="size-4" />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const t = useTranslations("locale");

  async function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

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
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 px-2.5 font-medium"
            aria-label={t("label")}
          />
        }
      >
        <Languages className="size-4" />
        <span>{LOCALE_SHORT[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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

export function UserMenu({ user }: { user: Session["user"] }) {
  const t = useTranslations("nav");

  return (
    <Link
      href="/profile"
      className="focus-visible:ring-ring relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
      aria-label={t("profile")}
    >
      <Avatar className="size-9">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
        <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}

export function PublicHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  );
}
