"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createQuickEvent, type QuickEventState } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualFieldPair } from "@/components/shared/bilingual-field-pair";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pickLocalized } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/i18n/routing";

type ProjectOption = {
  id: string;
  nameUz: string;
  nameJa: string;
};

type QuickEventFormProps = {
  locale: AppLocale;
  projects: ProjectOption[];
};

const initialState: QuickEventState = { success: false };

type QuickEventFieldsProps = {
  locale: AppLocale;
  projects: ProjectOption[];
  state: QuickEventState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
};

function QuickEventFields({
  locale,
  projects,
  state,
  formAction,
  isPending,
}: QuickEventFieldsProps) {
  const t = useTranslations("dashboard.quickEvent");
  const [projectId, setProjectId] = useState("");

  return (
    <form action={formAction} className="space-y-3">
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      <div className="space-y-2">
        <Label htmlFor="event-project">{t("project")}</Label>
        <Select
          value={projectId || "none"}
          onValueChange={(value) => setProjectId(!value || value === "none" ? "" : value)}
        >
          <SelectTrigger id="event-project" className="w-full cursor-pointer">
            <SelectValue placeholder={t("noProject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noProject")}</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {pickLocalized(locale, project.nameUz, project.nameJa)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BilingualFieldPair
        uzName="titleUz"
        jaName="titleJa"
        uzLabel={t("titleUz")}
        jaLabel={t("titleJa")}
        fieldType="title"
        maxLength={200}
        required
        uzId="event-titleUz"
        jaId="event-titleJa"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startAt">{t("startAt")}</Label>
          <Input id="startAt" name="startAt" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt">{t("endAt")}</Label>
          <Input id="endAt" name="endAt" type="datetime-local" required />
        </div>
      </div>
      <label className="text-label flex items-center gap-2">
        <input type="checkbox" name="allDay" className="size-4 rounded border-input" />
        {t("allDay")}
      </label>
      {state.formError ? (
        <p className="text-form-error">{t(`errors.${state.formError}`)}</p>
      ) : null}
      {state.success ? (
        <p className="text-form-success">{t("success")}</p>
      ) : null}
      <Button type="submit" className="cursor-pointer" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

export function QuickEventForm({ locale, projects }: QuickEventFormProps) {
  const t = useTranslations("dashboard.quickEvent");
  const [state, formAction, isPending] = useActionState(createQuickEvent, initialState);
  const formKey = state.success ? "success" : "ready";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <QuickEventFields
          key={formKey}
          locale={locale}
          projects={projects}
          state={state}
          formAction={formAction}
          isPending={isPending}
        />
      </CardContent>
    </Card>
  );
}
