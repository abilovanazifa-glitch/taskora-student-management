import { describe, expect, it } from "vitest";
import {
  loginSchema,
  mapZodErrors,
  profileUpdateSchema,
  registerSchema,
} from "@/lib/validations/auth";

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      fullName: "Tanaka Yuki",
      email: "student@example.com",
      password: "Student1!",
      confirmPassword: "Student1!",
      preferredLanguage: "JA",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.com");
    }
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Test User",
      email: "test@example.com",
      password: "short1",
      confirmPassword: "short1",
      preferredLanguage: "UZ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = mapZodErrors(result.error);
      expect(errors.password).toBe("passwordMinLength");
    }
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      fullName: "Test User",
      email: "test@example.com",
      password: "Student1!",
      confirmPassword: "Student2!",
      preferredLanguage: "JA",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = mapZodErrors(result.error);
      expect(errors.confirmPassword).toBe("passwordMismatch");
    }
  });

  it("normalizes email to lowercase", () => {
    const result = registerSchema.safeParse({
      fullName: "Test User",
      email: "  Student@Example.COM  ",
      password: "Student1!",
      confirmPassword: "Student1!",
      preferredLanguage: "JA",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.com");
    }
  });
});

describe("loginSchema", () => {
  it("requires password", () => {
    const result = loginSchema.safeParse({
      email: "student@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts empty avatar URL", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "Tanaka Yuki",
      avatarUrl: "",
      preferredLanguage: "JA",
      theme: "SYSTEM",
    });

    expect(result.success).toBe(true);
  });

  it("accepts uploaded avatar path", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "Aziza Karimova",
      avatarUrl: "/uploads/avatars/user-123.jpg",
      preferredLanguage: "UZ",
      theme: "LIGHT",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid avatar URL", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "Tanaka Yuki",
      avatarUrl: "not-a-url",
      preferredLanguage: "JA",
      theme: "DARK",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = mapZodErrors(result.error);
      expect(errors.avatarUrl).toBe("avatarUrlInvalid");
    }
  });
});
