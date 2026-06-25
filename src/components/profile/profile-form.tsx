"use client";

import { useActionState, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { Pencil } from "lucide-react";
import type { PreferredLanguage, Theme } from "@prisma/client";
import { updateProfile, type ProfileUpdateState } from "@/lib/actions/profile";
import type { AuthErrorCode } from "@/lib/validations/auth";
import { dbThemeToNextTheme, nextThemeToDbTheme, preferredLanguageToLocale } from "@/lib/i18n/locale";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileAvatarUpload } from "@/components/profile/profile-avatar-upload";

type ProfileUser = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  preferredLanguage: PreferredLanguage;
  theme: Theme;
  createdAt: Date;
};

type ProfileStats = {
  projectCount: number;
  taskCount: number;
  completedTaskCount: number;
};

type ProfileFormProps = {
  user: ProfileUser;
  stats: ProfileStats;
};

const initialState: ProfileUpdateState = { success: false };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function languageLabel(
  language: PreferredLanguage,
  tAuth: ReturnType<typeof useTranslations<"auth">>,
) {
  if (language === "JA") return tAuth("languages.ja");
  if (language === "EN") return tAuth("languages.en");
  return tAuth("languages.uz");
}

function themeLabel(theme: Theme, t: ReturnType<typeof useTranslations<"profile">>) {
  if (theme === "DARK") return t("themes.dark");
  if (theme === "SYSTEM") return t("themes.system");
  return t("themes.light");
}

type ProfileEditFormProps = {
  defaults: {
    fullName: string;
    avatarUrl: string;
    preferredLanguage: PreferredLanguage;
    theme: Theme;
  };
  email: string;
  state: ProfileUpdateState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  onCancel: () => void;
};

