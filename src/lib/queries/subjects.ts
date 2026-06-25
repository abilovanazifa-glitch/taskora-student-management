import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubjectFilterInput } from "@/lib/validations/subject";

export async function listSubjects(userId: string, filters: SubjectFilterInput = {}) {
  const search = filters.search?.trim();

  const where: Prisma.SubjectWhereInput = {
    ownerId: userId,
    ...(search
      ? {
          OR: [
            { nameUz: { contains: search, mode: "insensitive" } },
            { nameJa: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.subject.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });
}

export async function getSubjectById(subjectId: string, userId: string) {
  return prisma.subject.findFirst({
    where: { id: subjectId, ownerId: userId },
    include: {
      _count: { select: { tasks: true } },
    },
  });
}
