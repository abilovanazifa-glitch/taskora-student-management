"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { TaskStatus } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { moveTaskKanban } from "@/lib/actions/tasks";
import { KANBAN_COLUMNS } from "@/lib/tasks/status";
import { TASK_STATUS_VISUALS } from "@/lib/tasks/visuals";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { KanbanAddCard } from "@/components/tasks/kanban-add-card";
import { KanbanTaskCard } from "@/components/tasks/kanban-task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { TaskListItem } from "@/components/tasks/task-types";
import { useTaskDeepLink } from "@/components/tasks/use-task-deep-link";
import { cn } from "@/lib/utils";

type TaskKanbanBoardProps = {
  locale: AppLocale;
  tasks: TaskListItem[];
  projects: {
    id: string;
    nameUz: string;
    nameJa: string;
    color: string;
    members: { id: string; fullName: string; avatarUrl: string | null }[];
  }[];
  subjects: { id: string; nameUz: string; nameJa: string; color: string }[];
  tags: { id: string; nameUz: string; nameJa: string; color: string }[];
  defaultProjectId?: string;
};

export function TaskKanbanBoard({
  locale,
  tasks,
  projects,
  subjects,
  tags,
  defaultProjectId,
}: TaskKanbanBoardProps) {
  const t = useTranslations("tasks.kanban");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { selectedTask, setSelectedTask, handleDialogOpenChange } = useTaskDeepLink(tasks);
  const [pendingMove, setPendingMove] = useState<{ taskId: string; status: TaskStatus } | null>(
    null,
  );

  const effectivePendingMove = useMemo(() => {
    if (!pendingMove) return null;
    const task = tasks.find((item) => item.id === pendingMove.taskId);
    if (task?.status === pendingMove.status) return null;
    return pendingMove;
  }, [tasks, pendingMove]);

  const [clearedPendingKey, setClearedPendingKey] = useState<string | null>(null);
  const pendingClearKey = pendingMove ? `${pendingMove.taskId}:${pendingMove.status}` : null;

  if (pendingMove && !effectivePendingMove && pendingClearKey !== clearedPendingKey) {
    setClearedPendingKey(pendingClearKey);
    setPendingMove(null);
    setMovingTaskId(null);
  }

  if (!pendingMove && clearedPendingKey !== null) {
    setClearedPendingKey(null);
  }

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<TaskStatus | null>(null);
  const dragEndedRecently = useRef(false);
  const addProjectId = defaultProjectId ?? projects[0]?.id ?? "";

  const localTasks = useMemo(() => {
    if (!effectivePendingMove) return tasks;
    const current = tasks.find((task) => task.id === effectivePendingMove.taskId);
    if (current?.status === effectivePendingMove.status) return tasks;
    return tasks.map((task) =>
      task.id === effectivePendingMove.taskId
        ? { ...task, status: effectivePendingMove.status }
        : task,
    );
  }, [tasks, effectivePendingMove]);

  function handleDragStart(taskId: string) {
    setDraggingId(taskId);
    dragEndedRecently.current = false;
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropColumn(null);
    dragEndedRecently.current = true;
    window.setTimeout(() => {
      dragEndedRecently.current = false;
    }, 150);
  }

  function handleDragOver(event: React.DragEvent, status: TaskStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropColumn(status);
  }

  function handleDrop(event: React.DragEvent, nextStatus: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    handleDragEnd();

    if (!taskId || movingTaskId === taskId) return;

    const current = localTasks.find((task) => task.id === taskId);
    if (!current || current.status === nextStatus) return;

    setPendingMove({ taskId, status: nextStatus });
    setMovingTaskId(taskId);

    startTransition(async () => {
      const result = await moveTaskKanban(taskId, nextStatus);
      if (result.success) {
        toast(t("moved"), "success");
        router.refresh();
      } else {
        setPendingMove(null);
        setMovingTaskId(null);
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  const allMembers = Array.from(
    new Map(projects.flatMap((project) => project.members.map((m) => [m.id, m]))).values(),
  );

  return (
    <>
      <div className="kanban-board">
        {KANBAN_COLUMNS.map(({ status, labelKey }) => {
          const ColumnIcon = TASK_STATUS_VISUALS[status].icon;
          const iconClass = TASK_STATUS_VISUALS[status].accentClass;
          const columnTasks = localTasks.filter((task) => task.status === status);
          const isDropTarget = dropColumn === status && draggingId !== null;

          return (
            <section
              key={status}
              className={cn(
                "kanban-column transition-colors duration-200",
                isDropTarget && "bg-primary/5 ring-2 ring-primary/40",
              )}
              onDragOver={(event) => handleDragOver(event, status)}
              onDragEnter={(event) => {
                event.preventDefault();
                setDropColumn(status);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setDropColumn((current) => (current === status ? null : current));
              }}
              onDrop={(event) => handleDrop(event, status)}
            >
              <header className="flex items-center gap-2.5 px-4 py-3.5">
                <ColumnIcon className={cn("size-6 shrink-0", iconClass)} aria-hidden="true" />
                <h3 className="text-body font-medium">{t(`columns.${labelKey}`)}</h3>
                <span className="text-caption ml-auto tabular-nums">{columnTasks.length}</span>
              </header>

              <div
                className={cn(
                  "flex min-h-[160px] flex-1 flex-col gap-3 px-3 pb-3",
                  columnTasks.length === 0 && draggingId && "justify-center",
                )}
              >
                {columnTasks.length === 0 && draggingId ? (
                  <div
                    className={cn(
                      "text-caption flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-200",
                      isDropTarget
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {t("dropHere")}
                  </div>
                ) : null}

                {columnTasks.map((task) => {
                  const taskMembers =
                    projects.find((project) => project.id === task.projectId)?.members ??
                    allMembers;

                  return (
                    <KanbanTaskCard
                      key={task.id}
                      locale={locale}
                      task={task}
                      members={taskMembers}
                      isDragging={draggingId === task.id}
                      onOpenDetail={() => {
                        if (dragEndedRecently.current) return;
                        setSelectedTask(task);
                      }}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })}
              </div>

              {addProjectId ? (
                <footer className="border-t border-border/40 px-3 py-3">
                  <KanbanAddCard
                    locale={locale}
                    status={status}
                    projectId={addProjectId}
                    lists={subjects}
                    defaultListId={subjects[0]?.id}
                  />
                </footer>
              ) : null}
            </section>
          );
        })}
      </div>

      {selectedTask ? (
        <TaskDetailDialog
          locale={locale}
          mode={selectedTask.permissions.canEdit ? "edit" : "view"}
          taskId={selectedTask.id}
          task={selectedTask}
          projects={projects}
          subjects={subjects}
          tags={tags}
          canEdit={selectedTask.permissions.canEdit}
          open={Boolean(selectedTask)}
          onOpenChange={handleDialogOpenChange}
        />
      ) : null}
    </>
  );
}
