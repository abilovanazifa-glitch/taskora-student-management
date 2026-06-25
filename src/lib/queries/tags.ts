import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TagFilterInput } from "@/lib/validations/tag";

export async function listTags(userId: string, filters: TagFilterInput = {}) {
  const search = filters.search?.trim();

  const where: Prisma.TagWhereInput = {
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

  return prisma.tag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });
}

export async function getTagById(tagId: string, userId: string) {
  return prisma.tag.findFirst({
    where: { id: tagId, ownerId: userId },
    include: {
      _count: { select: { tasks: true } },
    },
  });
}
