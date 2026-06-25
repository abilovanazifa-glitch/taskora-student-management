"use client";

import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskActionsMenu } from "@/components/tasks/task-actions-menu";
import { TaskAssigneePicker } from "@/components/tasks/task-assignee-picker";
import { TaskCompleteToggle } from "@/components/tasks/task-complete-toggle";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskInlineTitle } from "@/components/tasks/task-inline-title";
import type { TaskListItem } from "@/components/tasks/task-types";
import { useTaskDeepLink } from "@/components/tasks/use-task-deep-link";
import { Button } from "@/components/ui/button";

type TaskTableProps = {
  locale: AppLocale;
  tasks: TaskListItem[];
  projects: {
    id: string;
    nameUz: string;
    nameJa: string;
    members: { id: string; fullName: string; avatarUrl: string | null }[];
  }[];
  subjects: { id: string; nameUz: string; nameJa: string; color: string }[];
  tags: { id: string; nameUz: string; nameJa: string; color: string }[];
};

export function TaskTable({ locale, tasks, projects, subjects, tags }: TaskTableProps) {
  const t = useTranslations("tasks.table");
  const tTasks = useTranslations("tasks");
  const dateLocale = getDateLocale(locale);
  const { selectedTask, setSelectedTask, handleDialogOpenChange } = useTaskDeepLink(tasks);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-base">
          <thead className="text-caption border-b border-border">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("title")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("project")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("status")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("priority")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("deadline")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">{t("assignee")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const members =
                projects.find((project) => project.id === task.projectId)?.members ?? [];

              return (
                <tr
                  key={task.id}
                  className="cursor-pointer border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-muted/20"
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest("button, input, textarea, [role='menu']")) return;
                    setSelectedTask(task);
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <TaskCompleteToggle
                        taskId={task.id}
                        status={task.status}
                        canEdit={task.permissions.canEdit}
                      />
                      <div className="min-w-0 space-y-1">
                        <TaskInlineTitle
                          taskId={task.id}
                          titleUz={task.titleUz}
                          titleJa={task.titleJa}
                          locale={locale}
                          canEdit={task.permissions.canEdit}
                          className={
                            task.status === "COMPLETED"
                              ? "text-muted-foreground line-through"
                              : undefined
                          }
                        />
                        {task.isOverdue ? (
                          <p className="text-form-error font-medium">{tTasks("overdue")}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="text-body-sm px-4 py-3">
                    {pickLocalized(locale, task.project.nameUz, task.project.nameJa)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      kind="task"
                      value={task.status}
                      label={tTasks(`statuses.${task.status}`)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      kind="priority"
                      value={task.priority}
                      label={tTasks(`priorities.${task.priority}`)}
                    />
                  </td>
                  <td className="text-body-sm px-4 py-3">
                    {task.deadline ? format(task.deadline, "PP", { locale: dateLocale }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TaskAssigneePicker
                      taskId={task.id}
                      assignee={task.assignee}
                      members={members}
                      canEdit={task.permissions.canEdit}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <TaskActionsMenu taskId={task.id} permissions={task.permissions} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTask ? (
        <TaskDetailDialog
          locale={locale}
          mode={selectedTask.permissions.canEdit ? "edit" : "view"}
          taskId={selectedTask.id}
          task={selectedTask}
          projects={projects}
          subjects={subjects}
          tags={tags}
          canEdit={selectedTask.permissions.canEdit}
          open={Boolean(selectedTask)}
          onOpenChange={handleDialogOpenChange}
        />
      ) : null}
    </>
  );
}
