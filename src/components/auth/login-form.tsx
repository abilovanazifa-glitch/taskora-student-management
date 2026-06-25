"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { preferredLanguageToLocale } from "@/lib/i18n/locale";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthErrorCode } from "@/lib/validations/auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [formError, setFormError] = useState<AuthErrorCode | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsPending(false);

    if (result?.error) {
      setFormError("invalidCredentials");
      return;
    }

    const session = await getSession();
    const targetLocale = session?.user?.preferredLanguage
      ? preferredLanguageToLocale(session.user.preferredLanguage)
      : undefined;

    router.push("/dashboard", { locale: targetLocale });
    router.refresh();
  }

  return (
    <AuthCard title={t("loginTitle")} description={t("loginDescription")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {formError ? (
          <p className="text-form-error" role="alert">
            {t(`errors.${formError}`)}
          </p>
        ) : null}
        <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
          {isPending ? t("submittingLogin") : t("submitLogin")}
        </Button>
      </form>
    </AuthCard>
  );
}
