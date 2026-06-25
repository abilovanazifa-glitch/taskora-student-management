import { prisma } from "@/lib/prisma";
import { createDedupedDailyNotification } from "@/lib/notifications/create";
import { isTaskOverdue } from "@/lib/tasks/overdue";

const ACTIVE_TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW"] as const;

export async function processDueReminders(now = new Date()) {
  const dueReminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now },
      sentAt: null,
    },
    include: {
      task: {
        include: {
          project: { select: { nameUz: true, nameJa: true } },
        },
      },
      event: {
        include: {
          project: { select: { nameUz: true, nameJa: true } },
        },
      },
    },
    take: 200,
  });

  let sent = 0;

  for (const reminder of dueReminders) {
    if (reminder.task) {
      await createDedupedDailyNotification({
        userId: reminder.userId,
        type: "DEADLINE_REMINDER",
        titleUz: "Muddat yaqinlashmoqda",
        titleJa: "締切が近づいています",
        messageUz: `${reminder.task.titleUz} vazifasi muddati yaqinlashmoqda.`,
        messageJa: `${reminder.task.titleJa} タスクの締切が近づいています。`,
        relatedTaskId: reminder.task.id,
      });
    } else if (reminder.event) {
      await createDedupedDailyNotification({
        userId: reminder.userId,
        type: "EVENT_UPCOMING",
        titleUz: "Tadbir yaqinlashmoqda",
        titleJa: "イベントが近づいています",
        messageUz: `${reminder.event.titleUz} tadbiriga vaqt qoldi.`,
        messageJa: `${reminder.event.titleJa} イベントが近づいています。`,
        relatedEventId: reminder.event.id,
      });
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sentAt: now },
    });
    sent += 1;
  }

  return sent;
}

export async function processOverdueTasks(now = new Date()) {
  const overdueTasks = await prisma.task.findMany({
    where: {
      deadline: { lt: now },
      status: { in: [...ACTIVE_TASK_STATUSES] },
      assigneeId: { not: null },
    },
    include: {
      assignee: { select: { id: true } },
      project: { select: { nameUz: true, nameJa: true } },
    },
    take: 200,
  });

  let sent = 0;

  for (const task of overdueTasks) {
    if (!task.assigneeId || !task.deadline || !isTaskOverdue(task.deadline, task.status, now)) {
      continue;
    }

    await createDedupedDailyNotification({
      userId: task.assigneeId,
      type: "TASK_OVERDUE",
      titleUz: "Muddat o'tdi",
      titleJa: "期限切れタスク",
      messageUz: `${task.titleUz} vazifasi muddati o'tdi.`,
      messageJa: `${task.titleJa} タスクが期限切れです。`,
      relatedTaskId: task.id,
    });
    sent += 1;
  }

  return sent;
}

export async function runScheduledJobs(now = new Date()) {
  const [remindersSent, overdueSent] = await Promise.all([
    processDueReminders(now),
    processOverdueTasks(now),
  ]);

  return { remindersSent, overdueSent };
}
