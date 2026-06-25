import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import { auth } from "@/auth";
import { getProfileUser } from "@/lib/actions/profile";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileLogoutButton } from "@/components/profile/profile-logout-button";
import { getProfileStats } from "@/lib/queries/profile";

import type { AppLocale } from "@/i18n/routing";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await getProfileUser();
  if (!user) {
    notFound();
  }

  const stats = await getProfileStats(session.user.id);
  const t = await getAppTranslations(locale as AppLocale, "profile");

  return (
    <PageStack size="medium">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")}>
        <ProfileLogoutButton />
      </PageHeader>
      <ProfileForm user={user} stats={stats} />
    </PageStack>
  );
}
