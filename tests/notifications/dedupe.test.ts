import { describe, expect, it } from "vitest";
import { buildNotificationDedupeKey } from "@/lib/calendar/timezone";

describe("notification dedupe keys", () => {
  it("prevents duplicate daily notifications for the same target", () => {
    const first = buildNotificationDedupeKey({
      userId: "user-1",
      type: "DEADLINE_REMINDER",
      relatedTaskId: "task-1",
      bucket: "2026-06-08",
    });
    const second = buildNotificationDedupeKey({
      userId: "user-1",
      type: "DEADLINE_REMINDER",
      relatedTaskId: "task-1",
      bucket: "2026-06-08",
    });
    const nextDay = buildNotificationDedupeKey({
      userId: "user-1",
      type: "DEADLINE_REMINDER",
      relatedTaskId: "task-1",
      bucket: "2026-06-09",
    });

    expect(first).toBe(second);
    expect(first).not.toBe(nextDay);
  });
});
