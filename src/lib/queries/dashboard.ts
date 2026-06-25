import {
  addDays,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";
import { listSubjects } from "@/lib/queries/subjects";
import { listTags } from "@/lib/queries/tags";
import { getUserDefaultProjectId } from "@/lib/queries/workspace";

const taskInclude = {
  project: { select: { id: true, nameUz: true, nameJa: true, color: true } },
  assignee: { select: { id: true, fullName: true, avatarUrl: true } },
} as const;

async function fetchDashboardData(userId: string) {
  const projectIds = await getAccessibleProjectIds(userId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const upcomingEnd = endOfDay(addDays(now, 7));

  const [
    overdueTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    activeProjects,
    weeklyCompleted,
    weeklyDue,
    calendarPreview,
    recentNotifications,
    defaultProjectId,
    lists,
    labels,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
        deadline: { lt: todayStart },
      },
      include: taskInclude,
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ["IN_PROGRESS", "REVIEW"] },
      },
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: "TODO",
        OR: [{ deadline: null }, { deadline: { gte: todayStart } }],
      },
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: "COMPLETED",
      },
      include: taskInclude,
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        id: { in: projectIds },
        status: "ACTIVE",
      },
      include: {
        _count: { select: { tasks: true, members: true } },
        tasks: {
          where: { status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: "COMPLETED",
        completedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        deadline: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        OR: [{ creatorId: userId }, { projectId: { in: projectIds } }],
        startAt: { gte: todayStart, lte: upcomingEnd },
      },
      include: {
        project: { select: { id: true, nameUz: true, nameJa: true, color: true } },
      },
      orderBy: { startAt: "asc" },
      take: 4,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    getUserDefaultProjectId(userId),
    listSubjects(userId),
    listTags(userId),
  ]);

  const activeProjectsWithProgress = activeProjects.map((project) => {
    const totalTasks = project._count.tasks;
    const openTasks = project.tasks.length;
    const completed = totalTasks - openTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);

    return {
      id: project.id,
      nameUz: project.nameUz,
      nameJa: project.nameJa,
      color: project.color,
      status: project.status,
      memberCount: project._count.members,
      taskCount: totalTasks,
      progress,
    };
  });

  return {
    overdueTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    activeProjects: activeProjectsWithProgress,
    weeklyProgress: {
      completed: weeklyCompleted,
      due: weeklyDue,
      percent: weeklyDue === 0 ? 0 : Math.round((weeklyCompleted / weeklyDue) * 100),
    },
    calendarPreview,
    recentNotifications,
    defaultProjectId,
    lists,
    labels,
  };
}

export function getDashboardData(userId: string) {
  return unstable_cache(
    () => fetchDashboardData(userId),
    [`dashboard-${userId}`],
    { revalidate: 30 },
  )();
}

export type DashboardTask = Awaited<
  ReturnType<typeof fetchDashboardData>
>["overdueTasks"][number];
