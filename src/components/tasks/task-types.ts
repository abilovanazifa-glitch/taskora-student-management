import type { listTasks } from "@/lib/queries/tasks";

export type TaskListItem = Awaited<ReturnType<typeof listTasks>>["items"][number];
export type TaskPageData = Awaited<ReturnType<typeof listTasks>>;

export function taskToFormValues(task: TaskListItem) {
  return {
    projectId: task.projectId,
    titleUz: task.titleUz,
    titleJa: task.titleJa,
    descriptionUz: task.descriptionUz,
    descriptionJa: task.descriptionJa,
    subjectId: task.subjectId ?? "",
    assigneeId: task.assigneeId ?? "",
    priority: task.priority,
    status: task.status,
    startDate: task.startDate?.toISOString().slice(0, 10) ?? "",
    deadline: task.deadline?.toISOString().slice(0, 10) ?? "",
    tagIds: task.tags.map((entry) => entry.tagId),
  };
}
