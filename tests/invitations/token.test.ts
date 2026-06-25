import { describe, expect, it } from "vitest";
import { addDays, subDays } from "date-fns";
import {
  generateInvitationToken,
  getInvitationExpiresAt,
  isInvitationExpired,
} from "@/lib/invitations/token";

describe("invitation tokens", () => {
  it("generates unique secure tokens", () => {
    const first = generateInvitationToken();
    const second = generateInvitationToken();
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
    expect(first).not.toBe(second);
  });

  it("expires invitations after seven days by default", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const expiresAt = getInvitationExpiresAt(now);
    expect(expiresAt.getTime()).toBe(addDays(now, 7).getTime());
  });

  it("detects expired invitations safely", () => {
    const now = new Date("2026-06-08T12:00:00.000Z");
    expect(isInvitationExpired(subDays(now, 1), now)).toBe(true);
    expect(isInvitationExpired(addDays(now, 1), now)).toBe(false);
  });
});
