import { z } from "zod";

export const eventSchema = z.object({
  projectId: z.string().optional(),
  titleUz: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  titleJa: z.string().trim().min(2, "titleMinLength").max(200, "titleMaxLength"),
  descriptionUz: z.string().trim().max(5000, "descriptionMaxLength"),
  descriptionJa: z.string().trim().max(5000, "descriptionMaxLength"),
  startAt: z.string().min(1, "startRequired"),
  endAt: z.string().min(1, "endRequired"),
  allDay: z.coerce.boolean().default(false),
  locationUz: z.string().trim().max(200).optional(),
  locationJa: z.string().trim().max(200).optional(),
});

export const quickEventSchema = eventSchema.pick({
  projectId: true,
  titleUz: true,
  titleJa: true,
  startAt: true,
  endAt: true,
  allDay: true,
});

export const eventMoveSchema = z.object({
  startAt: z.string().min(1, "startRequired"),
  endAt: z.string().min(1, "endRequired"),
});

export const calendarFilterSchema = z.object({
  view: z.enum(["month", "week", "day", "list"]).optional(),
  date: z.string().optional(),
  projectId: z.string().optional(),
  subjectId: z.string().optional(),
  assigneeId: z.string().optional(),
  showCompleted: z.enum(["true", "false"]).optional(),
});

export const reminderSchema = z.object({
  targetType: z.enum(["TASK", "EVENT"]),
  targetId: z.string().min(1, "targetRequired"),
  offsetType: z.enum([
    "ONE_DAY_BEFORE",
    "THREE_HOURS_BEFORE",
    "ONE_HOUR_BEFORE",
    "CUSTOM",
  ]),
  customAt: z.string().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
export type CalendarFilterInput = z.infer<typeof calendarFilterSchema>;

export type EventErrorCode =
  | "titleMinLength"
  | "titleMaxLength"
  | "descriptionMaxLength"
  | "startRequired"
  | "endRequired"
  | "endBeforeStart"
  | "forbidden"
  | "notFound"
  | "saveFailed"
  | "deleteFailed";

export function mapEventZodErrors(error: z.ZodError): Partial<Record<string, EventErrorCode>> {
  const fieldErrors: Partial<Record<string, EventErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as EventErrorCode;
    }
  }

  return fieldErrors;
}

export function parseEventFormData(formData: FormData) {
  const projectId = formData.get("projectId");
  return eventSchema.safeParse({
    projectId: projectId && projectId !== "none" ? projectId : undefined,
    titleUz: formData.get("titleUz"),
    titleJa: formData.get("titleJa"),
    descriptionUz: formData.get("descriptionUz") ?? "",
    descriptionJa: formData.get("descriptionJa") ?? "",
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    allDay: formData.get("allDay") === "on" || formData.get("allDay") === "true",
    locationUz: formData.get("locationUz") || undefined,
    locationJa: formData.get("locationJa") || undefined,
  });
}
