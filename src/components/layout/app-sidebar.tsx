"use client";

import { PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { mainNavItems, isNavActive } from "@/config/navigation";
import type { Session } from "next-auth";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type AppSidebarProps = {
  user: Session["user"];
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebar({ user, onNavigate, className }: AppSidebarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-svh w-72 shrink-0 flex-col border-r border-sidebar-border",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3">
        <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl">
          <PenLine className="size-5" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <p className="text-body truncate font-semibold tracking-tight">{tCommon("appName")}</p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pt-3 pb-4">
        <nav className="space-y-1" aria-label={t("menu")}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "text-nav flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5 shrink-0", active && "text-primary")} />
                <span className="flex-1">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <SidebarFooter user={user} onNavigate={onNavigate} />
    </aside>
  );
}
