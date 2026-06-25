import type { ReminderOffsetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildReminderDedupeKey,
  computeReminderAt,
  parseUtcDateTime,
} from "@/lib/calendar/timezone";

const STANDARD_OFFSETS: ReminderOffsetType[] = [
  "ONE_DAY_BEFORE",
  "THREE_HOURS_BEFORE",
  "ONE_HOUR_BEFORE",
];

function parseOffset(value: string): ReminderOffsetType | null {
  if (
    value === "ONE_DAY_BEFORE" ||
    value === "THREE_HOURS_BEFORE" ||
    value === "ONE_HOUR_BEFORE" ||
    value === "CUSTOM"
  ) {
    return value;
  }
  return null;
}

export async function syncRemindersForTask(
  userId: string,
  taskId: string,
  deadline: Date,
  offsets: string[],
  customAtInput?: string,
) {
  await prisma.reminder.deleteMany({ where: { userId, taskId } });

  const rows = buildReminderRows({
    userId,
    targetType: "TASK",
    targetId: taskId,
    targetAt: deadline,
    offsets,
    customAtInput,
  });

  if (rows.length === 0) return;

  await prisma.reminder.createMany({ data: rows, skipDuplicates: true });
}

export async function syncRemindersForEvent(
  userId: string,
  eventId: string,
  startAt: Date,
  offsets: string[],
  customAtInput?: string,
) {
  if (offsets.length === 0) {
    return;
  }

  await prisma.reminder.deleteMany({ where: { userId, eventId } });

  const rows = buildReminderRows({
    userId,
    targetType: "EVENT",
    targetId: eventId,
    targetAt: startAt,
    offsets,
    customAtInput,
  });

  if (rows.length === 0) return;

  await prisma.reminder.createMany({ data: rows, skipDuplicates: true });
}

function buildReminderRows(input: {
  userId: string;
  targetType: "TASK" | "EVENT";
  targetId: string;
  targetAt: Date;
  offsets: string[];
  customAtInput?: string;
}) {
  const customAt = input.customAtInput ? parseUtcDateTime(input.customAtInput) : null;
  const parsedOffsets = input.offsets
    .map(parseOffset)
    .filter((value): value is ReminderOffsetType => value !== null);

  const uniqueOffsets = [...new Set(parsedOffsets.length > 0 ? parsedOffsets : STANDARD_OFFSETS)];

  return uniqueOffsets
    .map((offsetType) => {
      const remindAt = computeReminderAt(
        input.targetAt,
        offsetType,
        offsetType === "CUSTOM" ? customAt : null,
      );

      if (!remindAt || remindAt.getTime() >= input.targetAt.getTime()) {
        return null;
      }

      const dedupeKey = buildReminderDedupeKey({
        userId: input.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        offsetType,
        remindAt,
      });

      return {
        userId: input.userId,
        targetType: input.targetType,
        taskId: input.targetType === "TASK" ? input.targetId : null,
        eventId: input.targetType === "EVENT" ? input.targetId : null,
        offsetType,
        customAt: offsetType === "CUSTOM" ? customAt : null,
        remindAt,
        dedupeKey,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
