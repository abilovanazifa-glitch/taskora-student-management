"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireTaskAccess } from "@/lib/permissions/access";
import type { AppLocale } from "@/i18n/routing";

export type TaskExtrasActionState = {
  success: boolean;
  id?: string;
  formError?: string;
};

function revalidateTaskPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function createTaskChecklist(
  taskId: string,
  title: string,
  locale: AppLocale,
): Promise<TaskExtrasActionState> {
  try {
    await requireAuth();
    const { task } = await requireTaskAccess(taskId, "edit");

    const trimmed = title.trim();
    if (trimmed.length < 1) {
      return { success: false, formError: "invalid" };
    }

    const count = await prisma.taskChecklist.count({ where: { taskId } });
    const titleUz = locale === "ja" ? trimmed : trimmed;
    const titleJa = locale === "ja" ? trimmed : trimmed;

    const checklist = await prisma.taskChecklist.create({
      data: {
        taskId: task.id,
        titleUz,
        titleJa,
        position: count,
      },
    });

    revalidateTaskPaths();
    return { success: true, id: checklist.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function addChecklistItem(
  checklistId: string,
  title: string,
  _locale: AppLocale,
): Promise<TaskExtrasActionState> {
  try {
    await requireAuth();
    const checklist = await prisma.taskChecklist.findUnique({
      where: { id: checklistId },
      include: { task: true },
    });
    if (!checklist) {
      return { success: false, formError: "notFound" };
    }

    await requireTaskAccess(checklist.taskId, "edit");

    const trimmed = title.trim();
    if (trimmed.length < 1) {
      return { success: false, formError: "invalid" };
    }

    const count = await prisma.taskChecklistItem.count({ where: { checklistId } });
    const item = await prisma.taskChecklistItem.create({
      data: {
        checklistId,
        titleUz: trimmed,
        titleJa: trimmed,
        position: count,
      },
    });

    revalidateTaskPaths();
    return { success: true, id: item.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function toggleChecklistItem(
  itemId: string,
  isCompleted: boolean,
): Promise<TaskExtrasActionState> {
  try {
    await requireAuth();
    const item = await prisma.taskChecklistItem.findUnique({
      where: { id: itemId },
      include: { checklist: true },
    });
    if (!item) {
      return { success: false, formError: "notFound" };
    }

    await requireTaskAccess(item.checklist.taskId, "edit");

    await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });

    revalidateTaskPaths();
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function addTaskComment(
  taskId: string,
  body: string,
  _locale: AppLocale,
): Promise<TaskExtrasActionState> {
  try {
    const session = await requireAuth();
    await requireTaskAccess(taskId, "view");

    const trimmed = body.trim();
    if (trimmed.length < 1) {
      return { success: false, formError: "invalid" };
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: session.user.id,
        bodyUz: trimmed,
        bodyJa: trimmed,
      },
    });

    revalidateTaskPaths();
    return { success: true, id: comment.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function addTaskAttachment(
  taskId: string,
  name: string,
  url: string,
): Promise<TaskExtrasActionState> {
  try {
    await requireAuth();
    await requireTaskAccess(taskId, "edit");

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (trimmedName.length < 1 || trimmedUrl.length < 4) {
      return { success: false, formError: "invalid" };
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        name: trimmedName,
        url: trimmedUrl,
      },
    });

    revalidateTaskPaths();
    return { success: true, id: attachment.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function archiveTask(taskId: string): Promise<TaskExtrasActionState> {
  try {
    await requireAuth();
    const { task } = await requireTaskAccess(taskId, "edit");

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "CANCELLED" },
    });

    revalidateTaskPaths();
    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}
