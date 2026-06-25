import { describe, expect, it } from "vitest";
import {
  canMoveKanbanStatus,
  resolveCompletedAt,
} from "@/lib/tasks/status";

describe("resolveCompletedAt", () => {
  const now = new Date("2026-06-08T12:00:00.000Z");

  it("sets completedAt when marking complete", () => {
    const completedAt = resolveCompletedAt("COMPLETED", "IN_PROGRESS", null, now);
    expect(completedAt?.getTime()).toBe(now.getTime());
  });

  it("preserves existing completedAt when already complete", () => {
    const previous = new Date("2026-06-01T12:00:00.000Z");
    const completedAt = resolveCompletedAt("COMPLETED", "COMPLETED", previous, now);
    expect(completedAt?.getTime()).toBe(previous.getTime());
  });

  it("clears completedAt when reopening", () => {
    const completedAt = resolveCompletedAt(
      "TODO",
      "COMPLETED",
      new Date("2026-06-01T12:00:00.000Z"),
      now,
    );
    expect(completedAt).toBeNull();
  });
});

describe("canMoveKanbanStatus", () => {
  it("allows valid kanban transitions", () => {
    expect(canMoveKanbanStatus("TODO", "IN_PROGRESS")).toBe(true);
    expect(canMoveKanbanStatus("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("blocks non-kanban statuses", () => {
    expect(canMoveKanbanStatus("REVIEW", "COMPLETED")).toBe(false);
  });

  it("blocks cancelled and noop moves", () => {
    expect(canMoveKanbanStatus("TODO", "TODO")).toBe(false);
    expect(canMoveKanbanStatus("CANCELLED", "TODO")).toBe(false);
    expect(canMoveKanbanStatus("TODO", "CANCELLED")).toBe(false);
  });
});
