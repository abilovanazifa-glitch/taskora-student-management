import type { ProjectMemberRole } from "@prisma/client";

export function canManageMembers(role: ProjectMemberRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canChangeMemberRole(
  actorRole: ProjectMemberRole | null,
  targetRole: ProjectMemberRole,
  newRole: ProjectMemberRole,
): boolean {
  if (!actorRole || newRole === "OWNER") {
    return false;
  }

  if (actorRole === "MEMBER" || actorRole === "VIEWER") {
    return false;
  }

  if (targetRole === "OWNER") {
    return false;
  }

  if (actorRole === "ADMIN") {
    return (
      (targetRole === "MEMBER" || targetRole === "VIEWER") &&
      (newRole === "MEMBER" || newRole === "VIEWER")
    );
  }

  return true;
}

export function canRemoveMember(
  actorRole: ProjectMemberRole | null,
  targetRole: ProjectMemberRole,
  actorUserId: string,
  targetUserId: string,
  ownerId: string,
): boolean {
  if (!actorRole || targetUserId === ownerId || targetRole === "OWNER") {
    return false;
  }

  if (actorRole === "MEMBER" || actorRole === "VIEWER") {
    return false;
  }

  if (actorRole === "ADMIN") {
    return targetRole === "MEMBER" || targetRole === "VIEWER";
  }

  if (actorUserId === targetUserId && actorRole === "OWNER") {
    return false;
  }

  return true;
}

export function canLeaveProject(
  role: ProjectMemberRole | null,
  userId: string,
  ownerId: string,
): boolean {
  if (!role) {
    return false;
  }

  return role !== "OWNER" && userId !== ownerId;
}

export function canTransferOwnership(role: ProjectMemberRole | null): boolean {
  return role === "OWNER";
}

export function canInviteWithRole(role: ProjectMemberRole): boolean {
  return role !== "OWNER";
}
