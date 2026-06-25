"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { acceptProjectInvitation, declineProjectInvitation } from "@/lib/actions/invitations";
import { pickLocalized } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InvitationResponseProps = {
  locale: AppLocale;
  token: string;
  invitation: {
    status: string;
    invitedEmail: string;
    role: string;
    expiresAt: Date;
    project: {
      id: string;
      nameUz: string;
      nameJa: string;
      color: string;
    };
    inviter: { fullName: string };
  };
  userEmail: string;
};

export function InvitationResponse({ locale, token, invitation, userEmail }: InvitationResponseProps) {
  const t = useTranslations("invitations");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const emailMatches =
    userEmail.toLowerCase() === invitation.invitedEmail.toLowerCase();
  const isPendingInvitation = invitation.status === "PENDING";

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptProjectInvitation(token);
      if (result.success && result.projectId) {
        router.push(`/projects/${result.projectId}`);
      }
      router.refresh();
    });
  }

  function handleDecline() {
    startTransition(async () => {
      await declineProjectInvitation(token);
      router.push("/projects");
    });
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("response.title")}</CardTitle>
        <CardDescription>{t("response.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className="size-4 rounded-full"
            style={{ backgroundColor: invitation.project.color }}
          />
          <div>
            <p className="font-semibold">
              {pickLocalized(locale, invitation.project.nameUz, invitation.project.nameJa)}
            </p>
            <p className="text-caption">
              {t("response.invitedAs", { role: t(`roles.${invitation.role}`) })}
            </p>
          </div>
        </div>
        <p className="text-caption">
          {t("response.invitedBy", { name: invitation.inviter.fullName })}
        </p>
        <p className="text-caption">
          {t("response.invitedEmail", { email: invitation.invitedEmail })}
        </p>

        {!emailMatches ? (
          <p className="text-form-error">{t("errors.emailMismatch")}</p>
        ) : null}

        {!isPendingInvitation ? (
          <p className="text-form-error">{t(`status.${invitation.status}`)}</p>
        ) : null}

        {emailMatches && isPendingInvitation ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="cursor-pointer flex-1"
              onClick={handleAccept}
              disabled={isPending}
            >
              {isPending ? t("response.accepting") : t("response.accept")}
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer flex-1"
              onClick={handleDecline}
              disabled={isPending}
            >
              {t("response.decline")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
