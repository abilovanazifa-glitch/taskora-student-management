"use server";

import type { PreferredLanguage, Theme } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updatePreferredLanguagePreference(language: PreferredLanguage) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLanguage: language },
  });

  return { success: true as const };
}

export async function updateThemePreference(theme: Theme) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { theme },
  });

  return { success: true as const };
}
