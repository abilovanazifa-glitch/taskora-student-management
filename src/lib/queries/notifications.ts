import { prisma } from "@/lib/prisma";

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      relatedTask: {
        select: { id: true, titleUz: true, titleJa: true, projectId: true },
      },
      relatedEvent: {
        select: { id: true, titleUz: true, titleJa: true, projectId: true },
      },
    },
  });
}

export async function getNotificationSummary(userId: string) {
  const [items, unreadCount] = await Promise.all([
    listNotifications(userId, 50),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount };
}
