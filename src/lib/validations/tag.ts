import { z } from "zod";

export const tagSchema = z.object({
  nameUz: z.string().trim().min(2, "nameMinLength").max(40, "nameMaxLength"),
  nameJa: z.string().trim().min(2, "nameMinLength").max(40, "nameMaxLength"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "colorInvalid"),
});

export const tagFilterSchema = z.object({
  search: z.string().trim().optional(),
});

export type TagInput = z.infer<typeof tagSchema>;
export type TagFilterInput = z.infer<typeof tagFilterSchema>;

export type TagErrorCode =
  | "nameMinLength"
  | "nameMaxLength"
  | "colorInvalid"
  | "duplicateName"
  | "forbidden"
  | "notFound"
  | "saveFailed"
  | "deleteFailed"
  | "inUse";

export function mapTagZodErrors(error: z.ZodError): Partial<Record<string, TagErrorCode>> {
  const fieldErrors: Partial<Record<string, TagErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as TagErrorCode;
    }
  }

  return fieldErrors;
}
