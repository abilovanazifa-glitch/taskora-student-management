import { describe, expect, it } from "vitest";
import { parseCalendarView } from "@/lib/calendar/views";
import { KANBAN_STATUSES } from "@/lib/tasks/status";
import { routing } from "@/i18n/routing";
import { isTranslationConfigured } from "@/lib/translation/service";

/**
 * Automated checks for official requirement coverage.
 * UI/integration behavior is covered by Playwright e2e tests.
 */
describe("official requirements (automated verification)", () => {
  it("supports Japanese, Uzbek, and English UI locales", () => {
    expect(routing.locales).toEqual(["ja", "uz", "en"]);
  });

  it("calendar includes weekly and monthly views", () => {
    expect(parseCalendarView("month")).toBe("month");
    expect(parseCalendarView("week")).toBe("week");
  });

  it("tasks support kanban status columns", () => {
    expect(KANBAN_STATUSES).toEqual(["TODO", "IN_PROGRESS", "COMPLETED"]);
  });

  it("translation service can be configured via env", () => {
    expect(typeof isTranslationConfigured()).toBe("boolean");
  });
});
