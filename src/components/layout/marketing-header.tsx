"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PublicHeaderActions } from "@/components/layout/header-actions";

export function MarketingHeader() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <a
        href="#main-content"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        {tCommon("skipToContent")}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex cursor-pointer items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-2xl text-sm font-bold">
            T
          </div>
          <span className="text-base font-semibold tracking-tight">{tCommon("appName")}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <PublicHeaderActions />
          <Button variant="ghost" className="cursor-pointer" render={<Link href="/login" />}>
            {t("login")}
          </Button>
          <Button className="cursor-pointer" render={<Link href="/register" />}>
            {t("register")}
          </Button>
        </div>
      </div>
    </header>
  );
}
