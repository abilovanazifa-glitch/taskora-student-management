"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  unreadCount: number;
};

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const t = useTranslations("nav");

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative cursor-pointer overflow-visible"
      render={
        <Link href="/notifications" aria-label={t("notifications")} />
      }
    >
      <Bell className="size-5" />
      {unreadCount > 0 ? (
        <span
          className={cn(
            "bg-primary absolute top-0 right-0 flex size-[1.125rem] translate-x-1/3 -translate-y-1/3 items-center justify-center",
            "rounded-full text-[0.625rem] font-semibold leading-none text-white",
            "ring-2 ring-background",
            unreadCount > 9 && "size-auto min-w-[1.125rem] px-0.5",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
