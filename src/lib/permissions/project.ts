import type { ProjectMemberRole } from "@prisma/client";

export type ProjectAction =
  | "view"
  | "edit_project"
  | "archive_project"
  | "delete_project"
  | "manage_members"
  | "manage_events"
  | "create_task"
  | "edit_any_task"
  | "edit_own_task"
  | "delete_task";

type ProjectWithMembers = {
  ownerId: string;
  members: { userId: string; role: ProjectMemberRole }[];
};

export function getProjectRole(
  userId: string,
  project: ProjectWithMembers,
): ProjectMemberRole | null {
  if (project.ownerId === userId) {
    return "OWNER";
  }

  const member = project.members.find((entry) => entry.userId === userId);
  return member?.role ?? null;
}

export function hasProjectPermission(
  role: ProjectMemberRole | null,
  action: ProjectAction,
): boolean {
  if (!role) {
    return false;
  }

  switch (action) {
    case "view":
      return true;
    case "edit_project":
    case "archive_project":
    case "delete_project":
      return role === "OWNER";
    case "manage_members":
    case "manage_events":
    case "edit_any_task":
    case "delete_task":
      return role === "OWNER" || role === "ADMIN";
    case "create_task":
    case "edit_own_task":
      return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
    default:
      return false;
  }
}

export function canEditTask(
  role: ProjectMemberRole | null,
  userId: string,
  task: { creatorId: string; assigneeId: string | null },
): boolean {
  void userId;
  void task;
  if (!role) {
    return false;
  }

  if (hasProjectPermission(role, "edit_any_task")) {
    return true;
  }

  if (hasProjectPermission(role, "edit_own_task")) {
    return true;
  }

  return false;
}
