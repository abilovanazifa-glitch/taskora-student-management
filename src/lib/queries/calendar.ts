import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessibleProjectIds } from "@/lib/permissions/access";
import { getProjectRole, hasProjectPermission } from "@/lib/permissions/project";
import { getCalendarRange, type CalendarView } from "@/lib/calendar/views";
import { isTaskOverdue } from "@/lib/tasks/overdue";
import type { CalendarFilterInput } from "@/lib/validations/event";

export type CalendarItemKind = "event" | "task";

export type CalendarItem = {
  id: string;
  kind: CalendarItemKind;
  titleUz: string;
  titleJa: string;
  descriptionUz: string;
  descriptionJa: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  projectId: string | null;
  subjectId: string | null;
  assigneeId: string | null;
  projectColor: string | null;
  subjectColor: string | null;
  projectNameUz: string | null;
  projectNameJa: string | null;
  subjectNameUz: string | null;
  subjectNameJa: string | null;
  isCompleted: boolean;
  isOverdue: boolean;
  canEdit: boolean;
  canDelete: boolean;
  locationUz: string | null;
  locationJa: string | null;
};

function taskEndAt(deadline: Date, startDate: Date | null) {
  if (startDate && startDate < deadline) {
    return deadline;
  }
  return deadline;
}

function taskStartAt(deadline: Date, startDate: Date | null) {
  return startDate ?? deadline;
}

export async function getCalendarData(
  userId: string,
  filters: CalendarFilterInput & { view: CalendarView; anchor: Date },
) {
  const projectIds = await getAccessibleProjectIds(userId);
  const { start, end } = getCalendarRange(filters.view, filters.anchor);
  const showCompleted = filters.showCompleted !== "false";
  const now = new Date();

  const filteredProjectIds = filters.projectId
    ? projectIds.filter((id) => id === filters.projectId)
    : projectIds;

  const eventWhere: Prisma.CalendarEventWhereInput = {
    startAt: { lte: end },
    endAt: { gte: start },
    OR: [{ creatorId: userId }, { projectId: { in: filteredProjectIds } }],
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
  };

  const taskWhere: Prisma.TaskWhereInput = {
    projectId: { in: filteredProjectIds },
    deadline: { not: null, gte: start, lte: end },
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(!showCompleted ? { status: { notIn: ["COMPLETED", "CANCELLED"] } } : {}),
  };

  const [events, tasks, projects, subjects, assignees] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: eventWhere,
      include: {
        project: { select: { id: true, nameUz: true, nameJa: true, color: true, ownerId: true, members: { select: { userId: true, role: true } } } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { id: true, nameUz: true, nameJa: true, color: true, ownerId: true, members: { select: { userId: true, role: true } } } },
        subject: { select: { id: true, nameUz: true, nameJa: true, color: true } },
        assignee: { select: { id: true, fullName: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, nameUz: true, nameJa: true, color: true },
      orderBy: { nameJa: "asc" },
    }),
    prisma.subject.findMany({
      where: { ownerId: userId },
      select: { id: true, nameUz: true, nameJa: true, color: true },
      orderBy: { nameJa: "asc" },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { projectMembers: { some: { projectId: { in: projectIds } } } },
          { ownedProjects: { some: { id: { in: projectIds } } } },
        ],
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const eventItems: CalendarItem[] = events.map((event) => {
    const canManage = event.project
      ? hasProjectPermission(getProjectRole(userId, event.project), "manage_events")
      : event.creatorId === userId;

    return {
      id: event.id,
      kind: "event",
      titleUz: event.titleUz,
      titleJa: event.titleJa,
      descriptionUz: event.descriptionUz,
      descriptionJa: event.descriptionJa,
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: event.allDay,
      projectId: event.projectId,
      subjectId: null,
      assigneeId: null,
      projectColor: event.project?.color ?? null,
      subjectColor: null,
      projectNameUz: event.project?.nameUz ?? null,
      projectNameJa: event.project?.nameJa ?? null,
      subjectNameUz: null,
      subjectNameJa: null,
      isCompleted: false,
      isOverdue: false,
      canEdit: canManage,
      canDelete: canManage,
      locationUz: event.locationUz,
      locationJa: event.locationJa,
    };
  });

  const taskItems: CalendarItem[] = tasks
    .filter((task) => task.deadline)
    .map((task) => {
      const deadline = task.deadline!;
      const startAt = taskStartAt(deadline, task.startDate);
      const endAt = taskEndAt(deadline, task.startDate);

      return {
        id: task.id,
        kind: "task" as const,
        titleUz: task.titleUz,
        titleJa: task.titleJa,
        descriptionUz: task.descriptionUz,
        descriptionJa: task.descriptionJa,
        startAt,
        endAt,
        allDay: true,
        projectId: task.projectId,
        subjectId: task.subjectId,
        assigneeId: task.assigneeId,
        projectColor: task.project.color,
        subjectColor: task.subject?.color ?? null,
        projectNameUz: task.project.nameUz,
        projectNameJa: task.project.nameJa,
        subjectNameUz: task.subject?.nameUz ?? null,
        subjectNameJa: task.subject?.nameJa ?? null,
        isCompleted: task.status === "COMPLETED",
        isOverdue: isTaskOverdue(deadline, task.status, now),
        canEdit: false,
        canDelete: false,
        locationUz: null,
        locationJa: null,
      };
    });

  const items = [...eventItems, ...taskItems].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );

  return {
    items,
    range: { start, end },
    projects,
    subjects,
    assignees,
    creatableProjects: projects,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
