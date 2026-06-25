"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

type AppShellProps = {
  children: ReactNode;
  user: Session["user"];
  unreadCount?: number;
};

export function AppShell({ children, user, unreadCount = 0 }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        {tCommon("skipToContent")}
      </a>
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:shrink-0">
        <AppSidebar user={user} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0" closeLabel={tCommon("close")}>
          <SheetHeader className="sr-only">
            <SheetTitle>{t("menu")}</SheetTitle>
          </SheetHeader>
          <AppSidebar
            user={user}
            onNavigate={() => setMobileOpen(false)}
            className="w-full border-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} unreadCount={unreadCount} />
        <main id="main-content" className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
