"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { CalendarView } from "@/lib/calendar/views";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";

type CalendarFiltersProps = {
  locale: AppLocale;
  view: CalendarView;
  date: string;
  projectId: string;
  subjectId: string;
  assigneeId: string;
  showCompleted: boolean;
  projects: { id: string; nameUz: string; nameJa: string }[];
  subjects: { id: string; nameUz: string; nameJa: string }[];
  assignees: { id: string; fullName: string }[];
};

export function CalendarFilters(props: CalendarFiltersProps) {
  const t = useTranslations("calendar.filters");
  const router = useRouter();
  const pathname = usePathname();

  function navigate(next: Partial<CalendarFiltersProps>) {
    const merged = { ...props, ...next };
    const params = new URLSearchParams();
    if (merged.view !== "month") params.set("view", merged.view);
    if (merged.date) params.set("date", merged.date.slice(0, 10));
    if (merged.projectId) params.set("project", merged.projectId);
    if (merged.subjectId) params.set("subject", merged.subjectId);
    if (merged.assigneeId) params.set("assignee", merged.assigneeId);
    if (!merged.showCompleted) params.set("completed", "false");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2 xl:grid-cols-4">
      <FilterSelect
        id="calendar-project"
        label={t("project")}
        value={props.projectId || "ALL"}
        onChange={(value) => navigate({ projectId: value === "ALL" ? "" : value })}
        options={[
          { value: "ALL", label: t("allProjects") },
          ...props.projects.map((project) => ({
            value: project.id,
            label: pickLocalized(props.locale, project.nameUz, project.nameJa),
          })),
        ]}
      />
      <FilterSelect
        id="calendar-subject"
        label={t("subject")}
        value={props.subjectId || "ALL"}
        onChange={(value) => navigate({ subjectId: value === "ALL" ? "" : value })}
        options={[
          { value: "ALL", label: t("allSubjects") },
          ...props.subjects.map((subject) => ({
            value: subject.id,
            label: pickLocalized(props.locale, subject.nameUz, subject.nameJa),
          })),
        ]}
      />
      <FilterSelect
        id="calendar-assignee"
        label={t("assignee")}
        value={props.assigneeId || "ALL"}
        onChange={(value) => navigate({ assigneeId: value === "ALL" ? "" : value })}
        options={[
          { value: "ALL", label: t("allAssignees") },
          ...props.assignees.map((assignee) => ({
            value: assignee.id,
            label: assignee.fullName,
          })),
        ]}
      />
      <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-4">
        <Button
          type="button"
          variant={props.showCompleted ? "outline" : "default"}
          className="cursor-pointer"
          onClick={() => navigate({ showCompleted: !props.showCompleted })}
        >
          {props.showCompleted ? t("hideCompleted") : t("showCompleted")}
        </Button>
        <Button type="button" variant="ghost" className="cursor-pointer" onClick={() => router.replace(pathname)}>
          {t("reset")}
        </Button>
      </div>
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
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id} className="w-full cursor-pointer">
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

export function CalendarViewTabs({
  view,
}: {
  view: CalendarView;
}) {
  const t = useTranslations("calendar.views");
  const router = useRouter();
  const pathname = usePathname();

  function setView(nextView: CalendarView) {
    const params = new URLSearchParams(window.location.search);
    if (nextView === "month") params.delete("view");
    else params.set("view", nextView);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const tabs: CalendarView[] = ["month", "week", "day", "list"];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab}
          type="button"
          size="sm"
          variant={view === tab ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setView(tab)}
        >
          {t(tab)}
        </Button>
      ))}
    </div>
  );
}

export function CalendarNavigation({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const t = useTranslations("calendar.navigation");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={onPrev}>
          {t("previous")}
        </Button>
        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={onToday}>
          {t("today")}
        </Button>
        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={onNext}>
          {t("next")}
        </Button>
      </div>
      <h2 className="text-lg font-semibold">{label}</h2>
    </div>
  );
}
