import type { ReminderOffsetType } from "@prisma/client";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type CalendarView = "month" | "week" | "day" | "list";

export function parseCalendarView(value?: string): CalendarView {
  if (value === "week" || value === "day" || value === "list") {
    return value;
  }
  return "month";
}

export function parseAnchorDate(value?: string, fallback = new Date()) {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function getCalendarRange(view: CalendarView, anchor: Date) {
  switch (view) {
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "week":
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    case "list":
      return { start: startOfDay(anchor), end: endOfDay(addDays(anchor, 30)) };
    case "month":
    default:
      return {
        start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
      };
  }
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: -1 | 1) {
  switch (view) {
    case "day":
      return addDays(anchor, direction);
    case "week":
      return addDays(anchor, direction * 7);
    case "list":
      return addDays(anchor, direction * 30);
    case "month":
    default:
      return addMonths(anchor, direction);
  }
}

export const REMINDER_OFFSET_OPTIONS: ReminderOffsetType[] = [
  "ONE_DAY_BEFORE",
  "THREE_HOURS_BEFORE",
  "ONE_HOUR_BEFORE",
  "CUSTOM",
];
