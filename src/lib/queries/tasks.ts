import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";
import { canEditTask, getProjectRole, hasProjectPermission } from "@/lib/permissions/project";
import { isTaskOverdue } from "@/lib/tasks/overdue";
import type { TaskFilterInput } from "@/lib/validations/task";

const taskDetailChecklistArgs = {
  orderBy: { position: "asc" as const },
  include: {
    items: { orderBy: { position: "asc" as const } },
  },
} satisfies Prisma.TaskChecklistFindManyArgs;

const taskDetailCommentArgs = {
  orderBy: { createdAt: "desc" as const },
  include: {
    author: { select: { id: true, fullName: true, avatarUrl: true } },
  },
} satisfies Prisma.TaskCommentFindManyArgs;

export type TaskDetailChecklist = Prisma.TaskChecklistGetPayload<typeof taskDetailChecklistArgs>;
export type TaskDetailComment = Prisma.TaskCommentGetPayload<typeof taskDetailCommentArgs>;
export type TaskDetailAttachment = {
  id: string;
  taskId: string;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
};

export const TASK_PAGE_SIZE = 20;
export const TASK_KANBAN_LIMIT = 200;

type TaskCardMeta = {
  id: string;
  checklistProgress: { done: number; total: number };
  attachmentCount: number;
};

/** Loads checklist/attachment counts when the Prisma client supports those models. */
async function enrichTaskCardMeta(items: TaskCardMeta[]) {
  if (items.length === 0) {
    return;
  }

  const taskIds = items.map((task) => task.id);

  try {
    const checklists = await prisma.taskChecklist.findMany({
      where: { taskId: { in: taskIds } },
      select: {
        taskId: true,
        items: { select: { isCompleted: true } },
      },
    });

    const checklistByTask = new Map<string, { done: number; total: number }>();
    for (const checklist of checklists) {
      const current = checklistByTask.get(checklist.taskId) ?? { done: 0, total: 0 };
      for (const item of checklist.items) {
        current.total += 1;
        if (item.isCompleted) current.done += 1;
      }
      checklistByTask.set(checklist.taskId, current);
    }

    for (const task of items) {
      task.checklistProgress = checklistByTask.get(task.id) ?? { done: 0, total: 0 };
    }
  } catch {
    // Prisma client may be stale until `npx prisma generate` is run.
  }

  try {
    const attachments = await prisma.taskAttachment.groupBy({
      by: ["taskId"],
      where: { taskId: { in: taskIds } },
      _count: { _all: true },
    });

    const attachmentByTask = new Map(
      attachments.map((entry) => [entry.taskId, entry._count._all]),
    );

    for (const task of items) {
      task.attachmentCount = attachmentByTask.get(task.id) ?? 0;
    }
  } catch {
    // Prisma client may be stale until `npx prisma generate` is run.
  }
}

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildTaskOrderBy(
  sort: TaskFilterInput["sort"],
  order: TaskFilterInput["order"],
): Prisma.TaskOrderByWithRelationInput[] {
  const direction = order ?? "desc";

  switch (sort) {
    case "deadline":
      return [{ deadline: direction }, { createdAt: "desc" }];
    case "priority":
      return [{ priority: direction }, { deadline: "asc" }];
    case "status":
      return [{ status: direction }, { deadline: "asc" }];
    case "title":
      return [{ titleJa: direction }, { createdAt: "desc" }];
    case "createdAt":
    default:
      return [{ createdAt: direction }];
  }
}

export function listTasks(userId: string, filters: TaskFilterInput = {}) {
  const cacheKey = `tasks-${userId}-${JSON.stringify(filters)}`;
  return unstable_cache(
    () => fetchTasks(userId, filters),
    [cacheKey],
    { revalidate: 30 },
  )();
}

