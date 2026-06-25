import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type ProjectDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

/** Project detail is hidden — tasks are the main workspace. */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/tasks`);
}
