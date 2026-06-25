import { randomBytes } from "node:crypto";
import { addDays } from "date-fns";

export const INVITATION_EXPIRY_DAYS = 7;

export function generateInvitationToken() {
  return randomBytes(32).toString("hex");
}

export function getInvitationExpiresAt(from = new Date()) {
  return addDays(from, INVITATION_EXPIRY_DAYS);
}

export function isInvitationExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() < now.getTime();
}

export function buildInvitationUrl(locale: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/${locale}/invitations/${token}`;
}
