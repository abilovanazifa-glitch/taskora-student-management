import { auth } from "@/auth";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  canEditTask,
  getProjectRole,
  hasProjectPermission,
  type ProjectAction,
} from "@/lib/permissions/project";

export type TaskAction = "view" | "edit" | "delete";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireProjectAccess(projectId: string, action: ProjectAction) {
  const session = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        select: { userId: true, role: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError();
  }

  const role = getProjectRole(session.user.id, project);
  if (!hasProjectPermission(role, action)) {
    throw new ForbiddenError();
  }

  return { session, project, role };
}

export async function requireTaskAccess(taskId: string, action: TaskAction) {
  const session = await requireAuth();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            select: { userId: true, role: true },
          },
        },
      },
      tags: { select: { tagId: true } },
    },
  });

  if (!task) {
    throw new NotFoundError();
  }

  const role = getProjectRole(session.user.id, task.project);
  if (!hasProjectPermission(role, "view")) {
    throw new ForbiddenError();
  }

  if (action === "edit" && !canEditTask(role, session.user.id, task)) {
    throw new ForbiddenError();
  }

  if (action === "delete" && !hasProjectPermission(role, "delete_task")) {
    throw new ForbiddenError();
  }

  return { session, task, role };
}

export async function getAccessibleProjectIds(userId: string) {
  const [memberships, owned] = await Promise.all([
    prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    }),
    prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
  ]);

  return [...new Set([...memberships.map((m) => m.projectId), ...owned.map((p) => p.id)])];
}
