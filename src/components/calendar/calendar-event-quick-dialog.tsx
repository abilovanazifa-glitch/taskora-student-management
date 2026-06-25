"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { createEvent } from "@/lib/actions/events";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { toDateTimeLocalValue } from "@/components/calendar/calendar-event-form-sheet";
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
  SelectValue,
} from "@/components/ui/select";

type CalendarEventQuickDialogProps = {
  locale: AppLocale;
  projects: { id: string; nameUz: string; nameJa: string }[];
  trigger: ReactElement;
};

function defaultEventRange() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    startAt: toDateTimeLocalValue(start),
    endAt: toDateTimeLocalValue(end),
  };
}

export function CalendarEventQuickDialog({
  locale,
  projects,
  trigger,
}: CalendarEventQuickDialogProps) {
  const t = useTranslations("calendar.quickCreate");
  const tForm = useTranslations("calendar.form");
  const router = useRouter();
  const { toast } = useAppToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    const range = defaultEventRange();
    setTitle("");
    setProjectId("");
    setStartAt(range.startAt);
    setEndAt(range.endAt);
    setAllDay(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) resetForm();
  }

  function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2 || !startAt || !endAt) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("titleUz", trimmed);
      formData.set("titleJa", trimmed);
      formData.set("descriptionUz", "");
      formData.set("descriptionJa", "");
      formData.set("startAt", startAt);
      formData.set("endAt", endAt);
      if (allDay) formData.set("allDay", "on");
      if (projectId) formData.set("projectId", projectId);

      const result = await createEvent({ success: false }, formData);
      if (result.success) {
        toast(tForm("created"), "success");
        setOpen(false);
        router.refresh();
      } else {
        toast(tForm(`errors.${result.formError ?? "saveFailed"}`), "error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent closeLabel={t("cancel")} className="max-w-md">
        <DialogTitle className="px-5 pt-5">{t("title")}</DialogTitle>
        <DialogBody className="space-y-4 pt-2">
          <textarea
            value={title}
            autoFocus
            rows={2}
            disabled={isPending}
            placeholder={t("titlePlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            className="text-task-title min-h-16 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="space-y-2">
            <Label htmlFor="event-quick-project">{tForm("project")}</Label>
            <Select
              value={projectId || "none"}
              onValueChange={(value) => setProjectId(!value || value === "none" ? "" : value)}
              disabled={isPending}
            >
              <SelectTrigger id="event-quick-project" className="w-full cursor-pointer">
                <SelectValue placeholder={tForm("noProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{tForm("noProject")}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {pickLocalized(locale, project.nameUz, project.nameJa)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-quick-start">{tForm("startAt")}</Label>
              <Input
                id="event-quick-start"
                type="datetime-local"
                value={startAt}
                disabled={isPending}
                onChange={(event) => setStartAt(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-quick-end">{tForm("endAt")}</Label>
              <Input
                id="event-quick-end"
                type="datetime-local"
                value={endAt}
                disabled={isPending}
                onChange={(event) => setEndAt(event.target.value)}
                required
              />
            </div>
          </div>

          <label className="text-label flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allDay}
              disabled={isPending}
              onChange={(event) => setAllDay(event.target.checked)}
              className="size-4 rounded border-input"
            />
            {tForm("allDay")}
          </label>

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
            disabled={isPending || title.trim().length < 2 || !startAt || !endAt}
            onClick={submit}
          >
            {isPending ? tForm("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
