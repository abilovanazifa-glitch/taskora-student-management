"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  requireAuth,
  requireProjectAccess,
  requireTaskAccess,
} from "@/lib/permissions/access";
import { buildTaskDates } from "@/lib/queries/tasks";
import { resolveCompletedAt } from "@/lib/tasks/status";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyTaskUpdated,
  syncTaskReminders,
} from "@/lib/notifications/task-events";
import {
  inlineTaskTitleSchema,
  kanbanQuickTaskSchema,
  mapTaskZodErrors,
  parseTaskFormData,
  quickTaskSchema,
  taskFilterSchema,
  taskStatusUpdateSchema,
  type TaskErrorCode,
  type TaskFilterInput,
} from "@/lib/validations/task";

export type TaskActionState = {
  success: boolean;
  taskId?: string;
  fieldErrors?: Partial<Record<string, TaskErrorCode>>;
  formError?: TaskErrorCode;
};

export type QuickTaskState = TaskActionState;

function revalidateTaskPaths(projectId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function parseDeadline(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function parseTaskFilters(
  searchParams: Record<string, string | undefined>,
): Promise<TaskFilterInput> {
  const parsed = taskFilterSchema.safeParse(searchParams);
  return parsed.success ? parsed.data : {};
}

async function validateTaskRelations(
  userId: string,
  projectId: string,
  subjectId?: string,
  assigneeId?: string,
  tagIds: string[] = [],
): Promise<TaskErrorCode | null> {
  if (subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, ownerId: userId },
    });
    if (!subject) {
      return "subjectInvalid";
    }
  }

  if (assigneeId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });
    const isMember =
      project &&
      (project.ownerId === assigneeId ||
        project.members.some((member) => member.userId === assigneeId));
    if (!isMember) {
      return "assigneeInvalid";
    }
  }

  if (tagIds.length > 0) {
    const ownedTags = await prisma.tag.count({
      where: { id: { in: tagIds }, ownerId: userId },
    });
    if (ownedTags !== tagIds.length) {
      return "tagInvalid";
    }
  }

  return null;
}

