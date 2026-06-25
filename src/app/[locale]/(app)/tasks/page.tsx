import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { bindAppLocale, getAppTranslations } from "@/lib/i18n/server-locale";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { EmptyState } from "@/components/shared/empty-state";
import { SubjectsTagsPanel } from "@/components/tasks/subjects-tags-panel";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskQuickAdd } from "@/components/tasks/task-quick-add";
import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board";
import { parseTaskFilters } from "@/lib/actions/tasks";
import { listSubjects } from "@/lib/queries/subjects";
import { listTags } from "@/lib/queries/tags";
import { listTasks } from "@/lib/queries/tasks";
import {
  getUserDefaultProjectId,
  prepareUserTaskWorkspace,
} from "@/lib/queries/workspace";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

type TasksPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

function TasksSkeleton() {
  return <div className="bg-muted/40 h-64 animate-pulse rounded-xl" />;
}

async function TasksData({
  locale,
  searchParams,
}: {
  locale: AppLocale;
  searchParams: Record<string, string | undefined>;
}) {
  bindAppLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  await prepareUserTaskWorkspace(session.user.id);
  const defaultProjectId = await getUserDefaultProjectId(session.user.id);

  const filters = await parseTaskFilters({
    search: searchParams.q,
    projectId: searchParams.project,
    subjectId: searchParams.subject ?? searchParams.list,
    assigneeId: searchParams.assignee,
    status: searchParams.status,
    priority: searchParams.priority,
    tagId: searchParams.tag,
    overdueOnly: searchParams.overdue,
    sort: searchParams.sort,
    order: searchParams.order,
    page: searchParams.page,
    view: "kanban",
  });

  const [taskData, subjects, tags] = await Promise.all([
    listTasks(session.user.id, filters),
    listSubjects(session.user.id),
    listTags(session.user.id),
  ]);

  const t = await getAppTranslations(locale, "tasks");

  const assignees = Array.from(
    new Map(
      taskData.projects.flatMap((project) =>
        project.members.map((member) => [member.id, member]),
      ),
    ).values(),
  );

  const filterProps = {
    locale,
    search: filters.search ?? "",
    projectId: "",
    subjectId: filters.subjectId ?? "",
    assigneeId: filters.assigneeId ?? "",
    status: (filters.status ?? "ALL") as TaskStatus | "ALL",
    priority: (filters.priority ?? "ALL") as TaskPriority | "ALL",
    tagId: filters.tagId ?? "",
    overdueOnly: filters.overdueOnly === "true",
    sort: filters.sort ?? "createdAt",
    order: filters.order ?? "desc",
    view: "kanban" as const,
    projects: [],
    subjects: taskData.subjects.map(({ id, nameUz, nameJa }) => ({ id, nameUz, nameJa })),
    tags: taskData.tags.map(({ id, nameUz, nameJa }) => ({ id, nameUz, nameJa })),
    assignees,
    hideProjectFilter: true,
  };

  const lists = subjects.map(({ id, nameUz, nameJa, color }) => ({
    id,
    nameUz,
    nameJa,
    color,
  }));

  const labels = tags.map(({ id, nameUz, nameJa, color }) => ({
    id,
    nameUz,
    nameJa,
    color,
  }));

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <TaskQuickAdd
          projectId={defaultProjectId}
          lists={lists}
          labels={labels}
          defaultListId={lists[0]?.id}
        />
      </PageHeader>

      <TaskFilters {...filterProps} />

      <div className="bento-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-muted-foreground text-sm">
            {t("resultCount", { count: taskData.totalCount })}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          {taskData.items.length === 0 ? (
            <EmptyState title={t("empty.title")} description={t("empty.description")} />
          ) : (
            <TaskKanbanBoard
              locale={locale}
              tasks={taskData.items}
              projects={taskData.creatableProjects}
              subjects={taskData.subjects}
              tags={taskData.tags}
              defaultProjectId={defaultProjectId}
            />
          )}
        </div>
      </div>

      <SubjectsTagsPanel locale={locale} subjects={subjects} tags={tags} />
    </>
  );
}

export default async function TasksPage({ params, searchParams }: TasksPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  return (
    <PageStack className="max-w-none">
      <Suspense fallback={<TasksSkeleton />}>
        <TasksData locale={locale as AppLocale} searchParams={resolvedSearchParams} />
      </Suspense>
    </PageStack>
  );
}
