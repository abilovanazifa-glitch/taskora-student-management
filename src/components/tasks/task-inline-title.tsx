"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { updateTaskTitleInline } from "@/lib/actions/tasks";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { cn } from "@/lib/utils";

type TaskInlineTitleProps = {
  taskId: string;
  titleUz: string;
  titleJa: string;
  locale: AppLocale;
  canEdit: boolean;
  className?: string;
};

export function TaskInlineTitle({
  taskId,
  titleUz,
  titleJa,
  locale,
  canEdit,
  className,
}: TaskInlineTitleProps) {
  const t = useTranslations("tasks.kanban");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const displayTitle = pickLocalized(locale, titleUz, titleJa);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function save() {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setIsEditing(false);
      return;
    }
    if (trimmed === displayTitle) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateTaskTitleInline(taskId, { title: trimmed, locale });
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        disabled={isPending}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape") {
            setIsEditing(false);
          }
        }}
        className={cn(
          "text-task-title w-full rounded-lg border border-primary/40 bg-background px-2 py-1 outline-none ring-2 ring-primary/20",
          className,
        )}
        aria-label={t("renameTask")}
      />
    );
  }

  if (!canEdit) {
    return (
      <p className={cn("text-task-title text-foreground", className)}>
        {displayTitle}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setValue(displayTitle);
        setIsEditing(true);
      }}
      className={cn(
        "text-task-title text-left text-foreground hover:text-primary cursor-pointer transition-colors duration-200",
        className,
      )}
    >
      {displayTitle}
    </button>
  );
}
