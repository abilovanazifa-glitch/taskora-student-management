"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions/access";
import {
  mapTagZodErrors,
  tagFilterSchema,
  tagSchema,
  type TagErrorCode,
  type TagFilterInput,
} from "@/lib/validations/tag";

export type TagActionState = {
  success: boolean;
  tagId?: string;
  fieldErrors?: Partial<Record<string, TagErrorCode>>;
  formError?: TagErrorCode;
};

function revalidateTagPaths() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function parseTagFilters(
  searchParams: Record<string, string | undefined>,
): Promise<TagFilterInput> {
  const parsed = tagFilterSchema.safeParse(searchParams);
  return parsed.success ? parsed.data : {};
}

async function findDuplicateTag(
  ownerId: string,
  nameUz: string,
  nameJa: string,
  excludeId?: string,
) {
  return prisma.tag.findFirst({
    where: {
      ownerId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      OR: [
        { nameUz: { equals: nameUz, mode: "insensitive" } },
        { nameJa: { equals: nameJa, mode: "insensitive" } },
      ],
    },
  });
}

function parseTagForm(formData: FormData) {
  return tagSchema.safeParse({
    nameUz: formData.get("nameUz"),
    nameJa: formData.get("nameJa"),
    color: formData.get("color"),
  });
}

export async function createTag(
  _prev: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseTagForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTagZodErrors(parsed.error) };
  }

  const duplicate = await findDuplicateTag(
    session.user.id,
    parsed.data.nameUz,
    parsed.data.nameJa,
  );
  if (duplicate) {
    return { success: false, formError: "duplicateName" };
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        ...parsed.data,
        ownerId: session.user.id,
      },
    });

    revalidateTagPaths();
    return { success: true, tagId: tag.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateTag(
  tagId: string,
  _prev: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, ownerId: session.user.id },
  });
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  const parsed = parseTagForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapTagZodErrors(parsed.error) };
  }

  const duplicate = await findDuplicateTag(
    session.user.id,
    parsed.data.nameUz,
    parsed.data.nameJa,
    tagId,
  );
  if (duplicate) {
    return { success: false, formError: "duplicateName" };
  }

  try {
    await prisma.tag.update({
      where: { id: tagId },
      data: parsed.data,
    });

    revalidateTagPaths();
    return { success: true, tagId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function deleteTag(tagId: string): Promise<TagActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, ownerId: session.user.id },
  });
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  try {
    await prisma.tag.delete({ where: { id: tagId } });
    revalidateTagPaths();
    return { success: true };
  } catch {
    return { success: false, formError: "deleteFailed" };
  }
}
