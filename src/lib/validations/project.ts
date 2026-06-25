import { z } from "zod";

export const projectStatusSchema = z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]);

export const projectSchema = z.object({
  nameUz: z.string().trim().min(2, "nameMinLength").max(120, "nameMaxLength"),
  nameJa: z.string().trim().min(2, "nameMinLength").max(120, "nameMaxLength"),
  descriptionUz: z.string().trim().max(2000, "descriptionMaxLength"),
  descriptionJa: z.string().trim().max(2000, "descriptionMaxLength"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "colorInvalid"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: projectStatusSchema,
});

export const projectFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusSchema.or(z.literal("ALL")).optional(),
  sort: z.enum(["name", "startDate", "status", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;

export type ProjectErrorCode =
  | "nameMinLength"
  | "nameMaxLength"
  | "descriptionMaxLength"
  | "colorInvalid"
  | "endBeforeStart"
  | "forbidden"
  | "notFound"
  | "saveFailed"
  | "deleteFailed";

export function mapProjectZodErrors(error: z.ZodError): Partial<Record<string, ProjectErrorCode>> {
  const fieldErrors: Partial<Record<string, ProjectErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as ProjectErrorCode;
    }
  }

  return fieldErrors;
}
