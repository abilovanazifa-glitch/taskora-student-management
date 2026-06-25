"use client";

import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";

type TaskFilterOption = {
  id: string;
  nameUz: string;
  nameJa: string;
};

type TaskFiltersProps = {
  locale: AppLocale;
  search: string;
  projectId: string;
  subjectId: string;
  assigneeId: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  tagId: string;
  overdueOnly: boolean;
  sort: "deadline" | "priority" | "status" | "createdAt" | "title";
  order: "asc" | "desc";
  view: "table" | "card" | "kanban";
  projects: TaskFilterOption[];
  subjects: TaskFilterOption[];
  tags: TaskFilterOption[];
  assignees: { id: string; fullName: string }[];
  hideProjectFilter?: boolean;
};

function pickName(locale: AppLocale, uz: string, ja: string) {
  return pickLocalized(locale, uz, ja);
}

function countActiveFilters(props: TaskFiltersProps) {
  let count = 0;
  if (props.search) count += 1;
  if (!props.hideProjectFilter && props.projectId) count += 1;
  if (props.subjectId) count += 1;
  if (props.assigneeId) count += 1;
  if (props.status !== "ALL") count += 1;
  if (props.priority !== "ALL") count += 1;
  if (props.tagId) count += 1;
  if (props.overdueOnly) count += 1;
  return count;
}

export function TaskFilters(props: TaskFiltersProps) {
  const t = useTranslations("tasks.filters");
  const tTasks = useTranslations("tasks");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(countActiveFilters(props) > 0);
  const activeCount = countActiveFilters(props);

  function navigate(next: Partial<TaskFiltersProps> & Pick<TaskFiltersProps, "view">) {
    const merged = { ...props, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("q", merged.search);
    if (merged.projectId) params.set("project", merged.projectId);
    if (merged.subjectId) params.set("subject", merged.subjectId);
    if (merged.assigneeId) params.set("assignee", merged.assigneeId);
    if (merged.status !== "ALL") params.set("status", merged.status);
    if (merged.priority !== "ALL") params.set("priority", merged.priority);
    if (merged.tagId) params.set("tag", merged.tagId);
    if (merged.overdueOnly) params.set("overdue", "true");
    if (merged.sort !== "createdAt") params.set("sort", merged.sort);
    if (merged.order !== "desc") params.set("order", merged.order);
    if (merged.view !== "table") params.set("view", merged.view);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="bg-card bento-card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="text-primary size-4" />
          <span className="text-base font-medium">{t("title")}</span>
          {activeCount > 0 ? (
            <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-body-sm font-semibold">
              {activeCount}
            </span>
          ) : null}
        </div>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open ? (
        <form
          className="grid gap-4 border-t border-border p-4 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            navigate({
              ...props,
              search: String(formData.get("q") ?? ""),
            });
          }}
        >
          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <Label htmlFor="task-search">{t("search")}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="task-search"
                name="q"
                defaultValue={props.search}
                placeholder={t("searchPlaceholder")}
                className="bg-background pl-9"
              />
            </div>
          </div>

          {!props.hideProjectFilter ? (
            <FilterSelect
              id="task-project"
              label={t("project")}
              value={props.projectId || "ALL"}
              onChange={(value) => navigate({ ...props, projectId: value === "ALL" ? "" : value })}
              options={[
                { value: "ALL", label: t("allProjects") },
                ...props.projects.map((project) => ({
                  value: project.id,
                  label: pickName(props.locale, project.nameUz, project.nameJa),
                })),
              ]}
            />
          ) : null}

          <FilterSelect
            id="task-subject"
            label={t("subject")}
            value={props.subjectId || "ALL"}
            onChange={(value) => navigate({ ...props, subjectId: value === "ALL" ? "" : value })}
            options={[
              { value: "ALL", label: t("allSubjects") },
              ...props.subjects.map((subject) => ({
                value: subject.id,
                label: pickName(props.locale, subject.nameUz, subject.nameJa),
              })),
            ]}
          />

          <FilterSelect
            id="task-assignee"
            label={t("assignee")}
            value={props.assigneeId || "ALL"}
            onChange={(value) => navigate({ ...props, assigneeId: value === "ALL" ? "" : value })}
            options={[
              { value: "ALL", label: t("allAssignees") },
              ...props.assignees.map((assignee) => ({
                value: assignee.id,
                label: assignee.fullName,
              })),
            ]}
          />

          <FilterSelect
            id="task-status"
            label={t("status")}
            value={props.status}
            onChange={(value) =>
              navigate({ ...props, status: value as TaskStatus | "ALL" })
            }
            options={[
              { value: "ALL", label: t("allStatuses") },
              ...(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"] as const).map(
                (value) => ({
                  value,
                  label: tTasks(`statuses.${value}`),
                }),
              ),
            ]}
          />

          <FilterSelect
            id="task-priority"
            label={t("priority")}
            value={props.priority}
            onChange={(value) =>
              navigate({ ...props, priority: value as TaskPriority | "ALL" })
            }
            options={[
              { value: "ALL", label: t("allPriorities") },
              ...(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((value) => ({
                value,
                label: tTasks(`priorities.${value}`),
              })),
            ]}
          />

          <FilterSelect
            id="task-tag"
            label={t("tag")}
            value={props.tagId || "ALL"}
            onChange={(value) => navigate({ ...props, tagId: value === "ALL" ? "" : value })}
            options={[
              { value: "ALL", label: t("allTags") },
              ...props.tags.map((tag) => ({
                value: tag.id,
                label: pickName(props.locale, tag.nameUz, tag.nameJa),
              })),
            ]}
          />

          <FilterSelect
            id="task-sort"
            label={t("sort")}
            value={`${props.sort}:${props.order}`}
            onChange={(value) => {
              if (!value) return;
              const [sort, order] = value.split(":") as [TaskFiltersProps["sort"], TaskFiltersProps["order"]];
              navigate({ ...props, sort, order });
            }}
            options={[
              { value: "createdAt:desc", label: t("sortCreatedDesc") },
              { value: "deadline:asc", label: t("sortDeadlineAsc") },
              { value: "deadline:desc", label: t("sortDeadlineDesc") },
              { value: "priority:desc", label: t("sortPriorityDesc") },
              { value: "status:asc", label: t("sortStatusAsc") },
              { value: "title:asc", label: t("sortTitleAsc") },
            ]}
          />

          <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-4">
            <Button
              type="button"
              variant={props.overdueOnly ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => navigate({ ...props, overdueOnly: !props.overdueOnly })}
            >
              {t("overdueOnly")}
            </Button>
            <Button type="submit" className="cursor-pointer">
              {t("apply")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => router.replace(pathname)}
            >
              {t("reset")}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-caption">
        {label}
      </Label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id} className="bg-background w-full cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
