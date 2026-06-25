"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError } from "@/lib/errors";
import { parseUtcDateTime } from "@/lib/calendar/timezone";
import { requireAuth, requireProjectAccess } from "@/lib/permissions/access";
import { hasProjectPermission, getProjectRole } from "@/lib/permissions/project";
import { prisma } from "@/lib/prisma";
import {
  calendarFilterSchema,
  eventMoveSchema,
  mapEventZodErrors,
  parseEventFormData,
  type CalendarFilterInput,
  type EventErrorCode,
} from "@/lib/validations/event";
import { syncRemindersForEvent } from "@/lib/reminders/sync";

export type EventActionState = {
  success: boolean;
  eventId?: string;
  fieldErrors?: Partial<Record<string, EventErrorCode>>;
  formError?: EventErrorCode;
};

export type QuickEventState = EventActionState;

function revalidateEventPaths(projectId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function parseCalendarFilters(
  searchParams: Record<string, string | undefined>,
): Promise<CalendarFilterInput> {
  const parsed = calendarFilterSchema.safeParse(searchParams);
  return parsed.success ? parsed.data : {};
}

async function canManageEvent(userId: string, event: {
  creatorId: string;
  projectId: string | null;
  project: { ownerId: string; members: { userId: string; role: Parameters<typeof getProjectRole>[1]["members"][number]["role"] }[] } | null;
}) {
  if (!event.projectId || !event.project) {
    return event.creatorId === userId;
  }

  const role = getProjectRole(userId, event.project);
  return hasProjectPermission(role, "manage_events");
}

async function getEventForAccess(eventId: string) {
  return prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: {
      project: {
        include: { members: { select: { userId: true, role: true } } },
      },
    },
  });
}

function validateRange(startAt: Date | null, endAt: Date | null): EventErrorCode | null {
  if (!startAt) return "startRequired";
  if (!endAt) return "endRequired";
  if (endAt < startAt) return "endBeforeStart";
  return null;
}

async function authorizeProjectEvent(projectId?: string) {
  if (!projectId) return;
  await requireProjectAccess(projectId, "manage_events");
}

export async function createQuickEvent(
  _prev: QuickEventState,
  formData: FormData,
): Promise<QuickEventState> {
  return createEvent(_prev, formData);
}

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapEventZodErrors(parsed.error) };
  }

  const startAt = parseUtcDateTime(parsed.data.startAt);
  const endAt = parseUtcDateTime(parsed.data.endAt);
  const rangeError = validateRange(startAt, endAt);
  if (rangeError) {
    return { success: false, formError: rangeError };
  }

  try {
    await authorizeProjectEvent(parsed.data.projectId);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "saveFailed" };
  }

  try {
    const event = await prisma.calendarEvent.create({
      data: {
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        descriptionUz: parsed.data.descriptionUz,
        descriptionJa: parsed.data.descriptionJa,
        startAt: startAt!,
        endAt: endAt!,
        allDay: parsed.data.allDay,
        locationUz: parsed.data.locationUz ?? null,
        locationJa: parsed.data.locationJa ?? null,
        projectId: parsed.data.projectId ?? null,
        creatorId: session.user.id,
      },
    });

    const offsets = formData.getAll("reminderOffsets").map(String);
    if (offsets.length > 0) {
      await syncRemindersForEvent(session.user.id, event.id, event.startAt, offsets);
    }

    revalidateEventPaths(event.projectId);
    return { success: true, eventId: event.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateEvent(
  eventId: string,
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await getEventForAccess(eventId);
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  if (!(await canManageEvent(session.user.id, existing))) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapEventZodErrors(parsed.error) };
  }

  const startAt = parseUtcDateTime(parsed.data.startAt);
  const endAt = parseUtcDateTime(parsed.data.endAt);
  const rangeError = validateRange(startAt, endAt);
  if (rangeError) {
    return { success: false, formError: rangeError };
  }

  try {
    await authorizeProjectEvent(parsed.data.projectId);
  } catch {
    return { success: false, formError: "forbidden" };
  }

  try {
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        titleUz: parsed.data.titleUz,
        titleJa: parsed.data.titleJa,
        descriptionUz: parsed.data.descriptionUz,
        descriptionJa: parsed.data.descriptionJa,
        startAt: startAt!,
        endAt: endAt!,
        allDay: parsed.data.allDay,
        locationUz: parsed.data.locationUz ?? null,
        locationJa: parsed.data.locationJa ?? null,
        projectId: parsed.data.projectId ?? null,
      },
    });

    const offsets = formData.getAll("reminderOffsets").map(String);
    await syncRemindersForEvent(session.user.id, event.id, event.startAt, offsets);

    revalidateEventPaths(event.projectId);
    if (existing.projectId !== event.projectId) {
      revalidateEventPaths(existing.projectId);
    }
    return { success: true, eventId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function deleteEvent(eventId: string): Promise<EventActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await getEventForAccess(eventId);
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  if (!(await canManageEvent(session.user.id, existing))) {
    return { success: false, formError: "forbidden" };
  }

  try {
    await prisma.calendarEvent.delete({ where: { id: eventId } });
    revalidateEventPaths(existing.projectId);
    return { success: true };
  } catch {
    return { success: false, formError: "deleteFailed" };
  }
}

export async function moveEvent(
  eventId: string,
  startAtInput: string,
  endAtInput: string,
): Promise<EventActionState> {
  return resizeEvent(eventId, startAtInput, endAtInput);
}

export async function resizeEvent(
  eventId: string,
  startAtInput: string,
  endAtInput: string,
): Promise<EventActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await getEventForAccess(eventId);
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  if (!(await canManageEvent(session.user.id, existing))) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = eventMoveSchema.safeParse({ startAt: startAtInput, endAt: endAtInput });
  if (!parsed.success) {
    return { success: false, formError: "saveFailed" };
  }

  const startAt = parseUtcDateTime(parsed.data.startAt);
  const endAt = parseUtcDateTime(parsed.data.endAt);
  const rangeError = validateRange(startAt, endAt);
  if (rangeError) {
    return { success: false, formError: rangeError };
  }

  try {
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: { startAt: startAt!, endAt: endAt! },
    });

    await syncRemindersForEvent(session.user.id, event.id, event.startAt, []);

    revalidateEventPaths(event.projectId);
    return { success: true, eventId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}
