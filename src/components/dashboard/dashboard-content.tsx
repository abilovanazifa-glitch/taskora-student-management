import { format } from "date-fns";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { getDateLocale } from "@/lib/i18n/date-locale";
import type { getDashboardData } from "@/lib/queries/dashboard";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardTaskBoard } from "@/components/dashboard/dashboard-task-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardContentProps = {
  locale: AppLocale;
  userName: string;
  data: Awaited<ReturnType<typeof getDashboardData>>;
};

export async function DashboardContent({ locale, userName, data }: DashboardContentProps) {
  const t = await getAppTranslations(locale, "dashboard");
  const tNotifications = await getAppTranslations(locale, "notifications");
  const dateLocale = getDateLocale(locale);

  const stats = [
    { label: t("stats.missedTasks"), value: data.overdueTasks.length, variant: "overdue" as const },
    { label: t("stats.inProgressTasks"), value: data.inProgressTasks.length, variant: "inProgress" as const },
    { label: t("stats.pendingTasks"), value: data.pendingTasks.length, variant: "pending" as const },
    { label: t("stats.completedTasks"), value: data.completedTasks.length, variant: "completed" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <DashboardQuickActions
        userName={userName}
        projectId={data.defaultProjectId}
        lists={data.lists}
        labels={data.labels}
      />

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {stats.map(({ label, value, variant }) => (
          <DashboardStatCard key={variant} label={label} value={value} variant={variant} />
        ))}
      </div>

      <DashboardTaskBoard
        locale={locale}
        overdueTasks={data.overdueTasks}
        inProgressTasks={data.inProgressTasks}
        pendingTasks={data.pendingTasks}
        completedTasks={data.completedTasks}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("sections.lists")}</CardTitle>
            <Button variant="link" className="h-auto cursor-pointer p-0" render={<Link href="/tasks" />}>
              {t("viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lists.length === 0 ? (
              <p className="text-caption">{t("empty.lists")}</p>
            ) : (
              data.lists.slice(0, 4).map((list) => (
                <Link
                  key={list.id}
                  href={`/tasks?subjectId=${list.id}`}
                  className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors duration-200"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
                  <p className="text-task-title truncate">
                    {pickLocalized(locale, list.nameUz, list.nameJa)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("sections.calendarPreview")}</CardTitle>
            <Button variant="link" className="h-auto cursor-pointer p-0" render={<Link href="/calendar" />}>
              {t("viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.calendarPreview.length === 0 ? (
              <p className="text-caption">{t("empty.calendarPreview")}</p>
            ) : (
              data.calendarPreview.map((event) => (
                <div key={event.id} className="space-y-1 rounded-xl border border-border/60 p-4">
                  <p className="text-task-title line-clamp-1">
                    {pickLocalized(locale, event.titleUz, event.titleJa)}
                  </p>
                  <p className="text-caption">{format(event.startAt, "PPp", { locale: dateLocale })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("sections.recentNotifications")}</CardTitle>
            <Button variant="link" className="h-auto cursor-pointer p-0" render={<Link href="/notifications" />}>
              {t("viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentNotifications.length === 0 ? (
              <p className="text-caption">{t("empty.notifications")}</p>
            ) : (
              data.recentNotifications.map((notification) => (
                <div key={notification.id} className="space-y-1 rounded-xl border border-border/60 p-4">
                  <p className="text-task-title line-clamp-1">
                    {pickLocalized(locale, notification.titleUz, notification.titleJa)}
                  </p>
                  {!notification.isRead ? (
                    <span className="text-primary text-body-sm font-medium">{tNotifications("unread")}</span>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
