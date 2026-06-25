import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildNotificationDedupeKey,
  getDateBucket,
} from "@/lib/calendar/timezone";

type NotificationContent = {
  titleUz: string;
  titleJa: string;
  messageUz: string;
  messageJa: string;
};

type CreateNotificationInput = NotificationContent & {
  userId: string;
  type: NotificationType;
  relatedTaskId?: string | null;
  relatedEventId?: string | null;
  scheduledAt?: Date | null;
  dedupeKey?: string | null;
};

export async function createUserNotification(input: CreateNotificationInput) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey: input.dedupeKey },
    });
    if (existing) {
      return existing;
    }
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      titleUz: input.titleUz,
      titleJa: input.titleJa,
      messageUz: input.messageUz,
      messageJa: input.messageJa,
      relatedTaskId: input.relatedTaskId ?? null,
      relatedEventId: input.relatedEventId ?? null,
      scheduledAt: input.scheduledAt ?? null,
      sentAt: input.scheduledAt ? null : new Date(),
      dedupeKey: input.dedupeKey ?? null,
    },
  });
}

export async function createDedupedDailyNotification(
  input: Omit<CreateNotificationInput, "dedupeKey"> & { bucket?: string },
) {
  const bucket = input.bucket ?? getDateBucket();
  const dedupeKey = buildNotificationDedupeKey({
    userId: input.userId,
    type: input.type,
    relatedTaskId: input.relatedTaskId,
    relatedEventId: input.relatedEventId,
    bucket,
  });

  return createUserNotification({ ...input, dedupeKey });
}

export function preferredLanguageToContentLocale(language: "UZ" | "JA") {
  return language === "UZ" ? "uz" : "ja";
}
