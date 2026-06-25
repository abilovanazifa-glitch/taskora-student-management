import { describe, expect, it } from "vitest";
import {
  canChangeMemberRole,
  canInviteWithRole,
  canLeaveProject,
  canManageMembers,
  canRemoveMember,
  canTransferOwnership,
} from "@/lib/permissions/members";

describe("member management permissions", () => {
  it("allows OWNER and ADMIN to manage members", () => {
    expect(canManageMembers("OWNER")).toBe(true);
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canManageMembers("MEMBER")).toBe(false);
    expect(canManageMembers("VIEWER")).toBe(false);
  });

  it("only OWNER can transfer ownership", () => {
    expect(canTransferOwnership("OWNER")).toBe(true);
    expect(canTransferOwnership("ADMIN")).toBe(false);
  });

  it("prevents OWNER from leaving without transfer", () => {
    expect(canLeaveProject("OWNER", "owner-1", "owner-1")).toBe(false);
    expect(canLeaveProject("ADMIN", "admin-1", "owner-1")).toBe(true);
    expect(canLeaveProject("MEMBER", "member-1", "owner-1")).toBe(true);
  });

  it("prevents ADMIN from removing OWNER", () => {
    expect(
      canRemoveMember("ADMIN", "OWNER", "admin-1", "owner-1", "owner-1"),
    ).toBe(false);
    expect(
      canRemoveMember("ADMIN", "MEMBER", "admin-1", "member-1", "owner-1"),
    ).toBe(true);
    expect(
      canRemoveMember("OWNER", "ADMIN", "owner-1", "admin-1", "owner-1"),
    ).toBe(true);
  });

  it("restricts MEMBER from role management", () => {
    expect(canChangeMemberRole("MEMBER", "VIEWER", "MEMBER")).toBe(false);
    expect(canChangeMemberRole("ADMIN", "MEMBER", "VIEWER")).toBe(true);
    expect(canChangeMemberRole("ADMIN", "OWNER", "MEMBER")).toBe(false);
    expect(canChangeMemberRole("OWNER", "ADMIN", "MEMBER")).toBe(true);
  });

  it("disallows inviting as OWNER", () => {
    expect(canInviteWithRole("ADMIN")).toBe(true);
    expect(canInviteWithRole("OWNER")).toBe(false);
  });
});
