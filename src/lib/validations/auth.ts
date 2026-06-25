import { z } from "zod";
import { isValidAvatarUrl } from "@/lib/avatar";

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "passwordMinLength")
  .regex(/[A-Z]/, "passwordUppercase")
  .regex(/[a-z]/, "passwordLowercase")
  .regex(/[0-9]/, "passwordNumber");

export const preferredLanguageSchema = z.enum(["UZ", "JA", "EN"]);

export const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email("emailInvalid"))
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "passwordRequired"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "fullNameMinLength").max(120, "fullNameMaxLength"),
    email: z
      .string()
      .trim()
      .pipe(z.email("emailInvalid"))
      .transform((value) => value.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
    preferredLanguage: preferredLanguageSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "fullNameMinLength").max(120, "fullNameMaxLength"),
  avatarUrl: z
    .string()
    .trim()
    .refine((value) => isValidAvatarUrl(value), "avatarUrlInvalid"),
  preferredLanguage: preferredLanguageSchema,
  theme: themeSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export type AuthErrorCode =
  | "emailInvalid"
  | "emailTaken"
  | "passwordRequired"
  | "passwordMinLength"
  | "passwordUppercase"
  | "passwordLowercase"
  | "passwordNumber"
  | "passwordMismatch"
  | "confirmPasswordRequired"
  | "fullNameMinLength"
  | "fullNameMaxLength"
  | "avatarUrlInvalid"
  | "avatarUploadInvalid"
  | "avatarTooLarge"
  | "invalidCredentials"
  | "registrationFailed"
  | "profileUpdateFailed"
  | "unauthorized";

export function mapZodErrors(
  error: z.ZodError,
): Partial<Record<string, AuthErrorCode>> {
  const fieldErrors: Partial<Record<string, AuthErrorCode>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message as AuthErrorCode;
    }
  }

  return fieldErrors;
}
