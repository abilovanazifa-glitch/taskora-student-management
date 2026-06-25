import { describe, expect, it } from "vitest";
import { calendarFilterSchema, eventSchema } from "@/lib/validations/event";

describe("event validation", () => {
  it("accepts bilingual event input", () => {
    const parsed = eventSchema.safeParse({
      titleUz: "Yig'ilish",
      titleJa: "会議",
      descriptionUz: "Tavsif",
      descriptionJa: "説明",
      startAt: "2026-06-10T09:00:00.000Z",
      endAt: "2026-06-10T10:00:00.000Z",
      allDay: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("parses calendar filters", () => {
    const parsed = calendarFilterSchema.safeParse({
      view: "list",
      projectId: "project-1",
      showCompleted: "false",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.view).toBe("list");
      expect(parsed.data.showCompleted).toBe("false");
    }
  });
});
