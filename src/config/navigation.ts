import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckSquare, Sun } from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: "dashboard" | "calendar" | "tasks";
  icon: LucideIcon;
};

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: Sun },
  { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.endsWith("/dashboard");
  }

  return pathname.includes(href);
}
