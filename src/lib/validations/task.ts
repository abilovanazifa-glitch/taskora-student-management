import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "CANCELLED",
]);

export const quickTaskSchema = z.object({
  projectId: z.string().min(1, "projectRequired"),
  titleUz: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  titleJa: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  deadline: z.string().optional(),
  priority: taskPrioritySchema.default("MEDIUM"),
});

export const taskSchema = z.object({
  projectId: z.string().min(1, "projectRequired"),
  titleUz: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  titleJa: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  descriptionUz: z.string().trim().max(5000, "descriptionMaxLength"),
  descriptionJa: z.string().trim().max(5000, "descriptionMaxLength"),
  subjectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
});

export const taskStatusUpdateSchema = z.object({
  status: taskStatusSchema,
});

export const kanbanQuickTaskSchema = z.object({
  projectId: z.string().min(1, "projectRequired"),
  title: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  status: taskStatusSchema.default("TODO"),
  locale: z.enum(["uz", "ja", "en"]),
  subjectId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  deadline: z.string().optional(),
});

export const inlineTaskTitleSchema = z.object({
  title: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  locale: z.enum(["uz", "ja", "en"]),
});

export const taskFilterSchema = z.object({
  search: z.string().trim().optional(),
  projectId: z.string().optional(),
  subjectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: taskStatusSchema.or(z.literal("ALL")).optional(),
  priority: taskPrioritySchema.or(z.literal("ALL")).optional(),
  tagId: z.string().optional(),
  overdueOnly: z.enum(["true", "false"]).optional(),
  sort: z.enum(["deadline", "priority", "status", "createdAt", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  view: z.enum(["table", "card", "kanban"]).optional(),
});

export type QuickTaskInput = z.infer<typeof quickTaskSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;

export type TaskErrorCode =
  | "projectRequired"
  | "titleMinLength"
  | "titleMaxLength"
  | "descriptionMaxLength"
  | "subjectInvalid"
  | "assigneeInvalid"
  | "tagInvalid"
  | "forbidden"
  | "notFound"
  | "saveFailed"
  | "deleteFailed";

export function mapTaskZodErrors(error: z.ZodError): Partial<Record<string, TaskErrorCode>> {
  const fieldErrors: Partial<Record<string, TaskErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as TaskErrorCode;
    }
  }

  return fieldErrors;
}

export function parseTaskFormData(formData: FormData) {
  const subjectId = formData.get("subjectId");
  const assigneeId = formData.get("assigneeId");

  return taskSchema.safeParse({
    projectId: formData.get("projectId"),
    titleUz: formData.get("titleUz"),
    titleJa: formData.get("titleJa"),
    descriptionUz: formData.get("descriptionUz") ?? "",
    descriptionJa: formData.get("descriptionJa") ?? "",
    subjectId: subjectId && subjectId !== "none" ? subjectId : undefined,
    assigneeId: assigneeId && assigneeId !== "none" ? assigneeId : undefined,
    priority: formData.get("priority"),
    status: formData.get("status"),
    startDate: formData.get("startDate") || undefined,
    deadline: formData.get("deadline") || undefined,
    tagIds: formData.getAll("tagIds").map(String).filter(Boolean),
  });
}
