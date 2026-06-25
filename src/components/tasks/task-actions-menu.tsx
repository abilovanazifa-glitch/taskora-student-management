"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Archive,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deleteTask,
  duplicateTask,
} from "@/lib/actions/tasks";
import { archiveTask } from "@/lib/actions/task-extras";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskActionsMenuProps = {
  taskId: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
  onEdit?: () => void;
};

export function TaskActionsMenu({
  taskId,
  permissions,
  onEdit,
}: TaskActionsMenuProps) {
  const t = useTranslations("tasks.actions");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ success: boolean; formError?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast(successMessage, "success");
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    runAction(() => deleteTask(taskId), t("deleted"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            disabled={isPending}
            aria-label={t("menu")}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && permissions.canEdit ? (
          <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
            <Pencil className="size-4" />
            {t("edit")}
          </DropdownMenuItem>
        ) : null}
        {permissions.canEdit ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => runAction(() => archiveTask(taskId), t("archived"))}
          >
            <Archive className="size-4" />
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
        {permissions.canEdit ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => runAction(() => duplicateTask(taskId), t("duplicated"))}
          >
            <Copy className="size-4" />
            {t("duplicate")}
          </DropdownMenuItem>
        ) : null}
        {permissions.canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              {t("delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
