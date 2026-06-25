"use server";

import { requireAuth } from "@/lib/permissions/access";
import {
  checkTranslationRateLimit,
  getTranslationRateLimit,
} from "@/lib/translation/rate-limit";
import { isTranslationConfigured, translateWithDeepL } from "@/lib/translation/service";
import type { TranslationErrorCode } from "@/lib/translation/types";
import {
  mapTranslationZodError,
  translationRequestSchema,
  validateTranslationLength,
} from "@/lib/validations/translation";

export type TranslationActionResult = {
  success: boolean;
  translatedText?: string;
  configured: boolean;
  error?: TranslationErrorCode;
};

export async function getTranslationAvailability(): Promise<{ configured: boolean }> {
  return { configured: isTranslationConfigured() };
}

export async function translateBilingualContent(input: {
  text: string;
  sourceLang: "uz" | "ja";
  targetLang: "uz" | "ja";
  fieldType: "title" | "description" | "location" | "name";
  maxLength?: number;
}): Promise<TranslationActionResult> {
  const configured = isTranslationConfigured();

  if (!configured) {
    return { success: false, configured: false, error: "notConfigured" };
  }

  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, configured: true, error: "forbidden" };
  }

  const parsed = translationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      configured: true,
      error: mapTranslationZodError(parsed.error),
    };
  }

  if (parsed.data.sourceLang === parsed.data.targetLang) {
    return { success: false, configured: true, error: "sameLanguage" };
  }

  const lengthError = validateTranslationLength(
    parsed.data.text,
    parsed.data.fieldType,
    parsed.data.maxLength,
  );
  if (lengthError) {
    return { success: false, configured: true, error: lengthError };
  }

  const rateLimit = getTranslationRateLimit();
  if (!checkTranslationRateLimit(session.user.id, rateLimit)) {
    return { success: false, configured: true, error: "rateLimited" };
  }

  try {
    const translatedText = await translateWithDeepL({
      text: parsed.data.text,
      sourceLang: parsed.data.sourceLang,
      targetLang: parsed.data.targetLang,
    });

    const outputLengthError = validateTranslationLength(
      translatedText,
      parsed.data.fieldType,
      parsed.data.maxLength,
    );
    if (outputLengthError) {
      return { success: false, configured: true, error: outputLengthError };
    }

    return { success: true, configured: true, translatedText };
  } catch {
    return { success: false, configured: true, error: "providerError" };
  }
}
