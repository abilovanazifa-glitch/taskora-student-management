import { describe, expect, it } from "vitest";
import {
  pickSourceForOverwrite,
  resolveTranslationDirection,
} from "@/lib/translation/direction";

describe("resolveTranslationDirection", () => {
  it("translates uz to ja when only uz is filled", () => {
    expect(resolveTranslationDirection({ uzText: "Salom", jaText: "" })).toEqual({
      sourceLang: "uz",
      targetLang: "ja",
      sourceText: "Salom",
    });
  });

  it("translates ja to uz when only ja is filled", () => {
    expect(resolveTranslationDirection({ uzText: "", jaText: "こんにちは" })).toEqual({
      sourceLang: "ja",
      targetLang: "uz",
      sourceText: "こんにちは",
    });
  });

  it("returns null when both fields are filled", () => {
    expect(resolveTranslationDirection({ uzText: "Salom", jaText: "こんにちは" })).toBeNull();
  });

  it("returns null when both fields are empty", () => {
    expect(resolveTranslationDirection({ uzText: "  ", jaText: "" })).toBeNull();
  });
});

describe("pickSourceForOverwrite", () => {
  it("prefers uz when both fields are filled", () => {
    expect(
      pickSourceForOverwrite({ uzText: "Loyiha", jaText: "プロジェクト" }),
    ).toEqual({
      sourceLang: "uz",
      targetLang: "ja",
      sourceText: "Loyiha",
    });
  });

  it("uses ja as source when preferred", () => {
    expect(
      pickSourceForOverwrite({
        uzText: "Loyiha",
        jaText: "プロジェクト",
        preferredSource: "ja",
      }),
    ).toEqual({
      sourceLang: "ja",
      targetLang: "uz",
      sourceText: "プロジェクト",
    });
  });
});
