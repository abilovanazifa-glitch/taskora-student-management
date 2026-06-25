import { describe, expect, it } from "vitest";
import { taskFilterSchema, taskSchema } from "@/lib/validations/task";
import { subjectSchema } from "@/lib/validations/subject";
import { tagSchema } from "@/lib/validations/tag";

describe("taskSchema", () => {
  it("accepts full bilingual task input", () => {
    const parsed = taskSchema.safeParse({
      projectId: "project-1",
      titleUz: "Vazifa",
      titleJa: "タスク",
      descriptionUz: "Tavsif",
      descriptionJa: "説明",
      priority: "HIGH",
      status: "TODO",
      tagIds: ["tag-1"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing project", () => {
    const parsed = taskSchema.safeParse({
      titleUz: "Vazifa",
      titleJa: "タスク",
      descriptionUz: "",
      descriptionJa: "",
      priority: "MEDIUM",
      status: "TODO",
      tagIds: [],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("taskFilterSchema", () => {
  it("parses search and view params", () => {
    const parsed = taskFilterSchema.safeParse({
      search: "api",
      view: "kanban",
      overdueOnly: "true",
      page: "2",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.view).toBe("kanban");
      expect(parsed.data.page).toBe(2);
    }
  });
});

describe("subjectSchema", () => {
  it("validates bilingual subject names", () => {
    expect(
      subjectSchema.safeParse({
        nameUz: "Matematika",
        nameJa: "数学",
        color: "#10b981",
      }).success,
    ).toBe(true);
  });
});

describe("tagSchema", () => {
  it("validates tag colors", () => {
    expect(
      tagSchema.safeParse({
        nameUz: "Muhim",
        nameJa: "重要",
        color: "invalid",
      }).success,
    ).toBe(false);
  });
});
