"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import {
  AVATAR_MAX_BYTES,
  avatarExtensionFromMime,
  resolveAvatarMimeType,
} from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import {
  mapZodErrors,
  profileUpdateSchema,
  type AuthErrorCode,
} from "@/lib/validations/auth";

export type ProfileUpdateState = {
  success: boolean;
  data?: {
    fullName: string;
    preferredLanguage: "UZ" | "JA" | "EN";
    theme: "LIGHT" | "DARK" | "SYSTEM";
    avatarUrl: string | null;
  };
  fieldErrors?: Partial<Record<string, AuthErrorCode>>;
  formError?: AuthErrorCode;
};

export type AvatarUploadState = {
  success: boolean;
  avatarUrl?: string;
  formError?: AuthErrorCode;
};

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

async function deleteStoredAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", avatarUrl.replace(/^\//, ""));
  try {
    await unlink(filePath);
  } catch {
    // File may already be removed.
  }
}

export async function uploadProfileAvatar(formData: FormData): Promise<AvatarUploadState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, formError: "unauthorized" };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, formError: "avatarUploadInvalid" };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { success: false, formError: "avatarTooLarge" };
  }

  const mimeType = resolveAvatarMimeType(file);
  if (!mimeType) {
    return { success: false, formError: "avatarUploadInvalid" };
  }

  const extension = avatarExtensionFromMime(mimeType);
  if (!extension) {
    return { success: false, formError: "avatarUploadInvalid" };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    await mkdir(AVATAR_DIR, { recursive: true });

    const fileName = `${session.user.id}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(AVATAR_DIR, fileName), buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    if (existing?.avatarUrl && existing.avatarUrl !== avatarUrl) {
      await deleteStoredAvatar(existing.avatarUrl);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return { success: true, avatarUrl };
  } catch {
    return { success: false, formError: "profileUpdateFailed" };
  }
}

export async function removeProfileAvatar(): Promise<AvatarUploadState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, formError: "unauthorized" };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    await deleteStoredAvatar(existing?.avatarUrl);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    });

    return { success: true, avatarUrl: "" };
  } catch {
    return { success: false, formError: "profileUpdateFailed" };
  }
}

export async function updateProfile(
  _prevState: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      formError: "unauthorized",
    };
  }

  const avatarUrlRaw = formData.get("avatarUrl");
  const parsed = profileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: typeof avatarUrlRaw === "string" ? avatarUrlRaw : "",
    preferredLanguage: formData.get("preferredLanguage"),
    theme: formData.get("theme"),
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  try {
    const avatarUrl = parsed.data.avatarUrl ? parsed.data.avatarUrl : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: parsed.data.fullName,
        avatarUrl,
        preferredLanguage: parsed.data.preferredLanguage,
        theme: parsed.data.theme,
      },
    });

    return {
      success: true,
      data: {
        fullName: parsed.data.fullName,
        preferredLanguage: parsed.data.preferredLanguage,
        theme: parsed.data.theme,
        avatarUrl,
      },
    };
  } catch {
    return {
      success: false,
      formError: "profileUpdateFailed",
    };
  }
}

export async function getProfileUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      preferredLanguage: true,
      theme: true,
      createdAt: true,
    },
  });
}
