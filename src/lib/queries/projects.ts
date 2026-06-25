import type { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";
import { getProjectRole, hasProjectPermission } from "@/lib/permissions/project";
import type { ProjectFilterInput } from "@/lib/validations/project";

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listProjects(userId: string, filters: ProjectFilterInput = {}) {
  const projectIds = await getAccessibleProjectIds(userId);
  const search = filters.search?.trim();
  const status = filters.status && filters.status !== "ALL" ? filters.status : undefined;
  const sort = filters.sort ?? "updatedAt";
  const order = filters.order ?? "desc";

  const where: Prisma.ProjectWhereInput = {
    id: { in: projectIds },
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { nameUz: { contains: search, mode: "insensitive" } },
            { nameJa: { contains: search, mode: "insensitive" } },
            { descriptionUz: { contains: search, mode: "insensitive" } },
            { descriptionJa: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProjectOrderByWithRelationInput =
    sort === "name"
      ? { nameJa: order }
      : sort === "startDate"
        ? { startDate: order }
        : sort === "status"
          ? { status: order }
          : { updatedAt: order };

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    include: {
      owner: { select: { id: true, fullName: true } },
      members: {
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      },
      _count: { select: { tasks: true } },
      tasks: {
        select: {
          id: true,
          titleUz: true,
          titleJa: true,
          status: true,
        },
        orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
        take: 2,
      },
    },
  });

  const openCounts =
    projects.length > 0
      ? await prisma.task.groupBy({
          by: ["projectId"],
          where: {
            projectId: { in: projects.map((project) => project.id) },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          _count: { _all: true },
        })
      : [];

  const openByProject = new Map(
    openCounts.map((row) => [row.projectId, row._count._all]),
  );

  return projects.map((project) => {
    const role = getProjectRole(userId, project);
    const totalTasks = project._count.tasks;
    const openTasks = openByProject.get(project.id) ?? 0;
    const progress = totalTasks === 0 ? 0 : Math.round(((totalTasks - openTasks) / totalTasks) * 100);

    return {
      ...project,
      recentTasks: project.tasks,
      role,
      progress,
      canEdit: hasProjectPermission(role, "edit_project"),
      canArchive: hasProjectPermission(role, "archive_project"),
      canDelete: hasProjectPermission(role, "delete_project"),
    };
  });
}

export async function getProjectDetail(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      },
      calendarEvents: {
        orderBy: { startAt: "asc" },
        take: 10,
      },
      _count: { select: { tasks: true, members: true, calendarEvents: true } },
    },
  });

  if (!project) {
    return null;
  }

  const role = getProjectRole(userId, project);
  if (!hasProjectPermission(role, "view")) {
    return null;
  }

  const completedTasks = await prisma.task.count({
    where: { projectId, status: "COMPLETED" },
  });

  const openTasks = await prisma.task.count({
    where: {
      projectId,
      status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
    },
  });

  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      projectId,
      status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
      deadline: { not: null },
    },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  const progress =
    project._count.tasks === 0
      ? 0
      : Math.round((completedTasks / project._count.tasks) * 100);

  return {
    ...project,
    role,
    progress,
    completedTasks,
    openTasks,
    upcomingDeadlines,
    permissions: {
      canEdit: hasProjectPermission(role, "edit_project"),
      canArchive: hasProjectPermission(role, "archive_project"),
      canDelete: hasProjectPermission(role, "delete_project"),
      canManageMembers: hasProjectPermission(role, "manage_members"),
      canManageEvents: hasProjectPermission(role, "manage_events"),
      canCreateTask: hasProjectPermission(role, "create_task"),
      canTransferOwnership: role === "OWNER",
      canLeave: userId !== project.ownerId && role !== "OWNER",
    },
  };
}

export async function getProjectMembersData(projectId: string, userId: string) {
  const project = await getProjectDetail(projectId, userId);
  if (!project) {
    return null;
  }

  const pendingInvitations = project.permissions.canManageMembers
    ? await prisma.invitation.findMany({
        where: {
          projectId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        include: { inviter: { select: { fullName: true } } },
      })
    : [];

  return {
    project,
    pendingInvitations,
    currentUserId: userId,
  };
}

export function buildProjectDates(input: {
  startDate?: string;
  endDate?: string;
}) {
  return {
    startDate: parseOptionalDate(input.startDate),
    endDate: parseOptionalDate(input.endDate),
  };
}

export function isArchivedStatus(status: ProjectStatus) {
  return status === "ARCHIVED";
}
