import { setRequestLocale } from "next-intl/server";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckSquare, FolderKanban, Languages } from "lucide-react";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const t = await getAppTranslations(appLocale, "landing");
  const tNav = await getAppTranslations(appLocale, "nav");

  const features = [
    {
      icon: FolderKanban,
      title: t("features.projects"),
      description: t("featureDescriptions.projects"),
    },
    {
      icon: CalendarDays,
      title: t("features.calendar"),
      description: t("featureDescriptions.calendar"),
    },
    {
      icon: CheckSquare,
      title: t("features.tasks"),
      description: t("featureDescriptions.tasks"),
    },
    {
      icon: Languages,
      title: t("features.i18n"),
      description: t("featureDescriptions.i18n"),
    },
  ] as const;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <MarketingHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-display sm:text-[3rem]">
              {t("heroTitle")}
            </h1>
            <p className="text-body mt-4 text-pretty sm:text-lg">
              {t("heroDescription")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full cursor-pointer sm:w-auto"
                render={<Link href="/register" />}
              >
                {t("getStarted")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full cursor-pointer sm:w-auto"
                render={<Link href="/login" />}
              >
                {t("signIn")}
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="bento-card border-border/70">
                <CardHeader>
                  <div className="bg-accent text-primary mb-2 flex size-11 items-center justify-center rounded-2xl">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border text-muted-foreground border-t py-6 text-center text-sm">
        {tNav("dashboard")} · {tNav("calendar")} · {tNav("tasks")}
      </footer>
    </div>
  );
}
