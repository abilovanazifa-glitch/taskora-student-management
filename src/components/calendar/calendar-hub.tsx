"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { moveEvent } from "@/lib/actions/events";
import { shiftAnchor, type CalendarView } from "@/lib/calendar/views";
import type { CalendarItem } from "@/lib/queries/calendar";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { CalendarEventQuickDialog } from "@/components/calendar/calendar-event-quick-dialog";
import {
  CalendarEventFormSheet,
  toDateTimeLocalValue,
} from "@/components/calendar/calendar-event-form-sheet";
import {
  CalendarFilters,
  CalendarNavigation,
  CalendarViewTabs,
} from "@/components/calendar/calendar-filters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarHubProps = {
  locale: AppLocale;
  view: CalendarView;
  anchor: Date;
  items: CalendarItem[];
  projects: { id: string; nameUz: string; nameJa: string }[];
  subjects: { id: string; nameUz: string; nameJa: string }[];
  assignees: { id: string; fullName: string }[];
  filters: {
    projectId: string;
    subjectId: string;
    assigneeId: string;
    showCompleted: boolean;
  };
};

export function CalendarHub({
  locale,
  view,
  anchor,
  items,
  projects,
  subjects,
  assignees,
  filters,
}: CalendarHubProps) {
  const t = useTranslations("calendar");
  const dateLocale = getDateLocale(locale);
  const router = useRouter();
  const pathname = usePathname();
  const dateIso = anchor.toISOString();

  const label =
    view === "month"
      ? format(anchor, "yyyy MMMM", { locale: dateLocale })
      : view === "week"
        ? t("weekLabel", {
            start: format(addDays(anchor, -((anchor.getDay() + 6) % 7)), "PP", { locale: dateLocale }),
          })
        : view === "day"
          ? format(anchor, "PPPP", { locale: dateLocale })
          : t("listLabel");

  function navigateAnchor(next: Date) {
    const params = new URLSearchParams(window.location.search);
    params.set("date", next.toISOString().slice(0, 10));
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="page-section">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CalendarViewTabs view={view} />
        <CalendarEventQuickDialog
          locale={locale}
          projects={projects}
          trigger={<Button className="cursor-pointer">{t("createEvent")}</Button>}
        />
      </div>

      <CalendarNavigation
        label={label}
        onPrev={() => navigateAnchor(shiftAnchor(view, anchor, -1))}
        onNext={() => navigateAnchor(shiftAnchor(view, anchor, 1))}
        onToday={() => navigateAnchor(new Date())}
      />

      <CalendarFilters
        locale={locale}
        view={view}
        date={dateIso}
        projectId={filters.projectId}
        subjectId={filters.subjectId}
        assigneeId={filters.assigneeId}
        showCompleted={filters.showCompleted}
        projects={projects}
        subjects={subjects}
        assignees={assignees}
      />

      {view === "month" ? (
        <MonthView locale={locale} anchor={anchor} items={items} projects={projects} />
      ) : null}
      {view === "week" ? (
        <WeekView locale={locale} anchor={anchor} items={items} projects={projects} />
      ) : null}
      {view === "day" ? (
        <DayView locale={locale} anchor={anchor} items={items} projects={projects} />
      ) : null}
      {view === "list" ? (
        <ListView locale={locale} items={items} projects={projects} />
      ) : null}
    </div>
  );
}

function itemStyles(item: CalendarItem) {
  const color = item.subjectColor ?? item.projectColor ?? "#6366f1";
  return {
    borderColor: color,
    backgroundColor: item.isOverdue
      ? "color-mix(in oklab, #ef4444 18%, transparent)"
      : item.isCompleted
        ? "color-mix(in oklab, var(--muted) 70%, transparent)"
        : `color-mix(in oklab, ${color} 18%, transparent)`,
  };
}

