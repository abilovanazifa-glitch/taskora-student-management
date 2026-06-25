import { createUserNotification } from "@/lib/notifications/create";
import { syncRemindersForTask } from "@/lib/reminders/sync";

export async function notifyTaskAssigned(input: {
  assigneeId: string;
  titleUz: string;
  titleJa: string;
  taskId: string;
}) {
  await createUserNotification({
    userId: input.assigneeId,
    type: "TASK_ASSIGNED",
    titleUz: "Yangi vazifa tayinlandi",
    titleJa: "新しいタスクが割り当てられました",
    messageUz: `${input.titleUz} vazifasi sizga tayinlandi.`,
    messageJa: `${input.titleJa} タスクが割り当てられました。`,
    relatedTaskId: input.taskId,
  });
}

export async function notifyTaskUpdated(input: {
  userId: string;
  titleUz: string;
  titleJa: string;
  taskId: string;
}) {
  await createUserNotification({
    userId: input.userId,
    type: "TASK_UPDATED",
    titleUz: "Vazifa yangilandi",
    titleJa: "タスクが更新されました",
    messageUz: `${input.titleUz} vazifasi yangilandi.`,
    messageJa: `${input.titleJa} タスクが更新されました。`,
    relatedTaskId: input.taskId,
  });
}

export async function notifyTaskCompleted(input: {
  userId: string;
  titleUz: string;
  titleJa: string;
  taskId: string;
}) {
  await createUserNotification({
    userId: input.userId,
    type: "TASK_COMPLETED",
    titleUz: "Vazifa bajarildi",
    titleJa: "タスクが完了しました",
    messageUz: `${input.titleUz} vazifasi bajarildi.`,
    messageJa: `${input.titleJa} タスクが完了しました。`,
    relatedTaskId: input.taskId,
  });
}

export async function syncTaskReminders(
  userId: string,
  taskId: string,
  deadline: Date | null | undefined,
) {
  if (!deadline) return;
  await syncRemindersForTask(userId, taskId, deadline, [
    "ONE_DAY_BEFORE",
    "THREE_HOURS_BEFORE",
    "ONE_HOUR_BEFORE",
  ]);
}
