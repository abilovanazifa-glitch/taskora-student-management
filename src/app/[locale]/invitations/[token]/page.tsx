import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAppTranslations } from "@/lib/i18n/server-locale";
import { auth } from "@/auth";
import { getInvitationByToken } from "@/lib/actions/invitations";
import { InvitationResponse } from "@/components/invitations/invitation-response";
import { PageHeader } from "@/components/layout/page-header";
import type { AppLocale } from "@/i18n/routing";

type InvitationPageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/invitations/${token}`);
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    notFound();
  }

  const t = await getAppTranslations(locale as AppLocale, "invitations");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <InvitationResponse
        locale={locale as AppLocale}
        token={token}
        invitation={invitation}
        userEmail={session.user.email ?? ""}
      />
    </div>
  );
}
