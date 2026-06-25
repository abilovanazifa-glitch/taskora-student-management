"use client";



import { format } from "date-fns";

import { getDateLocale } from "@/lib/i18n/date-locale";

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

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";



type TaskCardGridProps = {

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



export function TaskCardGrid({ locale, tasks, projects, subjects, tags }: TaskCardGridProps) {

  const t = useTranslations("tasks.card");

  const tTasks = useTranslations("tasks");

  const dateLocale = getDateLocale(locale);

  const { selectedTask, setSelectedTask, handleDialogOpenChange } = useTaskDeepLink(tasks);



  return (

    <>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {tasks.map((task) => {

          const members =

            projects.find((project) => project.id === task.projectId)?.members ?? [];



          return (

            <Card

              key={task.id}

              className="flex cursor-pointer flex-col ring-1 ring-border/60 transition-colors duration-200 hover:bg-muted/20"

              onClick={(event) => {

                const target = event.target as HTMLElement;

                if (target.closest("button, input, textarea, [role='menu']")) return;

                setSelectedTask(task);

              }}

            >

              <CardHeader className="space-y-3">

                <div className="flex items-start gap-2.5">

                  <TaskCompleteToggle

                    taskId={task.id}

                    status={task.status}

                    canEdit={task.permissions.canEdit}

                  />

                  <div className="min-w-0 flex-1 space-y-2">

                    <div className="flex items-start justify-between gap-2">

                      <TaskInlineTitle

                        taskId={task.id}

                        titleUz={task.titleUz}

                        titleJa={task.titleJa}

                        locale={locale}

                        canEdit={task.permissions.canEdit}

                      />

                      <TaskActionsMenu taskId={task.id} permissions={task.permissions} />

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <StatusBadge kind="task" value={task.status} label={tTasks(`statuses.${task.status}`)} />

                      <StatusBadge kind="priority" value={task.priority} label={tTasks(`priorities.${task.priority}`)} />

                      {task.isOverdue ? <Badge variant="destructive">{tTasks("overdue")}</Badge> : null}

                    </div>

                  </div>

                </div>

              </CardHeader>

              <CardContent className="mt-auto space-y-3">

                <p className="text-caption">

                  {pickLocalized(locale, task.project.nameUz, task.project.nameJa)}

                </p>

                <div className="flex items-center justify-between gap-2">

                  <div className="text-caption flex flex-wrap gap-3">

                    <span>

                      {t("deadline")}:{" "}

                      {task.deadline ? format(task.deadline, "PP", { locale: dateLocale }) : "—"}

                    </span>

                  </div>

                  <TaskAssigneePicker

                    taskId={task.id}

                    assignee={task.assignee}

                    members={members}

                    canEdit={task.permissions.canEdit}

                  />

                </div>

              </CardContent>

            </Card>

          );

        })}

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


