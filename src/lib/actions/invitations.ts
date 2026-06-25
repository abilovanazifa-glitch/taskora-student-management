"use server";

import { revalidatePath } from "next/cache";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  buildInvitationUrl,
  generateInvitationToken,
  getInvitationExpiresAt,
  isInvitationExpired,
} from "@/lib/invitations/token";
import { createUserNotification } from "@/lib/notifications/create";
import { requireAuth, requireProjectAccess } from "@/lib/permissions/access";
import { canInviteWithRole, canManageMembers } from "@/lib/permissions/members";
import { prisma } from "@/lib/prisma";
import {
  inviteMemberSchema,
  mapInvitationZodErrors,
  type InvitationErrorCode,
} from "@/lib/validations/invitation";

export type InvitationActionState = {
  success: boolean;
  invitationLink?: string;
  fieldErrors?: Partial<Record<string, InvitationErrorCode>>;
  formError?: InvitationErrorCode;
};

export type InvitationResponseState = {
  success: boolean;
  projectId?: string;
  formError?: InvitationErrorCode;
};

function revalidateInvitationPaths(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/notifications");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function inviteProjectMember(
  projectId: string,
  locale: string,
  _prev: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  let session;
  try {
    ({ session } = await requireProjectAccess(projectId, "manage_members"));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    if (error instanceof NotFoundError) {
      return { success: false, formError: "notFound" };
    }
    return { success: false, formError: "saveFailed" };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: mapInvitationZodErrors(parsed.error) };
  }

  if (!canInviteWithRole(parsed.data.role)) {
    return { success: false, formError: "roleInvalid" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      return { success: false, formError: "alreadyMember" };
    }
  }

  const duplicateInvitation = await prisma.invitation.findFirst({
    where: {
      projectId,
      invitedEmail: parsed.data.email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (duplicateInvitation) {
    return { success: false, formError: "duplicateInvitation" };
  }

  const token = generateInvitationToken();
  const expiresAt = getInvitationExpiresAt();

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { nameUz: true, nameJa: true },
    });

    if (!project) {
      return { success: false, formError: "notFound" };
    }

    await prisma.invitation.create({
      data: {
        projectId,
        inviterId: session.user.id,
        invitedEmail: parsed.data.email,
        role: parsed.data.role,
        token,
        expiresAt,
      },
    });

    if (existingUser) {
      await createUserNotification({
        userId: existingUser.id,
        type: "PROJECT_INVITATION",
        titleUz: "Loyiha taklifi",
        titleJa: "プロジェクトへの招待",
        messageUz: `${project.nameUz} loyihasiga ${parsed.data.role} sifatida taklif qilindingiz.`,
        messageJa: `${project.nameJa} プロジェクトに ${parsed.data.role} として招待されました。`,
      });
    }

    revalidateInvitationPaths(projectId);

    return {
      success: true,
      invitationLink: buildInvitationUrl(locale, token),
    };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function cancelProjectInvitation(
  projectId: string,
  invitationId: string,
): Promise<InvitationActionState> {
  try {
    await requireProjectAccess(projectId, "manage_members");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, formError: "forbidden" };
    }
    return { success: false, formError: "notFound" };
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, projectId, status: "PENDING" },
  });

  if (!invitation) {
    return { success: false, formError: "notFound" };
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED" },
  });

  revalidateInvitationPaths(projectId);
  return { success: true };
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      project: {
        select: {
          id: true,
          nameUz: true,
          nameJa: true,
          color: true,
        },
      },
      inviter: {
        select: { fullName: true },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  if (invitation.status === "PENDING" && isInvitationExpired(invitation.expiresAt)) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { ...invitation, status: "EXPIRED" as const };
  }

  return invitation;
}

type ResolvedInvitation =
  | { ok: true; session: Awaited<ReturnType<typeof requireAuth>>; invitation: NonNullable<Awaited<ReturnType<typeof getInvitationByToken>>> }
  | { ok: false; error: InvitationErrorCode; projectId?: string };

async function resolveInvitationForUser(token: string): Promise<ResolvedInvitation> {
  const session = await requireAuth();
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return { ok: false, error: "invalidToken" };
  }

  if (invitation.status !== "PENDING") {
    return { ok: false, error: "alreadyHandled" };
  }

  if (isInvitationExpired(invitation.expiresAt)) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "expired" };
  }

  if (session.user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
    return { ok: false, error: "emailMismatch" };
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: invitation.projectId,
        userId: session.user.id,
      },
    },
  });

  if (existingMember) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    return { ok: false, error: "alreadyMember", projectId: invitation.projectId };
  }

  return { ok: true, session, invitation };
}

export async function acceptProjectInvitation(token: string): Promise<InvitationResponseState> {
  try {
    const resolved = await resolveInvitationForUser(token);

    if (!resolved.ok) {
      return {
        success: resolved.error === "alreadyMember",
        formError: resolved.error,
        projectId: resolved.projectId,
      };
    }

    const { session, invitation } = resolved;

    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: session.user.id,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.notification.create({
        data: {
          userId: invitation.inviterId,
          type: "INVITATION_ACCEPTED",
          titleUz: "Taklif qabul qilindi",
          titleJa: "招待が承認されました",
          messageUz: `${session.user.fullName} loyihaga qo'shildi.`,
          messageJa: `${session.user.fullName} がプロジェクトに参加しました。`,
        },
      }),
    ]);

    revalidateInvitationPaths(invitation.projectId);
    return { success: true, projectId: invitation.projectId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function declineProjectInvitation(token: string): Promise<InvitationResponseState> {
  try {
    const resolved = await resolveInvitationForUser(token);

    if (!resolved.ok) {
      return {
        success: false,
        formError: resolved.error,
        projectId: resolved.projectId,
      };
    }

    const { invitation } = resolved;

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "DECLINED" },
    });

    revalidateInvitationPaths(invitation.projectId);
    return { success: true, projectId: invitation.projectId };
  } catch {
    return { success: false, formError: "saveFailed" };
  }
}

export async function getPendingInvitationsForProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true, role: true } } },
  });

  if (!project) {
    return [];
  }

  const role =
    project.ownerId === userId
      ? "OWNER"
      : project.members.find((member) => member.userId === userId)?.role ?? null;

  if (!canManageMembers(role)) {
    return [];
  }

  return prisma.invitation.findMany({
    where: {
      projectId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      inviter: { select: { fullName: true } },
    },
  });
}
