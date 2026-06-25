import type { TaskStatus } from "@prisma/client";
import { KANBAN_COLUMN_KEYS, TASK_STATUS_VISUALS } from "@/lib/tasks/visuals";

export const KANBAN_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

export const KANBAN_COLUMNS = KANBAN_COLUMN_KEYS.map(({ status, labelKey }) => ({
  status,
  labelKey,
  accent: TASK_STATUS_VISUALS[status].dotClass,
}));

export function resolveCompletedAt(
  nextStatus: TaskStatus,
  previousStatus: TaskStatus,
  previousCompletedAt: Date | null,
  now = new Date(),
): Date | null {
  if (nextStatus === "COMPLETED") {
    return previousCompletedAt ?? now;
  }

  if (previousStatus === "COMPLETED") {
    return null;
  }

  return previousCompletedAt;
}

export function canMoveKanbanStatus(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) {
    return false;
  }

  if (from === "CANCELLED" || to === "CANCELLED") {
    return false;
  }

  return KANBAN_STATUSES.includes(from) && KANBAN_STATUSES.includes(to);
}
