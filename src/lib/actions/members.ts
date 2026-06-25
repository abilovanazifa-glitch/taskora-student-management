"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError } from "@/lib/errors";
import { requireAuth, requireProjectAccess } from "@/lib/permissions/access";
import { getProjectRole } from "@/lib/permissions/project";
import {
  canChangeMemberRole,
  canLeaveProject,
  canRemoveMember,
  canTransferOwnership,
} from "@/lib/permissions/members";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications/create";
import {
  transferOwnershipSchema,
  updateMemberRoleSchema,
  type MemberErrorCode,
} from "@/lib/validations/member";

export type MemberActionState = {
  success: boolean;
  formError?: MemberErrorCode;
};

function revalidateMemberPaths(projectId: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/notifications");
}

async function getProjectWithMembers(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
}

export async function updateProjectMemberRole(
  projectId: string,
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  let session;
  let actorRole;
  try {
    ({ session, role: actorRole } = await requireProjectAccess(projectId, "manage_members"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const parsed = updateMemberRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { success: false, formError: "memberRequired" };
  }

  const member = await prisma.projectMember.findFirst({
    where: { id: parsed.data.memberId, projectId },
  });

  if (!member) {
    return { success: false, formError: "notFound" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return { success: false, formError: "notFound" };
  }

  if (
    !canChangeMemberRole(actorRole, member.role, parsed.data.role) ||
    member.userId === project.ownerId
  ) {
    return { success: false, formError: "forbidden" };
  }

  if (member.userId === session.user.id && actorRole === "OWNER") {
    return { success: false, formError: "forbidden" };
  }

  try {
    await prisma.projectMember.update({
      where: { id: member.id },
      data: { role: parsed.data.role },
    });

    if (member.userId !== session.user.id) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { nameUz: true, nameJa: true },
      });
      if (project) {
        await createUserNotification({
          userId: member.userId,
          type: "ROLE_CHANGED",
          titleUz: "Loyiha roli o'zgartirildi",
          titleJa: "プロジェクトのロールが変更されました",
          messageUz: `${project.nameUz} loyihasida rolingiz ${parsed.data.role} ga o'zgartirildi.`,
          messageJa: `${project.nameJa} プロジェクトのロールが ${parsed.data.role} に変更されました。`,
        });
      }
    }

    revalidateMemberPaths(projectId);
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
): Promise<MemberActionState> {
  let session;
  let actorRole;
  try {
    ({ session, role: actorRole } = await requireProjectAccess(projectId, "manage_members"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const project = await getProjectWithMembers(projectId);
  if (!project) {
    return { success: false, formError: "notFound" };
  }

  const member = project.members.find((entry) => entry.id === memberId);
  if (!member) {
    return { success: false, formError: "notFound" };
  }

  if (
    !canRemoveMember(
      actorRole,
      member.role,
      session.user.id,
      member.userId,
      project.ownerId,
    )
  ) {
    return { success: false, formError: "forbidden" };
  }

  try {
    await prisma.projectMember.delete({ where: { id: member.id } });
    revalidateMemberPaths(projectId);
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function leaveProject(projectId: string): Promise<MemberActionState> {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, formError: "forbidden" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { id: true, userId: true, role: true } } },
  });

  if (!project) {
    return { success: false, formError: "notFound" };
  }

  const role = getProjectRole(session.user.id, project);
  if (!canLeaveProject(role, session.user.id, project.ownerId)) {
    return { success: false, formError: "cannotLeaveAsOwner" };
  }

  const membership = project.members.find((member) => member.userId === session.user.id);
  if (!membership) {
    return { success: false, formError: "notFound" };
  }

  try {
    await prisma.projectMember.delete({ where: { id: membership.id } });
    revalidateMemberPaths(projectId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function transferProjectOwnership(
  projectId: string,
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  let session;
  let actorRole;
  try {
    ({ session, role: actorRole } = await requireProjectAccess(projectId, "edit_project"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  if (!canTransferOwnership(actorRole)) {
    return { success: false, formError: "forbidden" };
  }

  const parsed = transferOwnershipSchema.safeParse({
    newOwnerId: formData.get("newOwnerId"),
  });

  if (!parsed.success) {
    return { success: false, formError: "memberRequired" };
  }

  if (parsed.data.newOwnerId === session.user.id) {
    return { success: false, formError: "forbidden" };
  }

  const newOwnerMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: parsed.data.newOwnerId,
      },
    },
  });

  if (!newOwnerMember) {
    return { success: false, formError: "notFound" };
  }

  const currentOwnerMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  });

  if (!currentOwnerMember) {
    return { success: false, formError: "notFound" };
  }

  try {
    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { ownerId: parsed.data.newOwnerId },
      }),
      prisma.projectMember.update({
        where: { id: newOwnerMember.id },
        data: { role: "OWNER" },
      }),
      prisma.projectMember.update({
        where: { id: currentOwnerMember.id },
        data: { role: "ADMIN" },
      }),
    ]);

    revalidateMemberPaths(projectId);
    return { success: true };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}
