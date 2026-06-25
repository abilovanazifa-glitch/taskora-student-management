"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createQuickTask, type QuickTaskState } from "@/lib/actions/tasks";
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
  color: string;
};

type QuickTaskFormProps = {
  locale: AppLocale;
  projects: ProjectOption[];
};

const initialState: QuickTaskState = { success: false };

type QuickTaskFieldsProps = {
  locale: AppLocale;
  projects: ProjectOption[];
  state: QuickTaskState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
};

function QuickTaskFields({
  locale,
  projects,
  state,
  formAction,
  isPending,
}: QuickTaskFieldsProps) {
  const t = useTranslations("dashboard.quickTask");
  const tTasks = useTranslations("tasks");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="priority" value={priority} />
      <div className="space-y-2">
        <Label htmlFor="quick-task-project">{t("project")}</Label>
        <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
          <SelectTrigger id="quick-task-project" className="w-full cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        uzId="titleUz"
        jaId="titleJa"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deadline">{t("deadline")}</Label>
          <Input id="deadline" name="deadline" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">{tTasks("priority")}</Label>
          <Select
            value={priority}
            onValueChange={(value) => {
              if (value) setPriority(value as typeof priority);
            }}
          >
            <SelectTrigger id="priority" className="w-full cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {tTasks(`priorities.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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

export function QuickTaskForm({ locale, projects }: QuickTaskFormProps) {
  const t = useTranslations("dashboard.quickTask");
  const [state, formAction, isPending] = useActionState(createQuickTask, initialState);
  const formKey = state.success ? "success" : "ready";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-caption">{t("noProjects")}</p>
        ) : (
          <QuickTaskFields
            key={formKey}
            locale={locale}
            projects={projects}
            state={state}
            formAction={formAction}
            isPending={isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}
