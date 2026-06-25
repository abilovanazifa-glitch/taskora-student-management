"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions/access";

export type NotificationActionState = {
  success: boolean;
  formError?: "forbidden" | "notFound" | "saveFailed";
};

function revalidateNotificationPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

async function getOwnedNotification(notificationId: string, userId: string) {
  return prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
}

export async function markNotificationRead(notificationId: string): Promise<NotificationActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const notification = await getOwnedNotification(notificationId, session.user.id);
  if (!notification) {
    return { success: false, formError: "notFound" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidateNotificationPaths();
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<NotificationActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidateNotificationPaths();
  return { success: true };
}

export async function deleteNotification(notificationId: string): Promise<NotificationActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const notification = await getOwnedNotification(notificationId, session.user.id);
  if (!notification) {
    return { success: false, formError: "notFound" };
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  revalidateNotificationPaths();
  return { success: true };
}
