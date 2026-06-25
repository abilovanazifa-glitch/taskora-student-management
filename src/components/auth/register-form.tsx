"use client";

import { useActionState, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localeToPreferredLanguage } from "@/lib/i18n/locale";import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerUser, type RegisterState } from "@/lib/actions/register";
import type { AuthErrorCode } from "@/lib/validations/auth";

const initialState: RegisterState = { success: false };

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const currentLocale = useLocale() as AppLocale;
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const [preferredLanguage, setPreferredLanguage] = useState<"JA" | "UZ" | "EN">(() =>
    localeToPreferredLanguage(currentLocale),
  );
  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=1");
    }
  }, [state.success, router]);

  function fieldError(field: string) {
    const code = state.fieldErrors?.[field] as AuthErrorCode | undefined;
    return code ? t(`errors.${code}`) : null;
  }

  return (
    <AuthCard title={t("registerTitle")} description={t("registerDescription")}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="preferredLanguage" value={preferredLanguage} />
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("name")}</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
          {fieldError("fullName") ? (
            <p className="text-form-error">{fieldError("fullName")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {fieldError("email") ? (
            <p className="text-form-error">{fieldError("email")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          {fieldError("password") ? (
            <p className="text-form-error">{fieldError("password")}</p>
          ) : null}
          <p className="text-caption">{t("passwordHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
          {fieldError("confirmPassword") ? (
            <p className="text-form-error">{fieldError("confirmPassword")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">{t("preferredLanguage")}</Label>
          <Select
            value={preferredLanguage}
            onValueChange={(value) => setPreferredLanguage(value as "JA" | "UZ" | "EN")}
          >
            <SelectTrigger id="preferredLanguage" className="w-full cursor-pointer">
              <SelectValue placeholder={t("preferredLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JA">{t("languages.ja")}</SelectItem>
              <SelectItem value="UZ">{t("languages.uz")}</SelectItem>
              <SelectItem value="EN">{t("languages.en")}</SelectItem>
            </SelectContent>
          </Select>
          {fieldError("preferredLanguage") ? (
            <p className="text-form-error">{fieldError("preferredLanguage")}</p>
          ) : null}
        </div>

        {state.formError ? (
          <p className="text-form-error" role="alert">
            {t(`errors.${state.formError}`)}
          </p>
        ) : null}

        <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
          {isPending ? t("submittingRegister") : t("submitRegister")}
        </Button>
      </form>
    </AuthCard>
  );
}
