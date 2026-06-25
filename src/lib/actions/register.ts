"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/credentials";
import {
  mapZodErrors,
  registerSchema,
  type AuthErrorCode,
} from "@/lib/validations/auth";

export type RegisterState = {
  success: boolean;
  fieldErrors?: Partial<Record<string, AuthErrorCode>>;
  formError?: AuthErrorCode;
};

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    preferredLanguage: formData.get("preferredLanguage"),
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      fieldErrors: { email: "emailTaken" },
    };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        preferredLanguage: parsed.data.preferredLanguage,
      },
    });

    return { success: true };
  } catch {
    return {
      success: false,
      formError: "registrationFailed",
    };
  }
}
