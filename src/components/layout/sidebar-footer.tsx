"use client";

import { LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isNavActive } from "@/config/navigation";
import { SidebarLocaleSwitcher, SidebarThemeToggle } from "@/components/layout/sidebar-preferences";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarFooterProps = {
  user: Session["user"];
  onNavigate?: () => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SidebarFooter({ user, onNavigate }: SidebarFooterProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const profileActive = isNavActive(pathname, "/profile");

  return (
    <div className="sidebar-footer-block">
      <SidebarLocaleSwitcher />
      <SidebarThemeToggle />

      <div className="sidebar-profile-block">
        <Link
          href="/profile"
          onClick={onNavigate}
          className={cn(
            "bg-card flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/70 p-4 shadow-sm transition-colors duration-200",
            profileActive ? "ring-2 ring-primary/30" : "hover:bg-muted/40",
          )}
        >
          <Avatar className="size-10 shrink-0">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
            <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-body truncate font-semibold">{user.fullName}</p>
            <p className="text-caption truncate">{t("profile")}</p>
          </div>
          <Settings className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive w-full cursor-pointer justify-start gap-3 rounded-xl px-3"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        >
          <LogOut className="size-4 shrink-0" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
