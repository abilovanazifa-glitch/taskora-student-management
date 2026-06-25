"use client";

import { useActionState, useState, useTransition } from "react";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { Copy, LogOut, Trash2, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { ProjectMemberRole } from "@prisma/client";
import {
  cancelProjectInvitation,
  inviteProjectMember,
  type InvitationActionState,
} from "@/lib/actions/invitations";
import {
  leaveProject,
  removeProjectMember,
  transferProjectOwnership,
  updateProjectMemberRole,
  type MemberActionState,
} from "@/lib/actions/members";
import {
  canChangeMemberRole,
  canRemoveMember,
} from "@/lib/permissions/members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";

type MemberItem = {
  id: string;
  role: ProjectMemberRole;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
};

type PendingInvitation = {
  id: string;
  invitedEmail: string;
  role: ProjectMemberRole;
  expiresAt: Date;
  inviter: { fullName: string };
};

type ProjectMembersPanelProps = {
  locale: AppLocale;
  projectId: string;
  ownerId: string;
  currentUserId: string;
  actorRole: ProjectMemberRole | null;
  members: MemberItem[];
  pendingInvitations: PendingInvitation[];
  permissions: {
    canManageMembers: boolean;
    canTransferOwnership: boolean;
    canLeave: boolean;
  };
};

const inviteInitial: InvitationActionState = { success: false };
const memberInitial: MemberActionState = { success: false };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const assignableRoles: ProjectMemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export function ProjectMembersPanel({
  locale,
  projectId,
  ownerId,
  currentUserId,
  actorRole,
  members,
  pendingInvitations,
  permissions,
}: ProjectMembersPanelProps) {
  const t = useTranslations("members");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [transferTarget, setTransferTarget] = useState("");
  const dateLocale = getDateLocale(locale);

  const inviteAction = inviteProjectMember.bind(null, projectId, locale);
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    inviteAction,
    inviteInitial,
  );
  const [, , rolePending] = useActionState(
    updateProjectMemberRole.bind(null, projectId),
    memberInitial,
  );
  const [transferState, transferFormAction, transferPending] = useActionState(
    transferProjectOwnership.bind(null, projectId),
    memberInitial,
  );

  const inviteFormKey = inviteState.success ? "invited" : "invite";
  const transferCandidates = members.filter(
    (member) => member.user.id !== currentUserId && member.user.id !== ownerId,
  );

  function refresh() {
    router.refresh();
  }

  function handleRemove(memberId: string) {
    if (!window.confirm(t("confirmRemove"))) return;
    startTransition(async () => {
      await removeProjectMember(projectId, memberId);
      refresh();
    });
  }

  function handleCancelInvitation(invitationId: string) {
    startTransition(async () => {
      await cancelProjectInvitation(projectId, invitationId);
      refresh();
    });
  }

  function handleLeave() {
    if (!window.confirm(t("confirmLeave"))) return;
    startTransition(async () => {
      const result = await leaveProject(projectId);
      if (result.success) {
        router.push("/projects");
      }
    });
  }

  async function copyInvitationLink() {
    if (!inviteState.invitationLink) return;
    await navigator.clipboard.writeText(inviteState.invitationLink);
  }

  return (
    <div className="page-section">
      {permissions.canManageMembers ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("invite.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form key={inviteFormKey} action={inviteFormAction} className="space-y-4">
              <input type="hidden" name="role" value={inviteRole} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{t("invite.email")}</Label>
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    placeholder={t("invite.emailPlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">{t("invite.role")}</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => {
                      if (value) setInviteRole(value as typeof inviteRole);
                    }}
                  >
                    <SelectTrigger id="invite-role" className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`roles.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {inviteState.formError ? (
                <p className="text-form-error">{t(`errors.${inviteState.formError}`)}</p>
              ) : null}
              {inviteState.success && inviteState.invitationLink ? (
                <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
                  <p className="text-body-sm font-medium">{t("invite.linkReady")}</p>
                  <p className="text-body-sm break-all">{inviteState.invitationLink}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => void copyInvitationLink()}
                  >
                    <Copy className="size-4" />
                    {t("invite.copyLink")}
                  </Button>
                </div>
              ) : null}
              <Button type="submit" className="cursor-pointer" disabled={invitePending}>
                {invitePending ? t("invite.submitting") : t("invite.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{t("list.title")}</CardTitle>
          {permissions.canLeave ? (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleLeave}
              disabled={isPending}
            >
              <LogOut className="size-4" />
              {t("leaveProject")}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState title={t("list.empty")} />
          ) : (
            <ul className="space-y-3">
              {members.map((member) => {
                const canEditRole =
                  actorRole &&
                  member.user.id !== ownerId &&
                  member.user.id !== currentUserId &&
                  assignableRoles.some((role) =>
                    canChangeMemberRole(actorRole, member.role, role),
                  );
                const canRemove =
                  actorRole &&
                  canRemoveMember(
                    actorRole,
                    member.role,
                    currentUserId,
                    member.user.id,
                    ownerId,
                  );

                return (
                  <li
                    key={member.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {member.user.avatarUrl ? (
                          <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
                        ) : null}
                        <AvatarFallback>{initials(member.user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.fullName}</p>
                        <p className="text-caption">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canEditRole ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            if (!value || value === member.role) return;
                            const formData = new FormData();
                            formData.set("memberId", member.id);
                            formData.set("role", value);
                            startTransition(async () => {
                              await updateProjectMemberRole(projectId, memberInitial, formData);
                              refresh();
                            });
                          }}
                        >
                            <SelectTrigger className="w-36 cursor-pointer" aria-label={t("changeRole")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {t(`roles.${role}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      ) : (
                        <span className="text-caption">{t(`roles.${member.role}`)}</span>
                      )}
                      {canRemove ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-destructive"
                          onClick={() => handleRemove(member.id)}
                          disabled={isPending}
                          aria-label={t("removeMember")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {rolePending ? (
            <p className="text-caption mt-3">{t("updatingRole")}</p>
          ) : null}
        </CardContent>
      </Card>

      {permissions.canManageMembers ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pending.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <EmptyState title={t("pending.empty")} />
            ) : (
              <ul className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{invitation.invitedEmail}</p>
                      <p className="text-caption">
                        {t(`roles.${invitation.role}`)} · {t("pending.expires")}{" "}
                        {format(invitation.expiresAt, "PPp", { locale: dateLocale })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isPending}
                    >
                      {t("pending.cancel")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {permissions.canTransferOwnership && transferCandidates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="size-4" />
              {t("transfer.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={transferFormAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <input type="hidden" name="newOwnerId" value={transferTarget} />
              <div className="flex-1 space-y-2">
                <Label htmlFor="transfer-target">{t("transfer.selectMember")}</Label>
                <Select value={transferTarget} onValueChange={(value) => setTransferTarget(value ?? "")}>
                  <SelectTrigger id="transfer-target" className="w-full cursor-pointer">
                    <SelectValue placeholder={t("transfer.selectMember")} />
                  </SelectTrigger>
                  <SelectContent>
                    {transferCandidates.map((member) => (
                      <SelectItem key={member.id} value={member.user.id}>
                        {member.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="cursor-pointer"
                disabled={transferPending || !transferTarget}
              >
                {transferPending ? t("transfer.submitting") : t("transfer.submit")}
              </Button>
            </form>
            <p className="text-caption mt-2">{t("transfer.hint")}</p>
            {transferState.formError ? (
              <p className="text-form-error mt-2">{t(`errors.${transferState.formError}`)}</p>
            ) : null}
            {transferState.success ? (
              <p className="mt-2 text-form-success">{t("transfer.success")}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
