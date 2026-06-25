"use client";

import { Settings } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isNavActive } from "@/config/navigation";
import { SidebarLocaleSwitcher, SidebarThemeToggle } from "@/components/layout/sidebar-preferences";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
            "bg-card flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 px-3 py-2.5 shadow-sm transition-colors duration-200",
            profileActive ? "ring-2 ring-primary/30" : "hover:bg-muted/40",
          )}
        >
          <Avatar className="size-8 shrink-0">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
            <AvatarFallback className="text-xs">{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{t("profile")}</p>
          </div>
          <Settings className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