function ProfileEditForm({
  defaults,
  email,
  state,
  formAction,
  isPending,
  onCancel,
}: ProfileEditFormProps) {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [preferredLanguage, setPreferredLanguage] = useState(defaults.preferredLanguage);
  const [theme, setThemeValue] = useState<Theme>(defaults.theme);
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatarUrl);

  function fieldError(field: string) {
    const code = state.fieldErrors?.[field] as AuthErrorCode | undefined;
    return code ? tAuth(`errors.${code}`) : null;
  }

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DialogBody className="space-y-5 pt-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">{tAuth("name")}</Label>
          <Input id="fullName" name="fullName" defaultValue={defaults.fullName} required />
          {fieldError("fullName") ? (
            <p className="text-form-error">{fieldError("fullName")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{tAuth("email")}</Label>
          <Input id="email" value={email} disabled readOnly />
        </div>

        <ProfileAvatarUpload
          fullName={defaults.fullName}
          avatarUrl={avatarUrl}
          onAvatarChange={setAvatarUrl}
        />

        <input type="hidden" name="avatarUrl" value={avatarUrl} />

        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">{tAuth("preferredLanguage")}</Label>
          <input type="hidden" name="preferredLanguage" value={preferredLanguage} />
          <Select
            value={preferredLanguage}
            onValueChange={(value) => setPreferredLanguage(value as PreferredLanguage)}
          >
            <SelectTrigger id="preferredLanguage" className="w-full cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JA">{tAuth("languages.ja")}</SelectItem>
              <SelectItem value="UZ">{tAuth("languages.uz")}</SelectItem>
              <SelectItem value="EN">{tAuth("languages.en")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">{t("theme")}</Label>
          <input type="hidden" name="theme" value={theme} />
          <Select
            value={theme}
            onValueChange={(value) => {
              setThemeValue(value as Theme);
            }}
          >
            <SelectTrigger id="theme" className="w-full cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIGHT">{t("themes.light")}</SelectItem>
              <SelectItem value="DARK">{t("themes.dark")}</SelectItem>
              <SelectItem value="SYSTEM">{t("themes.system")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {state.formError ? (
          <p className="text-form-error" role="alert">
            {tAuth(`errors.${state.formError}`)}
          </p>
        ) : null}

        {state.success ? (
          <p className="text-form-success" role="status">
            {t("saveSuccess")}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer"
          disabled={isPending}
          onClick={onCancel}
        >
          {tCommon("close")}
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={isPending}>
          {isPending ? t("saving") : t("saveChanges")}
        </Button>
      </DialogFooter>
    </form>
  );
}

type ProfilePropertyRowProps = {
  label: string;
  value: string;
};

function ProfilePropertyRow({ label, value }: ProfilePropertyRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-body-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-body-sm font-medium break-words sm:text-right">{value}</dd>
    </div>
  );
}

type ProfileStatTileProps = {
  label: string;
  value: number;
};

function ProfileStatTile({ label, value }: ProfileStatTileProps) {
  return (
    <div className="rounded-2xl bg-muted/25 p-5 ring-1 ring-border/50">
      <p className="text-caption">{label}</p>
      <p className="text-title-lg mt-1 tabular-nums">{value}</p>
    </div>
  );
}

export function ProfileForm({ user, stats }: Omit<ProfileFormProps, "locale">) {
  const locale = useAppLocale();
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { update } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (prev: ProfileUpdateState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result.success && result.data) {
        await update({
          fullName: result.data.fullName,
          preferredLanguage: result.data.preferredLanguage,
          theme: result.data.theme,
          avatarUrl: result.data.avatarUrl,
        });

        setTheme(dbThemeToNextTheme(result.data.theme));
        setEditOpen(false);

        const nextLocale = preferredLanguageToLocale(result.data.preferredLanguage);
        if (nextLocale !== locale) {
          window.location.assign(`/${nextLocale}/profile`);
          return result;
        }

        router.refresh();
      }

      return result;
    },
    initialState,
  );

  const activeProfile =
    state.success && state.data
      ? {
          fullName: state.data.fullName,
          avatarUrl: state.data.avatarUrl,
          preferredLanguage: state.data.preferredLanguage,
          theme: state.data.theme,
        }
      : {
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          preferredLanguage: user.preferredLanguage,
          theme: user.theme,
        };

  const formKey = state.success && state.data ? JSON.stringify(state.data) : "initial";

  const dateLocale = getDateLocale(locale);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/60 pb-5">
          <div className="min-w-0 space-y-1">
            <CardTitle>{t("overview")}</CardTitle>
            <CardDescription>{t("overviewDescription")}</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 cursor-pointer gap-2"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4 shrink-0" />
            {t("editAction")}
          </Button>
        </CardHeader>

        <CardContent className="space-y-8 pb-8 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-20 shrink-0 sm:size-24">
              {activeProfile.avatarUrl ? (
                <AvatarImage src={activeProfile.avatarUrl} alt={activeProfile.fullName} />
              ) : null}
              <AvatarFallback className="text-xl">{initials(activeProfile.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="text-title-lg break-words">{activeProfile.fullName}</p>
              <p className="text-body-sm text-muted-foreground break-all">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileStatTile label={t("stats.projects")} value={stats.projectCount} />
            <ProfileStatTile label={t("stats.tasks")} value={stats.taskCount} />
            <ProfileStatTile
              label={t("stats.completedTasks")}
              value={stats.completedTaskCount}
            />
          </div>

          <dl>
            <ProfilePropertyRow label={tAuth("email")} value={user.email} />
            <ProfilePropertyRow
              label={tAuth("preferredLanguage")}
              value={languageLabel(activeProfile.preferredLanguage, tAuth)}
            />
            <ProfilePropertyRow
              label={t("theme")}
              value={themeLabel(activeProfile.theme, t)}
            />
            <ProfilePropertyRow
              label={t("memberSince")}
              value={format(user.createdAt, "d MMMM yyyy", { locale: dateLocale })}
            />
          </dl>

          {state.success && !editOpen ? (
            <p className="text-form-success" role="status">
              {t("saveSuccess")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent closeLabel={tCommon("close")} className="max-w-md">
          <DialogTitle className="px-5 pt-5">{t("editTitle")}</DialogTitle>
          <p className="text-body-sm text-muted-foreground px-5">{t("editDescription")}</p>
          <ProfileEditForm
            key={formKey}
            defaults={{
              fullName: activeProfile.fullName,
              avatarUrl: activeProfile.avatarUrl ?? "",
              preferredLanguage: activeProfile.preferredLanguage,
              theme: resolvedTheme ? nextThemeToDbTheme(resolvedTheme) : activeProfile.theme,
            }}
            email={user.email}
            state={state}
            formAction={formAction}
            isPending={isPending}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
