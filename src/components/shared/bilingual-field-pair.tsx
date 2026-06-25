"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Languages, Loader2 } from "lucide-react";
import {
  getTranslationAvailability,
  translateBilingualContent,
} from "@/lib/actions/translation";
import { pickSourceForOverwrite } from "@/lib/translation/direction";
import type { ContentLanguage, TranslationFieldType } from "@/lib/translation/types";
import { LanguageBadge } from "@/components/shared/language-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BilingualFieldPairProps = {
  uzName: string;
  jaName: string;
  uzLabel: string;
  jaLabel: string;
  initialUz?: string;
  initialJa?: string;
  multiline?: boolean;
  rows?: number;
  fieldType: TranslationFieldType;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  uzId?: string;
  jaId?: string;
  fieldErrorUz?: string | null;
  fieldErrorJa?: string | null;
  layout?: "stacked" | "grid";
};

function LanguageFieldBlock({
  language,
  id,
  name,
  label,
  value,
  onChange,
  fieldError,
  multiline,
  rows,
  maxLength,
  required,
  disabled,
}: {
  language: "uz" | "ja";
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldError?: string | null;
  multiline: boolean;
  rows: number;
  maxLength?: number;
  required: boolean;
  disabled: boolean;
}) {
  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="bg-muted/40 space-y-2 rounded-2xl border border-border/60 p-4">
      <div className="flex items-center gap-2">
        <LanguageBadge language={language} />
        <Label htmlFor={id}>
          {label}
        </Label>
      </div>
      <InputComponent
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        readOnly={disabled}
        rows={multiline ? rows : undefined}
        maxLength={maxLength}
        className="bg-background"
      />
      {fieldError ? <p className="text-destructive text-body-sm">{fieldError}</p> : null}
    </div>
  );
}

export function BilingualFieldPair({
  uzName,
  jaName,
  uzLabel,
  jaLabel,
  initialUz = "",
  initialJa = "",
  multiline = false,
  rows = 3,
  fieldType,
  maxLength,
  required = false,
  disabled = false,
  uzId,
  jaId,
  fieldErrorUz,
  fieldErrorJa,
  layout = "stacked",
}: BilingualFieldPairProps) {
  const t = useTranslations("translation");
  const [uzText, setUzText] = useState(initialUz);
  const [jaText, setJaText] = useState(initialJa);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getTranslationAvailability().then((result) => {
      if (active) {
        setConfigured(result.configured);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleTranslate(preferredSource?: ContentLanguage) {
    setError(null);

    const direction = pickSourceForOverwrite({ uzText, jaText, preferredSource });

    if (!direction) {
      setError(t("errors.emptySource"));
      return;
    }

    const targetHasContent =
      direction.targetLang === "ja" ? jaText.trim().length > 0 : uzText.trim().length > 0;

    if (targetHasContent && !window.confirm(t("confirmOverwrite"))) {
      return;
    }

    setLoading(true);
    try {
      const result = await translateBilingualContent({
        text: direction.sourceText,
        sourceLang: direction.sourceLang,
        targetLang: direction.targetLang,
        fieldType,
        maxLength,
      });

      if (!result.success || !result.translatedText) {
        setError(t(`errors.${result.error ?? "providerError"}`));
        return;
      }

      if (direction.targetLang === "ja") {
        setJaText(result.translatedText);
      } else {
        setUzText(result.translatedText);
      }
    } finally {
      setLoading(false);
    }
  }

  const translateDisabled = disabled || loading || configured === false;

  return (
    <div className="space-y-3">
      <div className="bg-accent/60 flex flex-col gap-3 rounded-2xl border border-dashed border-primary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-body-sm flex min-w-0 items-center gap-2">
          <LanguageBadge language="uz" />
          <ArrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          <LanguageBadge language="ja" />
          <span className="text-muted-foreground ml-1 leading-snug">{t("bilingualHint")}</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="cursor-pointer shrink-0"
          disabled={translateDisabled}
          onClick={() => void handleTranslate()}
          title={configured === false ? t("manualOnlyHint") : undefined}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Languages className="size-4" />
          )}
          <span className="ml-1.5">{loading ? t("translating") : t("translate")}</span>
        </Button>
      </div>

      {configured === false ? (
        <p className="text-body-sm rounded-md bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
          {t("manualOnlyHint")}
        </p>
      ) : null}

      {error ? <p className="text-form-error">{error}</p> : null}

      <div
        className={cn(
          "gap-3",
          layout === "grid" ? "grid sm:grid-cols-2" : "flex flex-col",
        )}
      >
        <LanguageFieldBlock
          language="uz"
          id={uzId ?? uzName}
          name={uzName}
          label={uzLabel}
          value={uzText}
          onChange={setUzText}
          fieldError={fieldErrorUz}
          multiline={multiline}
          rows={rows}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
        />
        <LanguageFieldBlock
          language="ja"
          id={jaId ?? jaName}
          name={jaName}
          label={jaLabel}
          value={jaText}
          onChange={setJaText}
          fieldError={fieldErrorJa}
          multiline={multiline}
          rows={rows}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
