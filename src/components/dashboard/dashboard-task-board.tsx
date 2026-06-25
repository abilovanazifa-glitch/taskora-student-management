import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import type { DashboardTask } from "@/lib/queries/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type DashboardTaskColumnProps = {
  locale: AppLocale;
  title: string;
  tasks: DashboardTask[];
  emptyLabel: string;
  accent: "destructive" | "primary" | "muted" | "success";
  href?: string;
};

const accentStyles = {
  destructive: "bg-destructive/15 text-destructive ring-destructive/25",
  primary: "bg-primary/15 text-primary ring-primary/25",
  muted: "bg-secondary text-secondary-foreground ring-border/70",
  success: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function DashboardTaskColumn({
  locale,
  title,
  tasks,
  emptyLabel,
  accent,
  href = "/tasks",
}: DashboardTaskColumnProps) {
  const dateLocale = getDateLocale(locale);

  return (
    <section className="flex min-h-[300px] flex-col rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      <header className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3.5">
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2.5 py-1 text-base font-medium ring-1 ring-inset",
            accentStyles[accent],
          )}
        >
          {title}
        </span>
        <span className="text-caption ml-auto tabular-nums">{tasks.length}</span>
      </header>

      <ul className="flex flex-1 flex-col gap-3 p-4">
        {tasks.length === 0 ? (
          <li className="text-caption flex flex-1 items-center justify-center px-2 py-8 text-center">
            {emptyLabel}
          </li>
        ) : (
          tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={href}
                className="bg-muted/50 hover:bg-muted flex cursor-pointer flex-col gap-3 rounded-xl border border-border/50 px-4 py-4 shadow-sm transition-colors duration-200"
              >
                <p className="text-task-title text-foreground line-clamp-2">
                  {pickLocalized(locale, task.titleUz, task.titleJa)}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-caption flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {pickLocalized(locale, task.project.nameUz, task.project.nameJa)}
                      </span>
                    </span>
                    {task.deadline ? (
                      <span className="text-muted-foreground shrink-0">
                        {format(task.deadline, "d MMM", { locale: dateLocale })}
                      </span>
                    ) : null}
                  </div>
                  {task.assignee ? (
                    <Avatar size="sm">
                      {task.assignee.avatarUrl ? (
                        <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.fullName} />
                      ) : null}
                      <AvatarFallback>{initials(task.assignee.fullName)}</AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export async function DashboardTaskBoard({
  locale,
  overdueTasks,
  inProgressTasks,
  pendingTasks,
  completedTasks,
}: {
  locale: AppLocale;
  overdueTasks: DashboardTask[];
  inProgressTasks: DashboardTask[];
  pendingTasks: DashboardTask[];
  completedTasks: DashboardTask[];
}) {
  const t = await getAppTranslations(locale, "dashboard.sections");

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DashboardTaskColumn
        locale={locale}
        title={t("missedTasks")}
        tasks={overdueTasks}
        emptyLabel={t("emptyMissed")}
        accent="destructive"
      />
      <DashboardTaskColumn
        locale={locale}
        title={t("inProgressTasks")}
        tasks={inProgressTasks}
        emptyLabel={t("emptyInProgress")}
        accent="primary"
      />
      <DashboardTaskColumn
        locale={locale}
        title={t("pendingTasks")}
        tasks={pendingTasks}
        emptyLabel={t("emptyPending")}
        accent="muted"
      />
      <DashboardTaskColumn
        locale={locale}
        title={t("completedTasks")}
        tasks={completedTasks}
        emptyLabel={t("emptyCompleted")}
        accent="success"
      />
    </div>
  );
}
