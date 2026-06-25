import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { bindAppLocale } from "@/lib/i18n/server-locale";
import { prepareUserTaskWorkspace } from "@/lib/queries/workspace";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageStack } from "@/components/layout/page-stack";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDashboardData } from "@/lib/queries/dashboard";
import type { AppLocale } from "@/i18n/routing";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

function DashboardSkeleton() {
  return (
    <PageStack>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted/40 h-24 animate-pulse rounded-3xl" />
        ))}
      </div>
      <div className="bg-muted/40 h-96 animate-pulse rounded-3xl" />
    </PageStack>
  );
}

async function DashboardData({ locale }: { locale: AppLocale }) {
  bindAppLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  await prepareUserTaskWorkspace(session.user.id);
  const data = await getDashboardData(session.user.id);

  return (
    <DashboardContent
      locale={locale}
      userName={session.user.fullName ?? session.user.name ?? ""}
      data={data}
    />
  );
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageStack>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData locale={locale as AppLocale} />
      </Suspense>
    </PageStack>
  );
}
