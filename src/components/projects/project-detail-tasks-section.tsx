"use client";

import { TaskQuickAdd } from "@/components/tasks/task-quick-add";

type ProjectDetailTasksSectionProps = {
  projectId: string;
  lists: { id: string; nameUz: string; nameJa: string; color: string }[];
  labels: { id: string; nameUz: string; nameJa: string; color: string }[];
  canCreateTask: boolean;
};

export function ProjectDetailTasksSection({
  projectId,
  lists,
  labels,
  canCreateTask,
}: ProjectDetailTasksSectionProps) {
  if (!canCreateTask) {
    return null;
  }

  return (
    <TaskQuickAdd
      projectId={projectId}
      lists={lists}
      labels={labels}
      defaultListId={lists[0]?.id}
    />
  );
}
