import { z } from "zod";
import {
  TRANSLATION_MAX_LENGTH,
  type TranslationErrorCode,
  type TranslationFieldType,
} from "@/lib/translation/types";

export const translationRequestSchema = z.object({
  text: z.string().trim().min(1, "emptySource"),
  sourceLang: z.enum(["uz", "ja"]),
  targetLang: z.enum(["uz", "ja"]),
  fieldType: z.enum(["title", "description", "location", "name"]),
  maxLength: z.number().int().positive().optional(),
});

export type TranslationRequestInput = z.infer<typeof translationRequestSchema>;

export function resolveMaxTranslationLength(
  fieldType: TranslationFieldType,
  maxLength?: number,
) {
  return maxLength ?? TRANSLATION_MAX_LENGTH[fieldType];
}

export function validateTranslationLength(
  text: string,
  fieldType: TranslationFieldType,
  maxLength?: number,
): TranslationErrorCode | null {
  const limit = resolveMaxTranslationLength(fieldType, maxLength);
  if (text.length > limit) {
    return "tooLong";
  }
  return null;
}

export function mapTranslationZodError(error: z.ZodError): TranslationErrorCode {
  const issue = error.issues[0];
  if (issue?.message === "emptySource") {
    return "emptySource";
  }
  return "providerError";
}
