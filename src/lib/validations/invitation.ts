import { z } from "zod";

export const invitableRoleSchema = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email("emailInvalid"))
    .transform((value) => value.toLowerCase()),
  role: invitableRoleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export type InvitationErrorCode =
  | "emailInvalid"
  | "roleInvalid"
  | "forbidden"
  | "notFound"
  | "alreadyMember"
  | "duplicateInvitation"
  | "expired"
  | "invalidToken"
  | "emailMismatch"
  | "saveFailed"
  | "alreadyHandled";

export function mapInvitationZodErrors(
  error: z.ZodError,
): Partial<Record<string, InvitationErrorCode>> {
  const fieldErrors: Partial<Record<string, InvitationErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as InvitationErrorCode;
    }
  }

  return fieldErrors;
}
