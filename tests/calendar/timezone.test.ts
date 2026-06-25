import { describe, expect, it } from "vitest";
import {
  buildNotificationDedupeKey,
  buildReminderDedupeKey,
  computeReminderAt,
} from "@/lib/calendar/timezone";

describe("calendar timezone helpers", () => {
  const target = new Date("2026-06-10T15:00:00.000Z");

  it("computes standard reminder offsets in UTC", () => {
    const oneDay = computeReminderAt(target, "ONE_DAY_BEFORE");
    expect(oneDay?.toISOString()).toBe("2026-06-09T15:00:00.000Z");
    const oneHour = computeReminderAt(target, "ONE_HOUR_BEFORE");
    expect(oneHour?.toISOString()).toBe("2026-06-10T14:00:00.000Z");
  });

  it("builds stable dedupe keys", () => {
    const remindAt = new Date("2026-06-09T15:00:00.000Z");
    expect(
      buildReminderDedupeKey({
        userId: "user-1",
        targetType: "TASK",
        targetId: "task-1",
        offsetType: "ONE_DAY_BEFORE",
        remindAt,
      }),
    ).toBe("user-1:TASK:task-1:ONE_DAY_BEFORE:2026-06-09T15:00:00.000Z");

    expect(
      buildNotificationDedupeKey({
        userId: "user-1",
        type: "TASK_OVERDUE",
        relatedTaskId: "task-1",
        bucket: "2026-06-08",
      }),
    ).toBe("user-1:TASK_OVERDUE:task-1::2026-06-08");
  });
});
