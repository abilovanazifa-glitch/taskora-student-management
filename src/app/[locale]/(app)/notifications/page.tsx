import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { bindAppLocale, getAppTranslations } from "@/lib/i18n/server-locale";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { getNotificationSummary } from "@/lib/queries/notifications";
import type { AppLocale } from "@/i18n/routing";

type NotificationsPageProps = {
  params: Promise<{ locale: string }>;
};

function NotificationsSkeleton() {
  return <div className="bg-muted/40 h-64 animate-pulse rounded-xl" />;
}

async function NotificationsData({ locale }: { locale: AppLocale }) {
  bindAppLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const { items, unreadCount } = await getNotificationSummary(session.user.id);
  const t = await getAppTranslations(locale, "notifications");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <NotificationsPanel items={items} unreadCount={unreadCount} />
    </>
  );
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageStack className="max-w-none">
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsData locale={locale as AppLocale} />
      </Suspense>
    </PageStack>
  );
}
