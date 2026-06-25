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
import { Eye, EyeOff } from "lucide-react";
import type { AuthErrorCode } from "@/lib/validations/auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [formError, setFormError] = useState<AuthErrorCode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? t("hidePassword") : t("showPassword")}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {formError ? (
          <p className="text-form-error" role="alert">
            {t(`errors.${formError}`)}
          </p>
        ) : null}
        <div className="text-right">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => alert(t("forgotPassword"))}
          >
            {t("forgotPassword")}
          </button>
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
          {isPending ? t("submittingLogin") : t("submitLogin")}
        </Button>
      </form>
    </AuthCard>
  );
}