async function syncTaskTags(taskId: string, tagIds: string[]) {
  await prisma.taskTag.deleteMany({ where: { taskId } });
  if (tagIds.length > 0) {
    await prisma.taskTag.createMany({
      data: tagIds.map((tagId) => ({ taskId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createQuickTask(
  _prev: QuickTaskState,
  formData: FormData,
): Promise<QuickTaskState> {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = quickTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    titleUz: formData.get("titleUz"),
    titleJa: formData.get("titleJa"),
    deadline: formData.get("deadline") || undefined,
    priority: formData.get("priority") || "MEDIUM",
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: mapTaskZodErrors(parsed.error) };
  }

  try {
    await requireProjectAccess(parsed.data.projectId, "create_task");
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "saveFailed" };
  }

  try {
    const task = await prisma.task.create({
      data: {
        projectId: parsed.data.projectId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        descriptionUz: "",
        descriptionJa: "",
        creatorId: session.user.id,
        priority: parsed.data.priority,
        deadline: parseDeadline(parsed.data.deadline),
      },
    });

    revalidateTaskPaths(parsed.data.projectId);
    return { success: true, taskId: task.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function createTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseTaskFormData(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTaskZodErrors(parsed.error) };
  }

  try {
    await requireProjectAccess(parsed.data.projectId, "create_task");
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "saveFailed" };
  }

  const relationError = await validateTaskRelations(
    session.user.id,
    parsed.data.projectId,
    parsed.data.subjectId,
    parsed.data.assigneeId,
    parsed.data.tagIds,
  );
  if (relationError) {
    return { success: false, formError: relationError };
  }

  const dates = buildTaskDates(parsed.data);
  const completedAt = resolveCompletedAt(parsed.data.status, "TODO", null);

  try {
    const task = await prisma.task.create({
      data: {
        projectId: parsed.data.projectId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        descriptionUz: parsed.data.descriptionUz,
        descriptionJa: parsed.data.descriptionJa,
        subjectId: parsed.data.subjectId ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        creatorId: session.user.id,
        priority: parsed.data.priority,
        status: parsed.data.status,
        startDate: dates.startDate,
        deadline: dates.deadline,
        completedAt,
      },
    });

    await syncTaskTags(task.id, parsed.data.tagIds);

    if (parsed.data.assigneeId && parsed.data.assigneeId !== session.user.id) {
      await notifyTaskAssigned({
        assigneeId: parsed.data.assigneeId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        taskId: task.id,
      });
    }

    await syncTaskReminders(session.user.id, task.id, dates.deadline);

    revalidateTaskPaths(parsed.data.projectId);
    return { success: true, taskId: task.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateTask(
  taskId: string,
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  let session;
  let existing;
  try {
    ({ session, task: existing } = await requireTaskAccess(taskId, "edit"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const parsed = parseTaskFormData(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTaskZodErrors(parsed.error) };
  }

  if (parsed.data.projectId !== existing.projectId) {
    try {
      await requireProjectAccess(parsed.data.projectId, "create_task");
    } catch {
      return { success: false, formError: "forbidden" };
    }
  }

  const relationError = await validateTaskRelations(
    session.user.id,
    parsed.data.projectId,
    parsed.data.subjectId,
    parsed.data.assigneeId,
    parsed.data.tagIds,
  );
  if (relationError) {
    return { success: false, formError: relationError };
  }

  const dates = buildTaskDates(parsed.data);
  const completedAt = resolveCompletedAt(
    parsed.data.status,
    existing.status,
    existing.completedAt,
  );

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        projectId: parsed.data.projectId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        descriptionUz: parsed.data.descriptionUz,
        descriptionJa: parsed.data.descriptionJa,
        subjectId: parsed.data.subjectId ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        priority: parsed.data.priority,
        status: parsed.data.status,
        startDate: dates.startDate,
        deadline: dates.deadline,
        completedAt,
      },
    });

    await syncTaskTags(taskId, parsed.data.tagIds);

    if (
      parsed.data.assigneeId &&
      parsed.data.assigneeId !== existing.assigneeId &&
      parsed.data.assigneeId !== session.user.id
    ) {
      await notifyTaskAssigned({
        assigneeId: parsed.data.assigneeId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        taskId,
      });
    }

    if (existing.assigneeId && existing.assigneeId !== session.user.id) {
      await notifyTaskUpdated({
        userId: existing.assigneeId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        taskId,
      });
    }

    if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED" && existing.creatorId !== session.user.id) {
      await notifyTaskCompleted({
        userId: existing.creatorId,
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        taskId,
      });
    }

    await syncTaskReminders(session.user.id, taskId, dates.deadline);

    revalidateTaskPaths(parsed.data.projectId);
    if (parsed.data.projectId !== existing.projectId) {
      revalidateTaskPaths(existing.projectId);
    }
    return { success: true, taskId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function deleteTask(taskId: string): Promise<TaskActionState> {
  let task;
  try {
    ({ task } = await requireTaskAccess(taskId, "delete"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  try {
    await prisma.task.delete({ where: { id: taskId } });
    revalidateTaskPaths(task.projectId);
    return { success: true };
  } catch {
    return { success: false, formError: "deleteFailed" };
  }
}

export async function duplicateTask(taskId: string): Promise<TaskActionState> {
  let session;
  let task;
  try {
    ({ session, task } = await requireTaskAccess(taskId, "view"));
    await requireProjectAccess(task.projectId, "create_task");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  try {
    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true },
    });
    if (!fullTask) {
      return { success: false, formError: "notFound" };
    }

    const copy = await prisma.task.create({
      data: {
        projectId: fullTask.projectId,
        titleUz: `${fullTask.titleUz} (copy)`,
        titleJa: `${fullTask.titleJa}（コピー）`,
        descriptionUz: fullTask.descriptionUz,
        descriptionJa: fullTask.descriptionJa,
        subjectId: fullTask.subjectId,
        assigneeId: fullTask.assigneeId,
        creatorId: session.user.id,
        priority: fullTask.priority,
        status: "TODO",
        startDate: fullTask.startDate,
        deadline: fullTask.deadline,
        completedAt: null,
      },
    });

    if (fullTask.tags.length > 0) {
      await prisma.taskTag.createMany({
        data: fullTask.tags.map((entry) => ({ taskId: copy.id, tagId: entry.tagId })),
        skipDuplicates: true,
      });
    }

    revalidateTaskPaths(fullTask.projectId);
    return { success: true, taskId: copy.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function completeTask(taskId: string): Promise<TaskActionState> {
  return updateTaskStatus(taskId, "COMPLETED");
}

export async function reopenTask(taskId: string): Promise<TaskActionState> {
  return updateTaskStatus(taskId, "TODO");
}

export async function updateTaskStatus(
  taskId: string,
  statusInput: string,
): Promise<TaskActionState> {
  let existing;
  let session;
  try {
    ({ task: existing, session } = await requireTaskAccess(taskId, "edit"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const parsed = taskStatusUpdateSchema.safeParse({ status: statusInput });
  if (!parsed.success) {
    return { success: false, formError: "saveFailed" };
  }

  const completedAt = resolveCompletedAt(
    parsed.data.status,
    existing.status,
    existing.completedAt,
  );

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: parsed.data.status,
        completedAt,
      },
    });

    if (
      parsed.data.status === "COMPLETED" &&
      existing.status !== "COMPLETED" &&
      existing.creatorId !== session.user.id
    ) {
      await notifyTaskCompleted({
        userId: existing.creatorId,
        titleUz: existing.titleUz,
        titleJa: existing.titleJa,
        taskId,
      });
    }

    revalidateTaskPaths(existing.projectId);
    return { success: true, taskId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function moveTaskKanban(
  taskId: string,
  status: string,
): Promise<TaskActionState> {
  return updateTaskStatus(taskId, status);
}

export async function createKanbanTask(input: {
  projectId: string;
  title: string;
  status?: string;
  locale: "uz" | "ja" | "en";
  subjectId?: string;
  tagIds?: string[];
  deadline?: string;
}): Promise<TaskActionState> {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = kanbanQuickTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTaskZodErrors(parsed.error) };
  }

  try {
    await requireProjectAccess(parsed.data.projectId, "create_task");
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "saveFailed" };
  }

  const completedAt = resolveCompletedAt(parsed.data.status, "TODO", null);
  const deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;

  try {
    const task = await prisma.task.create({
      data: {
        projectId: parsed.data.projectId,
        titleUz: parsed.data.title,
        titleJa: parsed.data.title,
        descriptionUz: "",
        descriptionJa: "",
        creatorId: session.user.id,
        priority: "MEDIUM",
        status: parsed.data.status,
        subjectId: parsed.data.subjectId || null,
        deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
        completedAt,
        tags:
          parsed.data.tagIds.length > 0
            ? {
                create: parsed.data.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
      },
    });

    revalidateTaskPaths(parsed.data.projectId);
    return { success: true, taskId: task.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateTaskTitleInline(
  taskId: string,
  input: { title: string; locale: "uz" | "ja" | "en" },
): Promise<TaskActionState> {
  let existing;
  try {
    ({ task: existing } = await requireTaskAccess(taskId, "edit"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const parsed = inlineTaskTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTaskZodErrors(parsed.error) };
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data:
        parsed.data.locale !== "ja"
          ? { titleUz: parsed.data.title }
          : { titleJa: parsed.data.title },
    });

    revalidateTaskPaths(existing.projectId);
    return { success: true, taskId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateTaskAssigneeQuick(
  taskId: string,
  assigneeId: string | null,
): Promise<TaskActionState> {
  let existing;
  let session;
  try {
    ({ task: existing, session } = await requireTaskAccess(taskId, "edit"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  if (assigneeId) {
    const relationError = await validateTaskRelations(
      session.user.id,
      existing.projectId,
      undefined,
      assigneeId,
    );
    if (relationError) {
      return { success: false, formError: relationError };
    }
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });

    if (assigneeId && assigneeId !== session.user.id) {
      await notifyTaskAssigned({
        assigneeId,
        titleUz: existing.titleUz,
        titleJa: existing.titleJa,
        taskId,
      });
    }

    revalidateTaskPaths(existing.projectId);
    return { success: true, taskId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}
