import { describe, expect, it } from "vitest";
import {
  resolveMaxTranslationLength,
  validateTranslationLength,
} from "@/lib/validations/translation";

describe("validateTranslationLength", () => {
  it("accepts text within default title limit", () => {
    expect(validateTranslationLength("a".repeat(200), "title")).toBeNull();
  });

  it("rejects text over default title limit", () => {
    expect(validateTranslationLength("a".repeat(201), "title")).toBe("tooLong");
  });

  it("respects custom max length override", () => {
    expect(validateTranslationLength("a".repeat(41), "name", 40)).toBe("tooLong");
    expect(validateTranslationLength("a".repeat(40), "name", 40)).toBeNull();
  });
});

describe("resolveMaxTranslationLength", () => {
  it("uses override when provided", () => {
    expect(resolveMaxTranslationLength("description", 2000)).toBe(2000);
  });

  it("falls back to field defaults", () => {
    expect(resolveMaxTranslationLength("location")).toBe(200);
  });
});
