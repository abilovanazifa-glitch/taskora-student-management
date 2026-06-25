import bcrypt from "bcryptjs";
import type { PreferredLanguage, Theme } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const BCRYPT_ROUNDS = 12;

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  preferredLanguage: PreferredLanguage;
  theme: Theme;
  avatarUrl: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function authenticateUser(
  rawCredentials: unknown,
): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(rawCredentials);
  if (!parsed.success) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      preferredLanguage: true,
      theme: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    preferredLanguage: user.preferredLanguage,
    theme: user.theme,
    avatarUrl: user.avatarUrl,
  };
}

export function toAuthUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    fullName: user.fullName,
    preferredLanguage: user.preferredLanguage,
    theme: user.theme,
    avatarUrl: user.avatarUrl,
  };
}
