import { describe, expect, it } from "vitest";
import {
  getLocaleFromPathname,
  isAuthPath,
  isProtectedPath,
  stripLocaleFromPathname,
} from "@/lib/auth/routes";

const locales = ["ja", "uz", "en"] as const;

describe("stripLocaleFromPathname", () => {
  it("removes locale prefix from nested paths", () => {
    expect(stripLocaleFromPathname("/ja/dashboard", locales)).toBe("/dashboard");
    expect(stripLocaleFromPathname("/uz/profile", locales)).toBe("/profile");
  });

  it("returns root for locale-only paths", () => {
    expect(stripLocaleFromPathname("/ja", locales)).toBe("/");
  });
});

describe("isProtectedPath", () => {
  it("matches protected app routes", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/projects/abc")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/invitations/token123")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
  });
});

describe("isAuthPath", () => {
  it("matches auth routes", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/register")).toBe(true);
  });

  it("does not match protected routes", () => {
    expect(isAuthPath("/dashboard")).toBe(false);
  });
});

describe("getLocaleFromPathname", () => {
  it("extracts locale from pathname", () => {
    expect(getLocaleFromPathname("/ja/dashboard", locales, "ja")).toBe("ja");
    expect(getLocaleFromPathname("/uz/login", locales, "ja")).toBe("uz");
    expect(getLocaleFromPathname("/en/dashboard", locales, "ja")).toBe("en");
  });

  it("falls back when locale is missing", () => {
    expect(getLocaleFromPathname("/unknown", locales, "ja")).toBe("ja");
  });
});
