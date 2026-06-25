import type { TaskStatus } from "@prisma/client";
import {
  Ban,
  CheckCircle2,
  Eye,
  Inbox,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

export type TaskStatusVisual = {
  icon: LucideIcon;
  accentClass: string;
  dotClass: string;
};

export const TASK_STATUS_VISUALS: Record<TaskStatus, TaskStatusVisual> = {
  TODO: {
    icon: Inbox,
    accentClass: "text-slate-500 dark:text-slate-400",
    dotClass: "bg-slate-400",
  },
  IN_PROGRESS: {
    icon: PlayCircle,
    accentClass: "text-blue-600 dark:text-blue-400",
    dotClass: "bg-primary",
  },
  REVIEW: {
    icon: Eye,
    accentClass: "text-amber-500 dark:text-amber-400",
    dotClass: "bg-amber-400",
  },
  COMPLETED: {
    icon: CheckCircle2,
    accentClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  CANCELLED: {
    icon: Ban,
    accentClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};

export const KANBAN_COLUMN_KEYS = [
  { status: "TODO" as const, labelKey: "plan" },
  { status: "IN_PROGRESS" as const, labelKey: "inProgress" },
  { status: "COMPLETED" as const, labelKey: "done" },
] as const;

export function statusVisual(status: TaskStatus): TaskStatusVisual {
  return TASK_STATUS_VISUALS[status];
}
