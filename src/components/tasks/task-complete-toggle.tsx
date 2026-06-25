"use client";

import { useState, useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { cn } from "@/lib/utils";

type TaskCompleteToggleProps = {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
  className?: string;
};

export function TaskCompleteToggle({ taskId, status, canEdit, className }: TaskCompleteToggleProps) {
  const t = useTranslations("tasks.quickActions");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null);
  const [syncedStatus, setSyncedStatus] = useState(status);

  if (status !== syncedStatus) {
    setSyncedStatus(status);
    if (optimisticStatus !== null && optimisticStatus === status) {
      setOptimisticStatus(null);
    }
  }

  const displayStatus = optimisticStatus ?? status;
  const isDone = displayStatus === "COMPLETED";

  if (!canEdit) {
    return (
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          isDone ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40",
          className,
        )}
        aria-hidden="true"
      >
        {isDone ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
      </span>
    );
  }

  function toggle() {
    const nextStatus = isDone ? "TODO" : "COMPLETED";
    setOptimisticStatus(nextStatus);

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, nextStatus);
      if (result.success) {
        setOptimisticStatus(null);
        router.refresh();
      } else {
        setOptimisticStatus(null);
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      aria-label={isDone ? t("reopen") : t("complete")}
      className={cn(
        "mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors duration-200",
        isDone
          ? "border-emerald-500 bg-emerald-500 hover:border-emerald-600 hover:bg-emerald-600"
          : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10",
        className,
      )}
    >
      {isDone ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
    </button>
  );
}
