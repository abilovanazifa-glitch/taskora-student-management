import { describe, expect, it } from "vitest";
import {
  getCalendarRange,
  parseCalendarView,
  shiftAnchor,
} from "@/lib/calendar/views";

describe("calendar views", () => {
  const anchor = new Date("2026-06-15T12:00:00.000Z");

  it("parses view names safely", () => {
    expect(parseCalendarView("week")).toBe("week");
    expect(parseCalendarView("invalid")).toBe("month");
  });

  it("returns month grid range including leading and trailing days", () => {
    const range = getCalendarRange("month", anchor);
    expect(range.start.getTime()).toBeLessThanOrEqual(
      new Date("2026-06-01T00:00:00.000Z").getTime() + 7 * 86_400_000,
    );
    expect(range.end.getTime()).toBeGreaterThanOrEqual(
      new Date("2026-06-30T00:00:00.000Z").getTime(),
    );
  });

  it("shifts anchors by view", () => {
    const nextMonth = shiftAnchor("month", anchor, 1);
    expect(nextMonth.getMonth()).toBe(6);
    const nextWeek = shiftAnchor("week", anchor, 1);
    expect(nextWeek.getDate()).toBe(22);
  });
});
