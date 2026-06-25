"use client";

import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { TaskListItem } from "@/components/tasks/task-types";

export function useTaskDeepLink(tasks: TaskListItem[]) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const openTaskId = searchParams.get("task");
  const [manualSelectedTask, setManualSelectedTask] = useState<TaskListItem | null>(null);
  const [syncKey, setSyncKey] = useState<{ openTaskId: string | null; tasks: TaskListItem[] }>({
    openTaskId,
    tasks,
  });

  if (openTaskId !== syncKey.openTaskId || tasks !== syncKey.tasks) {
    setSyncKey({ openTaskId, tasks });

    if (openTaskId) {
      const match = tasks.find((task) => task.id === openTaskId);
      if (match) {
        setManualSelectedTask(match);
      }
    } else {
      setManualSelectedTask((current) => {
        if (!current) return null;
        return tasks.find((task) => task.id === current.id) ?? current;
      });
    }
  }

  const selectedTask = manualSelectedTask;

  function clearTaskFromUrl() {
    if (!openTaskId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setManualSelectedTask(null);
      clearTaskFromUrl();
    }
  }

  return {
    selectedTask,
    setSelectedTask: setManualSelectedTask,
    handleDialogOpenChange,
  };
}
