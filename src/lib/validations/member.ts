import { z } from "zod";
import { invitableRoleSchema } from "@/lib/validations/invitation";

export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, "memberRequired"),
  role: invitableRoleSchema.or(z.literal("ADMIN")),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "memberRequired"),
});

export type MemberErrorCode =
  | "memberRequired"
  | "forbidden"
  | "notFound"
  | "cannotLeaveAsOwner"
  | "saveFailed";
