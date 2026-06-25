import type { ReminderOffsetType } from "@prisma/client";
import { subDays, subHours } from "date-fns";

export function parseUtcDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toUtcIso(date: Date) {
  return date.toISOString();
}

export function computeReminderAt(
  targetAt: Date,
  offsetType: ReminderOffsetType,
  customAt?: Date | null,
) {
  switch (offsetType) {
    case "ONE_DAY_BEFORE":
      return subDays(targetAt, 1);
    case "THREE_HOURS_BEFORE":
      return subHours(targetAt, 3);
    case "ONE_HOUR_BEFORE":
      return subHours(targetAt, 1);
    case "CUSTOM":
      return customAt ?? null;
    default:
      return null;
  }
}

export function buildReminderDedupeKey(input: {
  userId: string;
  targetType: "TASK" | "EVENT";
  targetId: string;
  offsetType: ReminderOffsetType;
  remindAt: Date;
}) {
  return `${input.userId}:${input.targetType}:${input.targetId}:${input.offsetType}:${input.remindAt.toISOString()}`;
}

export function buildNotificationDedupeKey(input: {
  userId: string;
  type: string;
  relatedTaskId?: string | null;
  relatedEventId?: string | null;
  bucket: string;
}) {
  return `${input.userId}:${input.type}:${input.relatedTaskId ?? ""}:${input.relatedEventId ?? ""}:${input.bucket}`;
}

export function getDateBucket(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
