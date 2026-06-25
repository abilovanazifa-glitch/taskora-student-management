"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { CheckSquare, GripVertical, Paperclip } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { TaskActionsMenu } from "@/components/tasks/task-actions-menu";
import { TaskAssigneePicker } from "@/components/tasks/task-assignee-picker";
import { TaskCompleteToggle } from "@/components/tasks/task-complete-toggle";
import { TaskInlineTitle } from "@/components/tasks/task-inline-title";
import type { TaskListItem } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";

type KanbanTaskCardProps = {
  locale: AppLocale;
  task: TaskListItem;
  members: { id: string; fullName: string; avatarUrl: string | null }[];
  isDragging?: boolean;
  onOpenDetail?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export function KanbanTaskCard({
  locale,
  task,
  members,
  isDragging,
  onOpenDetail,
  onDragStart,
  onDragEnd,
}: KanbanTaskCardProps) {
  const dateLocale = getDateLocale(locale);
  const isDone = task.status === "COMPLETED";
  const cardRef = useRef<HTMLElement>(null);

  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.setData("text/task-id", task.id);
    event.dataTransfer.effectAllowed = "move";

    if (cardRef.current) {
      event.dataTransfer.setDragImage(cardRef.current, 24, 20);
    }

    onDragStart?.();
  }

  return (
    <article
      ref={cardRef}
      draggable={task.permissions.canEdit}
      onDragStart={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, input, textarea, [role='menu']")) {
          event.preventDefault();
          return;
        }
        handleDragStart(event);
      }}
      onDragEnd={onDragEnd}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, input, textarea, [role='menu'], [data-drag-handle]")) return;
        onOpenDetail?.();
      }}
      className={cn(
        "kanban-card group transition-all duration-200 hover:bg-muted/35",
        task.permissions.canEdit && "cursor-grab active:cursor-grabbing",
        isDragging && "scale-[0.98] opacity-45 ring-primary/30",
        isDone && "opacity-85",
      )}
    >
      <div className="flex gap-2.5">
        {task.permissions.canEdit ? (
          <div
            data-drag-handle
            className="text-muted-foreground hover:text-foreground -ml-0.5 mt-1 flex shrink-0 cursor-grab touch-none items-start active:cursor-grabbing"
            aria-hidden="true"
          >
            <GripVertical className="size-4" />
          </div>
        ) : null}

        <TaskCompleteToggle
          taskId={task.id}
          status={task.status}
          canEdit={task.permissions.canEdit}
          className="mt-1"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <TaskInlineTitle
              taskId={task.id}
              titleUz={task.titleUz}
              titleJa={task.titleJa}
              locale={locale}
              canEdit={task.permissions.canEdit}
              className={cn(isDone && "text-muted-foreground line-through")}
            />
            <div className="flex shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <TaskActionsMenu taskId={task.id} permissions={task.permissions} />
            </div>
          </div>

          {task.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((entry) => (
                <span
                  key={entry.tagId}
                  className="rounded-md px-2 py-0.5 text-body-sm font-medium"
                  style={{
                    backgroundColor: `${entry.tag.color}22`,
                    color: entry.tag.color,
                  }}
                >
                  {pickLocalized(locale, entry.tag.nameUz, entry.tag.nameJa)}
                </span>
              ))}
            </div>
          ) : null}

          {(task.checklistProgress?.total ?? 0) > 0 || (task.attachmentCount ?? 0) > 0 ? (
            <div className="text-caption flex flex-wrap items-center gap-3 text-muted-foreground">
              {(task.checklistProgress?.total ?? 0) > 0 ? (
                <span className="flex items-center gap-1">
                  <CheckSquare className="size-3.5" />
                  {task.checklistProgress?.done}/{task.checklistProgress?.total}
                </span>
              ) : null}
              {(task.attachmentCount ?? 0) > 0 ? (
                <span className="flex items-center gap-1">
                  <Paperclip className="size-3.5" />
                  {task.attachmentCount}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2.5">
            <div className="text-caption flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {task.subject ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: task.subject.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {pickLocalized(locale, task.subject.nameUz, task.subject.nameJa)}
                  </span>
                </span>
              ) : null}
              {task.isOverdue ? (
                <span className="text-destructive shrink-0 text-body-sm font-medium">!</span>
              ) : null}
              {task.deadline ? (
                <span className="text-muted-foreground shrink-0">
                  {format(task.deadline, "d MMM", { locale: dateLocale })}
                </span>
              ) : null}
            </div>
            <TaskAssigneePicker
              taskId={task.id}
              assignee={task.assignee}
              members={members}
              canEdit={task.permissions.canEdit}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
