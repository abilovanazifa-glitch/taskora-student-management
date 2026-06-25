import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/i18n/routing";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { registered } = await searchParams;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const t = await getAppTranslations(appLocale, "auth");
  const tNav = await getAppTranslations(appLocale, "nav");

  return (
    <div className="bg-muted/30 min-h-screen">
      <MarketingHeader />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        {registered ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-body-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t("registrationSuccess")}
          </p>
        ) : null}
        <LoginForm />
        <p className="text-muted-foreground text-center text-sm">
          {t("noAccount")}{" "}
          <Button
            variant="link"
            className="h-auto cursor-pointer p-0"
            render={<Link href="/register" />}
          >
            {tNav("register")}
          </Button>
        </p>
      </div>
    </div>
  );
}
