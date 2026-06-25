"use server";

import { requireAuth } from "@/lib/permissions/access";
import { getTaskDetail } from "@/lib/queries/tasks";

export async function fetchTaskDetailForModal(taskId: string) {
  const session = await requireAuth();
  return getTaskDetail(taskId, session.user.id);
}
