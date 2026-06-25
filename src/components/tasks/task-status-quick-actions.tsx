"use client";

import { useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ClipboardCheck, Play, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type QuickActionDef = {
  status: TaskStatus;
  icon: LucideIcon;
  labelKey: "start" | "complete" | "review" | "backToProgress" | "reopen";
  emphasis?: "primary" | "success" | "default";
};

type TaskStatusQuickActionsProps = {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
  variant?: "compact" | "default";
  className?: string;
};

function getQuickActions(current: TaskStatus): QuickActionDef[] {
  if (current === "COMPLETED" || current === "CANCELLED") {
    return [{ status: "TODO", icon: RotateCcw, labelKey: "reopen", emphasis: "default" }];
  }

  const actions: QuickActionDef[] = [];

  if (current === "TODO") {
    actions.push({ status: "IN_PROGRESS", icon: Play, labelKey: "start", emphasis: "primary" });
  } else if (current === "IN_PROGRESS") {
    actions.push({
      status: "REVIEW",
      icon: ClipboardCheck,
      labelKey: "review",
      emphasis: "default",
    });
  } else if (current === "REVIEW") {
    actions.push({
      status: "IN_PROGRESS",
      icon: Play,
      labelKey: "backToProgress",
      emphasis: "default",
    });
  }

  actions.push({
    status: "COMPLETED",
    icon: CheckCircle2,
    labelKey: "complete",
    emphasis: "success",
  });

  return actions;
}

const emphasisClass: Record<NonNullable<QuickActionDef["emphasis"]>, string> = {
  primary:
    "border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/10 dark:text-primary",
  success:
    "border-emerald-500/30 text-emerald-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 dark:text-emerald-300",
  default: "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function TaskStatusQuickActions({
  taskId,
  status,
  canEdit,
  variant = "default",
  className,
}: TaskStatusQuickActionsProps) {
  const t = useTranslations("tasks.quickActions");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return null;
  }

  const actions = getQuickActions(status);

  function handleStatusChange(nextStatus: TaskStatus) {
    if (nextStatus === status || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, nextStatus);
      if (result.success) {
        toast(t("statusUpdated"), "success");
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5",
          variant === "compact" && "gap-1",
          className,
        )}
        role="group"
        aria-label={t("groupLabel")}
      >
        {actions.map(({ status: nextStatus, icon: Icon, labelKey, emphasis = "default" }) => {
          const label = t(labelKey);

          if (variant === "compact") {
            return (
              <Tooltip key={nextStatus}>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={isPending}
                      aria-label={label}
                      onClick={() => handleStatusChange(nextStatus)}
                      className={cn(
                        "cursor-pointer transition-colors duration-200",
                        emphasisClass[emphasis],
                      )}
                    />
                  }
                >
                  <Icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Button
              key={nextStatus}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange(nextStatus)}
              className={cn(
                "h-8 cursor-pointer gap-1.5 px-2.5 text-body-sm transition-colors duration-200",
                emphasisClass[emphasis],
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </Button>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