function CalendarItemChip({
  locale,
  item,
  projects,
  compact = false,
}: {
  locale: AppLocale;
  item: CalendarItem;
  projects: { id: string; nameUz: string; nameJa: string }[];
  compact?: boolean;
}) {
  const t = useTranslations("calendar");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resizing, setResizing] = useState(false);

  const title = pickLocalized(locale, item.titleUz, item.titleJa);

  const chip = (
    <div
      draggable={item.kind === "event" && item.canEdit && !isPending}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/calendar-item-id", item.id);
        event.dataTransfer.setData("text/calendar-item-kind", item.kind);
      }}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-body-sm",
        item.kind === "task" && "border-dashed",
        compact ? "truncate" : "space-y-1",
        item.canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default",
      )}
      style={itemStyles(item)}
    >
      <p className="font-medium">{title}</p>
      {!compact ? (
        <div className="text-caption flex flex-wrap gap-2">
          {item.isOverdue ? <span className="text-destructive">{t("overdue")}</span> : null}
          {item.isCompleted ? <span>{t("completed")}</span> : null}
          {item.kind === "task" ? <span>{t("taskDeadline")}</span> : null}
        </div>
      ) : null}
      {item.kind === "event" && item.canEdit && !compact ? (
        <div
          className="mt-1 h-1.5 cursor-ns-resize rounded bg-current/30"
          onMouseDown={() => setResizing(true)}
          onMouseUp={() => {
            if (!resizing) return;
            setResizing(false);
            const endAt = new Date(item.endAt.getTime() + 30 * 60_000);
            startTransition(async () => {
              await moveEvent(item.id, item.startAt.toISOString(), endAt.toISOString());
              router.refresh();
            });
          }}
          aria-label={t("resize")}
        />
      ) : null}
    </div>
  );

  if (item.kind === "event" && item.canEdit) {
    return (
      <CalendarEventFormSheet
        locale={locale}
        eventId={item.id}
        canDelete={item.canDelete}
        projects={projects}
        initialValues={{
          projectId: item.projectId ?? "",
          titleUz: item.titleUz,
          titleJa: item.titleJa,
          descriptionUz: item.descriptionUz,
          descriptionJa: item.descriptionJa,
          startAt: toDateTimeLocalValue(item.startAt),
          endAt: toDateTimeLocalValue(item.endAt),
          allDay: item.allDay,
          locationUz: item.locationUz ?? "",
          locationJa: item.locationJa ?? "",
        }}
        trigger={chip}
      />
    );
  }

  return chip;
}

function MonthView({
  locale,
  anchor,
  items,
  projects,
}: {
  locale: AppLocale;
  anchor: Date;
  items: CalendarItem[];
  projects: { id: string; nameUz: string; nameJa: string }[];
}) {
  const dateLocale = getDateLocale(locale);
  const days = useMemo(() => {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridStart = addDays(start, -((start.getDay() + 6) % 7));
    const gridEnd = addDays(end, 6 - ((end.getDay() + 6) % 7));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [anchor]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="grid min-w-[720px] grid-cols-7">
        {days.map((day) => {
          const dayItems = items.filter((item) => isSameDay(item.startAt, day) || isSameDay(item.endAt, day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-r border-b border-border p-2",
                !isSameMonth(day, anchor) && "bg-muted/20",
              )}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/calendar-item-id");
                const kind = event.dataTransfer.getData("text/calendar-item-kind");
                const target = items.find((item) => item.id === id && item.kind === kind);
                if (target?.kind === "event") {
                  const duration = target.endAt.getTime() - target.startAt.getTime();
                  const startAt = new Date(day);
                  startAt.setHours(target.startAt.getHours(), target.startAt.getMinutes(), 0, 0);
                  const endAt = new Date(startAt.getTime() + duration);
                  void moveEvent(target.id, startAt.toISOString(), endAt.toISOString());
                }
              }}
            >
              <div className={cn("text-body-sm mb-2 font-medium", isToday(day) && "text-primary")}>
                {format(day, "d", { locale: dateLocale })}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <CalendarItemChip key={`${item.kind}-${item.id}`} locale={locale} item={item} projects={projects} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView(props: Omit<MonthViewProps, never>) {
  return <MonthView {...props} />;
}

function DayView(props: Omit<MonthViewProps, never>) {
  const dayItems = props.items.filter((item) => isSameDay(item.startAt, props.anchor));
  const dateLocale = getDateLocale(props.locale);

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <p className="text-caption">{format(props.anchor, "PPPP", { locale: dateLocale })}</p>
      <div className="space-y-2">
        {dayItems.map((item) => (
          <CalendarItemChip key={`${item.kind}-${item.id}`} locale={props.locale} item={item} projects={props.projects} />
        ))}
      </div>
    </div>
  );
}

type MonthViewProps = {
  locale: AppLocale;
  anchor: Date;
  items: CalendarItem[];
  projects: { id: string; nameUz: string; nameJa: string }[];
};

function ListView({
  locale,
  items,
  projects,
}: {
  locale: AppLocale;
  items: CalendarItem[];
  projects: { id: string; nameUz: string; nameJa: string }[];
}) {
  const t = useTranslations("calendar");
  const dateLocale = getDateLocale(locale);

  if (items.length === 0) {
    return <p className="text-caption rounded-xl border border-dashed border-border p-8 text-center">{t("empty")}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.kind}-${item.id}`} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <CalendarItemChip locale={locale} item={item} projects={projects} />
          <span className="text-caption">
            {format(item.startAt, "PPp", { locale: dateLocale })}
          </span>
        </div>
      ))}
    </div>
  );
}
