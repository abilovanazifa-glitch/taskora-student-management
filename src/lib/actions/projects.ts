"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { requireAuth, requireProjectAccess } from "@/lib/permissions/access";
import { buildProjectDates } from "@/lib/queries/projects";
import {
  mapProjectZodErrors,
  projectFilterSchema,
  projectSchema,
  type ProjectErrorCode,
} from "@/lib/validations/project";

export type ProjectActionState = {
  success: boolean;
  projectId?: string;
  fieldErrors?: Partial<Record<string, ProjectErrorCode>>;
  formError?: ProjectErrorCode;
};

function revalidateProjectPaths(projectId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    nameUz: formData.get("nameUz"),
    nameJa: formData.get("nameJa"),
    descriptionUz: formData.get("descriptionUz"),
    descriptionJa: formData.get("descriptionJa"),
    color: formData.get("color"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    status: formData.get("status"),
  });
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapProjectZodErrors(parsed.error) };
  }

  const dates = buildProjectDates(parsed.data);
  if (dates.startDate && dates.endDate && dates.endDate < dates.startDate) {
    return { success: false, formError: "endBeforeStart" };
  }

  try {
    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        ...dates,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    revalidateProjectPaths(project.id);
    return { success: true, projectId: project.id };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function updateProject(
  projectId: string,
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    await requireProjectAccess(projectId, "edit_project");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    if (error instanceof NotFoundError) {
      return { success: false, formError: "notFound" };
    }
    return { success: false, formError: "saveFailed" };
  }

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: mapProjectZodErrors(parsed.error) };
  }

  const dates = buildProjectDates(parsed.data);
  if (dates.startDate && dates.endDate && dates.endDate < dates.startDate) {
    return { success: false, formError: "endBeforeStart" };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { ...parsed.data, ...dates },
    });

    revalidateProjectPaths(projectId);
    return { success: true, projectId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function archiveProject(projectId: string): Promise<ProjectActionState> {
  try {
    await requireProjectAccess(projectId, "archive_project");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    if (error instanceof NotFoundError) {
      return { success: false, formError: "notFound" };
    }
    return { success: false, formError: "saveFailed" };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ARCHIVED" },
    });

    revalidateProjectPaths(projectId);
    return { success: true, projectId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function deleteProject(projectId: string): Promise<ProjectActionState> {
  try {
    await requireProjectAccess(projectId, "delete_project");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    if (error instanceof NotFoundError) {
      return { success: false, formError: "notFound" };
    }
    return { success: false, formError: "deleteFailed" };
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    revalidateProjectPaths();
    return { success: true };
  } catch {
    return { success: false, formError: "deleteFailed" };
  }
}

export async function parseProjectFilters(searchParams: Record<string, string | undefined>) {
  const parsed = projectFilterSchema.safeParse({
    search: searchParams.q,
    status: searchParams.status ?? "ALL",
    sort: searchParams.sort ?? "updatedAt",
    order: searchParams.order ?? "desc",
  });

  return parsed.success ? parsed.data : {};
}
