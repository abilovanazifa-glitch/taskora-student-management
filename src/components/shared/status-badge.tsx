import type { ProjectStatus, TaskPriority, TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const taskStatusStyles: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground border-border",
  IN_PROGRESS: "bg-primary/12 text-primary border-primary/25 dark:text-primary",
  REVIEW: "bg-amber-500/12 text-amber-800 border-amber-500/25 dark:text-amber-200",
  COMPLETED: "bg-emerald-500/12 text-emerald-800 border-emerald-500/25 dark:text-emerald-200",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/25",
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  MEDIUM: "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-300",
  HIGH: "bg-orange-500/15 text-orange-800 border-orange-500/30 dark:text-orange-200",
  URGENT: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
};

const projectStatusStyles: Record<ProjectStatus, string> = {
  PLANNED: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-primary/15 text-primary border-primary/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-200",
  ARCHIVED: "bg-destructive/10 text-destructive border-destructive/30",
};

type StatusBadgeProps = {
  label: string;
  kind: "project" | "task" | "priority";
  value: ProjectStatus | TaskStatus | TaskPriority;
  className?: string;
  size?: "default" | "sm";
};

export function StatusBadge({
  label,
  kind,
  value,
  className,
  size = "default",
}: StatusBadgeProps) {
  const styles =
    kind === "project"
      ? projectStatusStyles[value as ProjectStatus]
      : kind === "task"
        ? taskStatusStyles[value as TaskStatus]
        : priorityStyles[value as TaskPriority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-body-sm" : "px-3 py-1 text-body-sm",
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
