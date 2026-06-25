"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Bell, Trash2, Check, CheckCheck } from "lucide-react";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  titleUz: string;
  titleJa: string;
  messageUz: string;
  messageJa: string;
  isRead: boolean;
  createdAt: Date;
  relatedTask: { id: string; projectId: string } | null;
  relatedEvent: { id: string; projectId: string | null } | null;
};

type NotificationsPanelProps = {
  items: NotificationItem[];
  unreadCount: number;
};

const TYPE_ACCENT: Record<string, string> = {
  DEADLINE_REMINDER: "bg-destructive/15 text-destructive ring-destructive/25",
  TASK_ASSIGNED: "bg-primary/15 text-primary ring-primary/25",
  TASK_UPDATED: "bg-primary/15 text-primary ring-primary/25",
  TASK_COMPLETED: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300",
  TASK_OVERDUE: "bg-destructive/15 text-destructive ring-destructive/25",
  PROJECT_INVITATION: "bg-violet-500/15 text-violet-800 ring-violet-500/25 dark:text-violet-300",
  INVITATION_ACCEPTED: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300",
  ROLE_CHANGED: "bg-secondary text-secondary-foreground ring-border/70",
  EVENT_UPCOMING: "bg-sky-500/15 text-sky-800 ring-sky-500/25 dark:text-sky-300",
  SYSTEM: "bg-secondary text-secondary-foreground ring-border/70",
};

function typeAccent(type: string) {
  return TYPE_ACCENT[type] ?? "bg-secondary text-secondary-foreground ring-border/70";
}

export function NotificationsPanel({ items, unreadCount }: NotificationsPanelProps) {
  const locale = useAppLocale();
  const t = useTranslations("notifications");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();
  const dateLocale = getDateLocale(locale);

  function run(action: () => Promise<{ success: boolean }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast(successMessage, "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="bento-card overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5 pb-1 sm:pb-0">
          <div className="flex items-center gap-2">
            <Bell className="text-primary size-4" />
            <span className="text-body-sm font-medium">{t("listLabel")}</span>
          </div>
          {unreadCount > 0 ? (
            <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-body-sm font-semibold">
              {t("unreadCount", { count: unreadCount })}
            </span>
          ) : (
            <span className="text-caption">{t("allRead")}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 pb-1 sm:pb-0">
          <p className="text-caption">
            {t("totalCount", { count: items.length })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={isPending || unreadCount === 0}
            onClick={() => run(markAllNotificationsRead, t("allReadSuccess"))}
          >
            <CheckCheck className="size-4" />
            {t("markAllRead")}
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {items.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.description")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((notification) => (
              <li key={notification.id}>
                <article
                  className={cn(
                    "kanban-card group transition-all duration-200 hover:bg-muted/35",
                    !notification.isRead && "bg-muted/50 ring-primary/35",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-task-title">
                          {pickLocalized(locale, notification.titleUz, notification.titleJa)}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-body-sm font-medium ring-1 ring-inset",
                            typeAccent(notification.type),
                          )}
                        >
                          {t(`types.${notification.type}`)}
                        </span>
                        {!notification.isRead ? (
                          <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-body-sm font-semibold">
                            {t("unread")}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-caption">
                        {pickLocalized(locale, notification.messageUz, notification.messageJa)}
                      </p>

                      <div className="border-t border-border/40 pt-2.5">
                        <p className="text-caption">
                          {formatDistanceToNow(notification.createdAt, {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:opacity-100">
                      {!notification.isRead ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          disabled={isPending}
                          onClick={() =>
                            run(() => markNotificationRead(notification.id), t("readSuccess"))
                          }
                        >
                          <Check className="size-4" />
                          {t("markRead")}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                        onClick={() =>
                          run(() => deleteNotification(notification.id), t("deleted"))
                        }
                      >
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