async function fetchTasks(userId: string, filters: TaskFilterInput = {}) {
  const projectIds = await getAccessibleProjectIds(userId);
  const search = filters.search?.trim();
  const status = filters.status && filters.status !== "ALL" ? filters.status : undefined;
  const priority = filters.priority && filters.priority !== "ALL" ? filters.priority : undefined;
  const view = filters.view ?? "table";
  const page = filters.page ?? 1;
  const now = new Date();

  const where: Prisma.TaskWhereInput = {
    projectId: {
      in: filters.projectId ? projectIds.filter((id) => id === filters.projectId) : projectIds,
    },
    ...(view === "kanban" ? { status: { notIn: ["CANCELLED"] } } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.tagId
      ? {
          tags: {
            some: { tagId: filters.tagId },
          },
        }
      : {}),
    ...(filters.overdueOnly === "true"
      ? {
          deadline: { lt: now },
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { titleUz: { contains: search, mode: "insensitive" } },
            { titleJa: { contains: search, mode: "insensitive" } },
            { descriptionUz: { contains: search, mode: "insensitive" } },
            { descriptionJa: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy = buildTaskOrderBy(filters.sort, filters.order);
  const take = view === "kanban" ? TASK_KANBAN_LIMIT : TASK_PAGE_SIZE;
  const skip = view === "kanban" ? 0 : (page - 1) * TASK_PAGE_SIZE;

  const [tasks, totalCount, projects, subjects, tags] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        project: {
          select: { id: true, nameUz: true, nameJa: true, color: true, ownerId: true },
        },
        subject: { select: { id: true, nameUz: true, nameJa: true, color: true } },
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        creator: { select: { id: true, fullName: true } },
        tags: {
          include: {
            tag: { select: { id: true, nameUz: true, nameJa: true, color: true } },
          },
        },
      },
    }),
    prisma.task.count({ where }),
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: {
        id: true,
        nameUz: true,
        nameJa: true,
        color: true,
        ownerId: true,
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.subject.findMany({
      where: { ownerId: userId },
      orderBy: { nameJa: "asc" },
    }),
    prisma.tag.findMany({
      where: { ownerId: userId },
      orderBy: { nameJa: "asc" },
    }),
  ]);

  const projectRoles = new Map(
    projects.map((project) => [project.id, getProjectRole(userId, project)]),
  );

  const items = tasks.map((task) => {
    const role = projectRoles.get(task.projectId) ?? null;

    return {
      ...task,
      checklistProgress: { done: 0, total: 0 },
      attachmentCount: 0,
      isOverdue: isTaskOverdue(task.deadline, task.status, now),
      permissions: {
        canEdit: canEditTask(role, userId, task),
        canDelete: hasProjectPermission(role, "delete_task"),
      },
    };
  });

  await enrichTaskCardMeta(items);

  return {
    items,
    totalCount,
    page,
    pageSize: TASK_PAGE_SIZE,
    totalPages: view === "kanban" ? 1 : Math.max(1, Math.ceil(totalCount / TASK_PAGE_SIZE)),
    projects: projects.map((project) => ({
      ...project,
      role: getProjectRole(userId, project),
      canCreateTask: hasProjectPermission(getProjectRole(userId, project), "create_task"),
      members: project.members.map((member) => member.user),
    })),
    subjects,
    tags,
    creatableProjects: projects
      .filter((project) =>
        hasProjectPermission(getProjectRole(userId, project), "create_task"),
      )
      .map((project) => ({
        id: project.id,
        nameUz: project.nameUz,
        nameJa: project.nameJa,
        color: project.color,
        members: project.members.map((member) => member.user),
      })),
  };
}

export async function getTaskDetail(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
      },
      subject: true,
      assignee: { select: { id: true, fullName: true, avatarUrl: true } },
      creator: { select: { id: true, fullName: true } },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const role = getProjectRole(userId, task.project);
  if (!hasProjectPermission(role, "view")) {
    return null;
  }

  const detail = {
    ...task,
    checklists: [] as TaskDetailChecklist[],
    comments: [] as TaskDetailComment[],
    attachments: [] as TaskDetailAttachment[],
    isOverdue: isTaskOverdue(task.deadline, task.status),
    permissions: {
      canEdit: canEditTask(role, userId, task),
      canDelete: hasProjectPermission(role, "delete_task"),
    },
  };

  await enrichTaskDetailExtras(detail);

  return detail;
}

async function enrichTaskDetailExtras(task: {
  id: string;
  checklists: TaskDetailChecklist[];
  comments: TaskDetailComment[];
  attachments: TaskDetailAttachment[];
}) {
  try {
    task.checklists = await prisma.taskChecklist.findMany({
      where: { taskId: task.id },
      ...taskDetailChecklistArgs,
    });
  } catch {
    // Prisma client may be stale until `npx prisma generate` is run.
  }

  try {
    task.comments = await prisma.taskComment.findMany({
      where: { taskId: task.id },
      ...taskDetailCommentArgs,
    });
  } catch {
    // Prisma client may be stale until `npx prisma generate` is run.
  }

  try {
    task.attachments = await prisma.taskAttachment.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // Prisma client may be stale until `npx prisma generate` is run.
  }
}

export function buildTaskDates(input: { startDate?: string; deadline?: string }) {
  return {
    startDate: parseOptionalDate(input.startDate),
    deadline: parseOptionalDate(input.deadline),
  };
}
