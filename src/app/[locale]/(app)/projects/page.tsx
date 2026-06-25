import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

/** Projects are hidden from the UI — tasks are the main workspace. */
export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/tasks`);
}
