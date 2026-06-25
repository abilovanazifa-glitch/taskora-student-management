"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions/access";
import {
  mapSubjectZodErrors,
  subjectFilterSchema,
  subjectSchema,
  type SubjectErrorCode,
  type SubjectFilterInput,
} from "@/lib/validations/subject";

export type SubjectActionState = {
  success: boolean;
  subjectId?: string;
  fieldErrors?: Partial<Record<string, SubjectErrorCode>>;
  formError?: SubjectErrorCode;
};

function revalidateSubjectPaths() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function parseSubjectFilters(
  searchParams: Record<string, string | undefined>,
): Promise<SubjectFilterInput> {
  const parsed = subjectFilterSchema.safeParse(searchParams);
  return parsed.success ? parsed.data : {};
}

async function findDuplicateSubject(
  ownerId: string,
  nameUz: string,
  nameJa: string,
  excludeId?: string,
) {
  return prisma.subject.findFirst({
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

function parseSubjectForm(formData: FormData) {
  return subjectSchema.safeParse({
    nameUz: formData.get("nameUz"),
    nameJa: formData.get("nameJa"),
    color: formData.get("color"),
  });
}

export async function createSubject(
  _prev: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseSubjectForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapSubjectZodErrors(parsed.error) };
  }

  const duplicate = await findDuplicateSubject(
    session.user.id,
    parsed.data.nameUz,
    parsed.data.nameJa,
  );
  if (duplicate) {
    return { success: false, formError: "duplicateName" };
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        ownerId: session.user.id,
      },
    });

    revalidateSubjectPaths();
    return { success: true, subjectId: subject.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateSubject(
  subjectId: string,
  _prev: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, ownerId: session.user.id },
  });
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  const parsed = parseSubjectForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapSubjectZodErrors(parsed.error) };
  }

  const duplicate = await findDuplicateSubject(
    session.user.id,
    parsed.data.nameUz,
    parsed.data.nameJa,
    subjectId,
  );
  if (duplicate) {
    return { success: false, formError: "duplicateName" };
  }

  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: parsed.data,
    });

    revalidateSubjectPaths();
    return { success: true, subjectId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function deleteSubject(subjectId: string): Promise<SubjectActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, ownerId: session.user.id },
    include: { _count: { select: { tasks: true } } },
  });
  if (!existing) {
    return { success: false, formError: "notFound" };
  }

  try {
    await prisma.subject.delete({ where: { id: subjectId } });
    revalidateSubjectPaths();
    return { success: true };
  } catch {
    return { success: false, formError: "deleteFailed" };
  }
}

const LIST_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"] as const;

export async function createListQuick(
  name: string,
  _locale: "uz" | "ja" | "en",
): Promise<SubjectActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { success: false, formError: "nameMinLength" };
  }

  const duplicate = await findDuplicateSubject(session.user.id, trimmed, trimmed);
  if (duplicate) {
    return { success: true, subjectId: duplicate.id };
  }

  const existingCount = await prisma.subject.count({ where: { ownerId: session.user.id } });
  const color = LIST_COLORS[existingCount % LIST_COLORS.length];

  try {
    const subject = await prisma.subject.create({
      data: {
        nameUz: trimmed,
        nameJa: trimmed,
        color,
        ownerId: session.user.id,
      },
    });

    revalidateSubjectPaths();
    return { success: true, subjectId: subject.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}
