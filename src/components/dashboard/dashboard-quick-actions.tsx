"use client";

import { TaskQuickAdd } from "@/components/tasks/task-quick-add";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

type DashboardQuickActionsProps = {
  userName: string;
  projectId: string;
  lists: { id: string; nameUz: string; nameJa: string; color: string }[];
  labels: { id: string; nameUz: string; nameJa: string; color: string }[];
};

export function DashboardQuickActions({
  userName,
  projectId,
  lists,
  labels,
}: DashboardQuickActionsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-display">{t("title")}</h1>
        <p className="text-caption text-pretty">{t("description")}</p>
        <div className="space-y-1 pt-1">
          <p className="text-title-lg">
            {t("greeting")}, {userName}
          </p>
          <p className="text-body-sm text-muted-foreground text-pretty">{t("focusHint")}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <TaskQuickAdd projectId={projectId} lists={lists} labels={labels} />
        <Button variant="outline" className="cursor-pointer" render={<Link href="/tasks" />}>
          <LayoutGrid className="size-4" />
          {t("openKanban")}
        </Button>
      </div>
    </div>
  );
}
