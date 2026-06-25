import { setRequestLocale } from "next-intl/server";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import type { AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";

type AppPlaceholderPageProps = {
  params: Promise<{ locale: string }>;
  pageKey:
    | "dashboard"
    | "projects"
    | "projectDetail"
    | "calendar"
    | "tasks"
    | "notifications"
    | "profile";
};

export async function AppPlaceholderPage({ params, pageKey }: AppPlaceholderPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const tPages = await getAppTranslations(appLocale, "pages");
  const tCommon = await getAppTranslations(appLocale, "common");

  return (
    <PageStack size="medium">
      <PageHeader title={tPages(pageKey)} description={tCommon("comingSoon")} />
      <PlaceholderPanel title={tPages(pageKey)} description={tCommon("placeholderPage")} />
    </PageStack>
  );
}
