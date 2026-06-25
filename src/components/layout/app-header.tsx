"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  onOpenMobileNav?: () => void;
  unreadCount?: number;
};

export function AppHeader({ onOpenMobileNav, unreadCount = 0 }: AppHeaderProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer lg:hidden"
        onClick={onOpenMobileNav}
        aria-label={t("openMenu")}
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1 lg:hidden">
        <p className="truncate text-base font-semibold">{tCommon("appName")}</p>
      </div>

      <div className="ml-auto flex items-center pr-1">
        <NotificationBell unreadCount={unreadCount} />
      </div>
    </header>
  );
}
