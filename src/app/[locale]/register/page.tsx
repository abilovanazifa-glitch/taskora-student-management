import { setRequestLocale } from "next-intl/server";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const t = await getAppTranslations(appLocale, "auth");
  const tNav = await getAppTranslations(appLocale, "nav");

  return (
    <div className="bg-muted/30 min-h-screen">
      <MarketingHeader />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <RegisterForm />
        <p className="text-muted-foreground text-center text-sm">
          {t("hasAccount")}{" "}
          <Button
            variant="link"
            className="h-auto cursor-pointer p-0"
            render={<Link href="/login" />}
          >
            {tNav("login")}
          </Button>
        </p>
      </div>
    </div>
  );
}
