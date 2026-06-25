"use client";

import { useState, useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import { createKanbanTask } from "@/lib/actions/tasks";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ListOption = {
  id: string;
  nameUz: string;
  nameJa: string;
  color: string;
};

type KanbanAddCardProps = {
  locale: AppLocale;
  status: TaskStatus;
  projectId: string;
  lists: ListOption[];
  defaultListId?: string;
  className?: string;
};

export function KanbanAddCard({
  locale,
  status,
  projectId,
  lists,
  defaultListId,
  className,
}: KanbanAddCardProps) {
  const appLocale = useAppLocale();
  const t = useTranslations("tasks.kanban");
  const tQuick = useTranslations("tasks.quickAdd");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState(defaultListId ?? lists[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const selectedList = lists.find((list) => list.id === listId);

  function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2) return;

    startTransition(async () => {
      const result = await createKanbanTask({
        projectId,
        title: trimmed,
        status,
        locale,
        subjectId: listId || undefined,
      });
      if (result.success) {
        setTitle("");
        setOpen(false);
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium transition-colors duration-200 hover:bg-muted/50",
              className,
            )}
          >
            <Plus className="size-4" />
            {t("addCard")}
          </button>
        }
      />
      <DialogContent closeLabel={tQuick("cancel")} className="max-w-md">
        <DialogTitle className="px-5 pt-5">{tQuick("title")}</DialogTitle>
        <DialogBody className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="kanban-task-title">{tQuick("taskName")}</Label>
            <textarea
              id="kanban-task-title"
              value={title}
              autoFocus
              rows={2}
              disabled={isPending}
              placeholder={tQuick("taskNamePlaceholder")}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              className="text-task-title min-h-16 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {lists.length > 0 ? (
            <div className="space-y-2">
              <Label>{tQuick("list")}</Label>
              <Select
                value={listId}
                onValueChange={(value) => value && setListId(value)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <span>
                    {selectedList
                      ? pickLocalized(appLocale, selectedList.nameUz, selectedList.nameJa)
                      : tQuick("listPlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        {pickLocalized(appLocale, list.nameUz, list.nameJa)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {tQuick("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={isPending || title.trim().length < 2}
            onClick={submit}
          >
            {tQuick("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
