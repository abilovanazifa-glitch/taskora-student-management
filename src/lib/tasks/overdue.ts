import type { TaskStatus } from "@prisma/client";

const CLOSED_STATUSES: TaskStatus[] = ["COMPLETED", "CANCELLED"];

export function isTaskOverdue(
  deadline: Date | null | undefined,
  status: TaskStatus,
  now = new Date(),
): boolean {
  if (!deadline || CLOSED_STATUSES.includes(status)) {
    return false;
  }

  return deadline.getTime() < now.getTime();
}
