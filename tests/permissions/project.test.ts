import { describe, expect, it } from "vitest";
import {
  canEditTask,
  getProjectRole,
  hasProjectPermission,
} from "@/lib/permissions/project";

const baseProject = {
  ownerId: "owner-1",
  members: [
    { userId: "admin-1", role: "ADMIN" as const },
    { userId: "member-1", role: "MEMBER" as const },
    { userId: "viewer-1", role: "VIEWER" as const },
  ],
};

describe("getProjectRole", () => {
  it("returns OWNER for project owner", () => {
    expect(getProjectRole("owner-1", baseProject)).toBe("OWNER");
  });

  it("returns member role for participants", () => {
    expect(getProjectRole("admin-1", baseProject)).toBe("ADMIN");
    expect(getProjectRole("member-1", baseProject)).toBe("MEMBER");
    expect(getProjectRole("viewer-1", baseProject)).toBe("VIEWER");
  });

  it("returns null for outsiders", () => {
    expect(getProjectRole("unknown", baseProject)).toBeNull();
  });
});

describe("hasProjectPermission", () => {
  it("allows OWNER full project control", () => {
    expect(hasProjectPermission("OWNER", "edit_project")).toBe(true);
    expect(hasProjectPermission("OWNER", "delete_project")).toBe(true);
    expect(hasProjectPermission("OWNER", "manage_members")).toBe(true);
  });

  it("allows ADMIN to manage tasks, events, and members", () => {
    expect(hasProjectPermission("ADMIN", "manage_members")).toBe(true);
    expect(hasProjectPermission("ADMIN", "manage_events")).toBe(true);
    expect(hasProjectPermission("ADMIN", "edit_any_task")).toBe(true);
    expect(hasProjectPermission("ADMIN", "edit_project")).toBe(false);
    expect(hasProjectPermission("ADMIN", "delete_project")).toBe(false);
  });

  it("allows MEMBER to create and edit project tasks", () => {
    expect(hasProjectPermission("MEMBER", "create_task")).toBe(true);
    expect(hasProjectPermission("MEMBER", "edit_any_task")).toBe(false);
    expect(hasProjectPermission("MEMBER", "manage_events")).toBe(false);
    expect(
      canEditTask("MEMBER", "member-1", { creatorId: "member-1", assigneeId: null }),
    ).toBe(true);
    expect(
      canEditTask("MEMBER", "member-1", { creatorId: "other", assigneeId: "member-1" }),
    ).toBe(true);
    expect(
      canEditTask("MEMBER", "member-1", { creatorId: "other", assigneeId: null }),
    ).toBe(true);
  });

  it("restricts VIEWER to read-only access", () => {
    expect(hasProjectPermission("VIEWER", "view")).toBe(true);
    expect(hasProjectPermission("VIEWER", "create_task")).toBe(false);
    expect(hasProjectPermission("VIEWER", "manage_members")).toBe(false);
  });
});
