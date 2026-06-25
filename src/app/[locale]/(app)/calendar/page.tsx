import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { bindAppLocale, getAppTranslations } from "@/lib/i18n/server-locale";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { CalendarHub } from "@/components/calendar/calendar-hub";
import { parseCalendarFilters } from "@/lib/actions/events";
import { getCalendarData } from "@/lib/queries/calendar";
import { parseAnchorDate, parseCalendarView } from "@/lib/calendar/views";
import type { AppLocale } from "@/i18n/routing";

type CalendarPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

function CalendarSkeleton() {
  return <div className="bg-muted/40 h-96 animate-pulse rounded-xl" />;
}

async function CalendarData({
  locale,
  searchParams,
}: {
  locale: AppLocale;
  searchParams: Record<string, string | undefined>;
}) {
  bindAppLocale(locale);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const filters = await parseCalendarFilters({
    view: searchParams.view,
    date: searchParams.date,
    projectId: searchParams.project,
    subjectId: searchParams.subject,
    assigneeId: searchParams.assignee,
    showCompleted: searchParams.completed ?? "true",
  });

  const view = parseCalendarView(filters.view);
  const anchor = parseAnchorDate(filters.date);
  const data = await getCalendarData(session.user.id, { ...filters, view, anchor });
  const t = await getAppTranslations(locale, "calendar");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <CalendarHub
        locale={locale}
        view={view}
        anchor={anchor}
        items={data.items}
        projects={data.projects}
        subjects={data.subjects}
        assignees={data.assignees}
        filters={{
          projectId: filters.projectId ?? "",
          subjectId: filters.subjectId ?? "",
          assigneeId: filters.assigneeId ?? "",
          showCompleted: filters.showCompleted !== "false",
        }}
      />
    </>
  );
}

export default async function CalendarPage({ params, searchParams }: CalendarPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  return (
    <PageStack>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData locale={locale as AppLocale} searchParams={resolvedSearchParams} />
      </Suspense>
    </PageStack>
  );
}
