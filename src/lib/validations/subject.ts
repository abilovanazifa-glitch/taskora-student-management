import { z } from "zod";

export const subjectSchema = z.object({
  nameUz: z.string().trim().min(2, "nameMinLength").max(80, "nameMaxLength"),
  nameJa: z.string().trim().min(2, "nameMinLength").max(80, "nameMaxLength"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "colorInvalid"),
});

export const subjectFilterSchema = z.object({
  search: z.string().trim().optional(),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
export type SubjectFilterInput = z.infer<typeof subjectFilterSchema>;

export type SubjectErrorCode =
  | "nameMinLength"
  | "nameMaxLength"
  | "colorInvalid"
  | "duplicateName"
  | "forbidden"
  | "notFound"
  | "saveFailed"
  | "deleteFailed"
  | "inUse";

export function mapSubjectZodErrors(
  error: z.ZodError,
): Partial<Record<string, SubjectErrorCode>> {
  const fieldErrors: Partial<Record<string, SubjectErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as SubjectErrorCode;
    }
  }

  return fieldErrors;
}
