"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import type { TaskStatus } from "@prisma/client";
import { Archive, ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { ProjectMemberRole, ProjectStatus } from "@prisma/client";
import { archiveProject, deleteProject } from "@/lib/actions/projects";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ProjectListItem = {
  id: string;
  nameUz: string;
  nameJa: string;
  descriptionUz: string;
  descriptionJa: string;
  color: string;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  updatedAt: Date;
  progress: number;
  role: ProjectMemberRole | null;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  owner: { id: string; fullName: string };
  _count: { tasks: number };
  members: { user: { id: string; fullName: string; avatarUrl: string | null } }[];
  recentTasks: {
    id: string;
    titleUz: string;
    titleJa: string;
    status: TaskStatus;
  }[];
};

type ProjectListProps = {
  projects: ProjectListItem[];
};

function formatDateInput(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

type ProjectCardProps = {
  project: ProjectListItem;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isPending: boolean;
};

function ProjectCard({
  project,
  onEdit,
  onArchive,
  onDelete,
  isPending,
}: ProjectCardProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("projects");
  const tTasks = useTranslations("tasks");
  const dateLocale = getDateLocale(locale);
  const projectHref = `/projects/${project.id}`;
  const taskHref = (taskId: string) => `/tasks?project=${project.id}&task=${taskId}`;
  const name = pickLocalized(locale, project.nameUz, project.nameJa);
  const description = pickLocalized(locale, project.descriptionUz, project.descriptionJa);
  const totalTasks = project._count.tasks;
  const previewTasks = project.recentTasks.slice(0, 2);
  const remainingTasks = totalTasks - previewTasks.length;

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      <Link
        href={projectHref}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={t("openProject", { name })}
      />

      <CardHeader className="pointer-events-none relative z-10 gap-2 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className="size-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <CardTitle className="truncate transition-colors group-hover:text-primary">
                {name}
              </CardTitle>
            </div>
            <StatusBadge
              kind="project"
              value={project.status}
              label={t(`statuses.${project.status}`)}
            />
          </div>
          {(project.canEdit || project.canArchive || project.canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="pointer-events-auto shrink-0 cursor-pointer"
                    onClick={(event) => event.stopPropagation()}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="pointer-events-auto z-30">
                {project.canEdit ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="size-4" />
                    {t("editProject")}
                  </DropdownMenuItem>
                ) : null}
                {project.canArchive && project.status !== "ARCHIVED" ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onArchive();
                    }}
                    disabled={isPending}
                  >
                    <Archive className="size-4" />
                    {t("archiveProject")}
                  </DropdownMenuItem>
                ) : null}
                {project.canDelete ? (
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete();
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                    {t("deleteProject")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 pt-0">
        {description ? (
          <p className="text-body-sm text-muted-foreground line-clamp-2">{description}</p>
        ) : null}

        <ProgressBar value={project.progress} label={t("progress")} />

        <div className="text-body-sm flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-muted-foreground">{t("taskCount", { count: totalTasks })}</span>
          <span className="text-muted-foreground">{t("memberCount", { count: project.members.length })}</span>
          {project.endDate ? (
            <span className="text-muted-foreground">
              {format(project.endDate, "PP", { locale: dateLocale })}
            </span>
          ) : null}
        </div>

        {previewTasks.length > 0 ? (
          <ul className="pointer-events-auto space-y-2 rounded-xl border border-border/50 bg-muted/15 p-3">
            {previewTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2">
                <Link
                  href={taskHref(task.id)}
                  className="text-body-sm min-w-0 flex-1 truncate hover:text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {pickLocalized(locale, task.titleUz, task.titleJa)}
                </Link>
                <StatusBadge
                  kind="task"
                  value={task.status}
                  label={tTasks(`statuses.${task.status}`)}
                  size="sm"
                  className="shrink-0"
                />
              </li>
            ))}
            {remainingTasks > 0 ? (
              <li className="border-t border-border/40 pt-2">
                <Link
                  href={projectHref}
                  className="text-body-sm text-primary pointer-events-auto inline-flex items-center gap-1 font-medium hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {totalTasks > 2
                    ? t("viewAllTasks", { count: totalTasks })
                    : t("viewMoreTasks", { count: remainingTasks })}
                  <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ) : null}
          </ul>
        ) : totalTasks === 0 ? (
          <p className="text-body-sm text-muted-foreground rounded-xl border border-dashed border-border/60 px-3 py-2.5">
            {t("noTasksYet")}
          </p>
        ) : (
          <Link
            href={projectHref}
            className="text-body-sm text-primary pointer-events-auto inline-flex items-center gap-1 font-medium hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {t("viewAllTasks", { count: totalTasks })}
            <ArrowRight className="size-3.5" />
          </Link>
        )}

        <div className="text-caption mt-auto flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">{t("ownerLabel")}:</span>
          <span className="font-medium">{project.owner.fullName}</span>
          {project.role && project.role !== "OWNER" ? (
            <span className={cn("rounded-full bg-muted px-2 py-0.5 text-body-sm")}>
              {t(`roles.${project.role}`)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectList({ projects }: ProjectListProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

  if (projects.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <ProjectFormSheet
            mode="create"
            trigger={<Button className="cursor-pointer">{t("createProject")}</Button>}
          />
        }
      />
    );
  }

  function handleArchive(projectId: string) {
    startTransition(async () => {
      await archiveProject(projectId);
      router.refresh();
    });
  }

  function handleDelete(projectId: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.success) {
        router.push("/projects");
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isPending={isPending}
            onEdit={() => setEditingProject(project)}
            onArchive={() => handleArchive(project.id)}
            onDelete={() => handleDelete(project.id)}
          />
        ))}
      </div>

      {editingProject ? (
        <ProjectFormSheet
          key={editingProject.id}
          mode="edit"
          projectId={editingProject.id}
          open
          onOpenChange={(next) => {
            if (!next) setEditingProject(null);
          }}
          initialValues={{
            nameUz: editingProject.nameUz,
            nameJa: editingProject.nameJa,
            descriptionUz: editingProject.descriptionUz,
            descriptionJa: editingProject.descriptionJa,
            color: editingProject.color,
            startDate: formatDateInput(editingProject.startDate),
            endDate: formatDateInput(editingProject.endDate),
            status: editingProject.status,
          }}
        />
      ) : null}
    </>
  );
}
