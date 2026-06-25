import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/credentials";

describe("password hashing", () => {
  it("hashes and verifies passwords with bcrypt", async () => {
    const password = "Student1!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass1!", hash)).resolves.toBe(false);
  });
});
