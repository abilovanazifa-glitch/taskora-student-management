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
import { createListQuick } from "@/lib/actions/subjects";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type LabelOption = {
  id: string;
  nameUz: string;
  nameJa: string;
  color: string;
};

type TaskQuickAddProps = {
  projectId: string;
  lists: ListOption[];
  labels: LabelOption[];
  defaultListId?: string;
  defaultStatus?: TaskStatus;
  className?: string;
};

export function TaskQuickAdd({
  projectId,
  lists: initialLists,
  labels,
  defaultListId,
  defaultStatus = "TODO",
  className,
}: TaskQuickAddProps) {
  const locale = useAppLocale();
  const t = useTranslations("tasks.quickAdd");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState(initialLists);
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState(defaultListId ?? initialLists[0]?.id ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedList = lists.find((list) => list.id === listId);

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2 || !projectId) return;

    startTransition(async () => {
      const result = await createKanbanTask({
        projectId,
        title: trimmed,
        status: defaultStatus,
        locale,
        subjectId: listId || undefined,
        tagIds: selectedTagIds,
        deadline: deadline || undefined,
      });
      if (result.success) {
        setTitle("");
        setDeadline("");
        setSelectedTagIds([]);
        setOpen(false);
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  function submitNewList() {
    const trimmed = newListName.trim();
    if (trimmed.length < 2) return;

    startTransition(async () => {
      const result = await createListQuick(trimmed, locale as AppLocale);
      if (result.success && result.subjectId) {
        const newList = {
          id: result.subjectId,
          nameUz: trimmed,
          nameJa: trimmed,
          color: "#6366f1",
        };
        setLists((current) => [...current, newList]);
        setListId(result.subjectId);
        setNewListName("");
        setCreatingList(false);
        router.refresh();
      } else {
        toast(tErrors("saveFailed"), "error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className={cn("cursor-pointer shadow-sm", className)}>
            <Plus className="size-4" />
            {t("trigger")}
          </Button>
        }
      />
      <DialogContent closeLabel={t("cancel")} className="max-w-lg">
        <DialogTitle className="px-5 pt-5">{t("title")}</DialogTitle>
        <DialogBody className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="quick-task-title">{t("taskName")}</Label>
            <textarea
              id="quick-task-title"
              value={title}
              autoFocus
              rows={2}
              disabled={isPending}
              placeholder={t("taskNamePlaceholder")}
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

          <div className="space-y-2">
            <Label>{t("list")}</Label>
            {creatingList ? (
              <div className="flex gap-2">
                <Input
                  value={newListName}
                  placeholder={t("newListName")}
                  disabled={isPending}
                  onChange={(event) => setNewListName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitNewList();
                    }
                  }}
                />
                <Button
                  type="button"
                  className="cursor-pointer shrink-0"
                  disabled={isPending || newListName.trim().length < 2}
                  onClick={submitNewList}
                >
                  {t("newListSubmit")}
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={listId}
                  onValueChange={(value) => value && setListId(value)}
                  disabled={isPending || lists.length === 0}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <span>
                      {selectedList
                        ? pickLocalized(locale, selectedList.nameUz, selectedList.nameJa)
                        : t("listPlaceholder")}
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
                          {pickLocalized(locale, list.nameUz, list.nameJa)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className="text-primary text-body-sm cursor-pointer hover:underline"
                  onClick={() => setCreatingList(true)}
                >
                  + {t("createList")}
                </button>
              </>
            )}
          </div>

          {labels.length > 0 ? (
            <div className="space-y-2">
              <Label>{t("labels")}</Label>
              <p className="text-caption">{t("labelsHint")}</p>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const active = selectedTagIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => toggleTag(label.id)}
                      className={cn(
                        "cursor-pointer rounded-md px-2.5 py-1 text-body-sm font-medium transition-opacity",
                        active ? "ring-2 ring-offset-1" : "opacity-70 hover:opacity-100",
                      )}
                      style={{
                        backgroundColor: `${label.color}22`,
                        color: label.color,
                        ...(active ? { ringColor: label.color } : {}),
                      }}
                    >
                      {pickLocalized(locale, label.nameUz, label.nameJa)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="quick-task-deadline">{t("dueDateOptional")}</Label>
            <Input
              id="quick-task-deadline"
              type="date"
              value={deadline}
              disabled={isPending}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>

          <p className="text-caption">{t("hint")}</p>
        </DialogBody>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={isPending || title.trim().length < 2}
            onClick={submit}
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
