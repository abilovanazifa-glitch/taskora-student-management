import { describe, expect, it } from "vitest";
import { isTaskOverdue } from "@/lib/tasks/overdue";

describe("isTaskOverdue", () => {
  const now = new Date("2026-06-08T12:00:00.000Z");

  it("returns true for past deadlines on active tasks", () => {
    expect(isTaskOverdue(new Date("2026-06-07T12:00:00.000Z"), "TODO", now)).toBe(true);
  });

  it("returns false for completed tasks even with past deadlines", () => {
    expect(isTaskOverdue(new Date("2026-06-07T12:00:00.000Z"), "COMPLETED", now)).toBe(
      false,
    );
  });

  it("returns false when deadline is missing", () => {
    expect(isTaskOverdue(null, "IN_PROGRESS", now)).toBe(false);
  });
});
