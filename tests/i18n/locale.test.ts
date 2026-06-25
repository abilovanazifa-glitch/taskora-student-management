import { describe, expect, it } from "vitest";
import {
  dbThemeToNextTheme,
  localeToPreferredLanguage,
  nextThemeToDbTheme,
  preferredLanguageToLocale,
} from "@/lib/i18n/locale";

describe("locale helpers", () => {
  it("maps preferred language to locale", () => {
    expect(preferredLanguageToLocale("JA")).toBe("ja");
    expect(preferredLanguageToLocale("UZ")).toBe("uz");
    expect(preferredLanguageToLocale("EN")).toBe("en");
  });

  it("maps locale to preferred language", () => {
    expect(localeToPreferredLanguage("ja")).toBe("JA");
    expect(localeToPreferredLanguage("uz")).toBe("UZ");
    expect(localeToPreferredLanguage("en")).toBe("EN");
  });
});

describe("theme helpers", () => {
  it("maps database theme values to next-themes values", () => {
    expect(dbThemeToNextTheme("LIGHT")).toBe("light");
    expect(dbThemeToNextTheme("DARK")).toBe("dark");
    expect(dbThemeToNextTheme("SYSTEM")).toBe("system");
  });

  it("maps next-themes values to database theme values", () => {
    expect(nextThemeToDbTheme("light")).toBe("LIGHT");
    expect(nextThemeToDbTheme("dark")).toBe("DARK");
    expect(nextThemeToDbTheme("system")).toBe("SYSTEM");
  });
});
