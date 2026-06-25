import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { ArrowLeft } from "lucide-react";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/i18n/routing";
import type { getProjectDetail, getProjectMembersData } from "@/lib/queries/projects";
import { listSubjects } from "@/lib/queries/subjects";
import { listTags } from "@/lib/queries/tags";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { Link } from "@/i18n/navigation";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { ProjectDetailTasksSection } from "@/components/projects/project-detail-tasks-section";
import { ProjectMembersPanel } from "@/components/projects/project-members-panel";

type ProjectDetailContentProps = {
  locale: AppLocale;
  userId: string;
  project: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;
  membersData: NonNullable<Awaited<ReturnType<typeof getProjectMembersData>>>;
};

export async function ProjectDetailContent({
  locale,
  userId,
  project,
  membersData,
}: ProjectDetailContentProps) {
  const t = await getAppTranslations(locale, "projects");
  const tTasks = await getAppTranslations(locale, "tasks");
  const [lists, labels] = await Promise.all([listSubjects(userId), listTags(userId)]);
  const dateLocale = getDateLocale(locale);
  const name = pickLocalized(locale, project.nameUz, project.nameJa);
  const description = pickLocalized(locale, project.descriptionUz, project.descriptionJa);

  return (
    <div className="page-section">
      <Button
        variant="ghost"
        size="sm"
        className="text-body-sm -ml-2 h-auto cursor-pointer gap-1.5 px-2 py-1"
        render={<Link href="/projects" />}
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-title-lg">{name}</h1>
            <StatusBadge
              kind="project"
              value={project.status}
              label={t(`statuses.${project.status}`)}
            />
          </div>

          {description ? (
            <p className="text-body-sm max-w-3xl text-pretty text-muted-foreground">{description}</p>
          ) : null}

          <div className="text-body-sm flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="text-muted-foreground">{t("ownerLabel")}: </span>
              <span className="font-medium">{project.owner.fullName}</span>
            </span>
            {project.endDate ? (
              <span>
                <span className="text-muted-foreground">{t("detail.end")}: </span>
                <span className="font-medium">
                  {format(project.endDate, "PP", { locale: dateLocale })}
                </span>
              </span>
            ) : null}
            {project.role && project.role !== "OWNER" ? (
              <span className="text-muted-foreground">{t(`roles.${project.role}`)}</span>
            ) : null}
          </div>

          <div className="max-w-md space-y-1">
            <ProgressBar value={project.progress} label={t("detail.progress")} />
            <p className="text-caption">
              {t("detail.progressStats", {
                completed: project.completedTasks,
                open: project.openTasks,
                total: project._count.tasks,
              })}
            </p>
          </div>
        </div>

        <ProjectDetailActions
          projectId={project.id}
          permissions={project.permissions}
          initialValues={{
            nameUz: project.nameUz,
            nameJa: project.nameJa,
            descriptionUz: project.descriptionUz,
            descriptionJa: project.descriptionJa,
            color: project.color,
            startDate: project.startDate?.toISOString().slice(0, 10) ?? "",
            endDate: project.endDate?.toISOString().slice(0, 10) ?? "",
            status: project.status,
          }}
        />
      </div>

      <Card id="project-tasks">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">{t("detail.tasks")}</CardTitle>
          <ProjectDetailTasksSection
            projectId={project.id}
            lists={lists}
            labels={labels}
            canCreateTask={project.permissions.canCreateTask}
          />
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <EmptyState title={t("detail.noTasks")} className="py-6" />
          ) : (
            <ul className="space-y-2">
              {project.tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks?project=${project.id}&task=${task.id}`}
                    className="hover:bg-muted/40 flex cursor-pointer flex-col gap-2 rounded-xl border border-border p-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm truncate font-medium">
                        {pickLocalized(locale, task.titleUz, task.titleJa)}
                      </p>
                      {task.assignee ? (
                        <p className="text-caption">{task.assignee.fullName}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge
                        kind="task"
                        value={task.status}
                        label={tTasks(`statuses.${task.status}`)}
                        size="sm"
                      />
                      <StatusBadge
                        kind="priority"
                        value={task.priority}
                        label={tTasks(`priorities.${task.priority}`)}
                        size="sm"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ProjectMembersPanel
        locale={locale}
        projectId={project.id}
        ownerId={project.ownerId}
        currentUserId={membersData.currentUserId}
        actorRole={project.role}
        members={membersData.project.members}
        pendingInvitations={membersData.pendingInvitations}
        permissions={{
          canManageMembers: project.permissions.canManageMembers,
          canTransferOwnership: project.permissions.canTransferOwnership,
          canLeave: project.permissions.canLeave,
        }}
      />

      {project.calendarEvents.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("detail.events")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {project.calendarEvents.map((event) => (
                <li key={event.id} className="text-body-sm rounded-xl border border-border p-3">
                  <p className="font-medium">
                    {pickLocalized(locale, event.titleUz, event.titleJa)}
                  </p>
                  <p className="text-caption">
                    {format(event.startAt, "PPp", { locale: dateLocale })}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
