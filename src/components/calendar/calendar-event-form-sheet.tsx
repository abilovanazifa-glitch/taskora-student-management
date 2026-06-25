"use client";

import { useActionState, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  deleteEvent,
  updateEvent,
  type EventActionState,
} from "@/lib/actions/events";
import { pickLocalized } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/i18n/routing";
import { useAppToast } from "@/components/providers/app-toast-provider";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type EventFormValues = {
  projectId: string;
  titleUz: string;
  titleJa: string;
  descriptionUz: string;
  descriptionJa: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  locationUz: string;
  locationJa: string;
};

type CalendarEventFormSheetProps = {
  locale: AppLocale;
  eventId: string;
  initialValues: EventFormValues;
  projects: { id: string; nameUz: string; nameJa: string }[];
  trigger: ReactElement;
  canDelete?: boolean;
};

const initialState: EventActionState = { success: false };

const reminderOptions = [
  "ONE_DAY_BEFORE",
  "THREE_HOURS_BEFORE",
  "ONE_HOUR_BEFORE",
] as const;

export function CalendarEventFormSheet({
  locale,
  eventId,
  initialValues,
  projects,
  trigger,
  canDelete = false,
}: CalendarEventFormSheetProps) {
  const t = useTranslations("calendar.form");
  const router = useRouter();
  const { toast } = useAppToast();
  const [userOpen, setUserOpen] = useState(false);
  const [projectId, setProjectId] = useState(initialValues.projectId || "none");
  const [selectedReminders, setSelectedReminders] = useState<string[]>([
    "ONE_DAY_BEFORE",
    "ONE_HOUR_BEFORE",
  ]);

  const boundUpdate = updateEvent.bind(null, eventId);
  const [state, formAction, pending] = useActionState(
    async (prev: EventActionState, formData: FormData) => {
      const result = await boundUpdate(prev, formData);
      if (result.success) {
        toast(t("updated"), "success");
        router.refresh();
        setUserOpen(false);
      }
      return result;
    },
    initialState,
  );

  function toggleReminder(value: string) {
    setSelectedReminders((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function handleDelete() {
    if (!eventId || !window.confirm(t("confirmDelete"))) return;
    const result = await deleteEvent(eventId);
    if (result.success) {
      toast(t("deleted"), "success");
      setUserOpen(false);
      router.refresh();
    } else {
      toast(t(`errors.${result.formError ?? "deleteFailed"}`), "error");
    }
  }

  return (
    <Sheet open={userOpen} onOpenChange={setUserOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("editTitle")}</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="projectId" value={projectId === "none" ? "" : projectId} />
          {selectedReminders.map((offset) => (
            <input key={offset} type="hidden" name="reminderOffsets" value={offset} />
          ))}

          <div className="space-y-2">
            <Label htmlFor="event-project">{t("project")}</Label>
            <Select value={projectId} onValueChange={(value) => value && setProjectId(value)}>
              <SelectTrigger id="event-project" className="cursor-pointer">
                <SelectValue />
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
            initialUz={initialValues.titleUz}
            initialJa={initialValues.titleJa}
            fieldType="title"
            maxLength={200}
            required
            uzId="titleUz"
            jaId="titleJa"
          />

          <BilingualFieldPair
            uzName="descriptionUz"
            jaName="descriptionJa"
            uzLabel={t("descriptionUz")}
            jaLabel={t("descriptionJa")}
            initialUz={initialValues.descriptionUz}
            initialJa={initialValues.descriptionJa}
            fieldType="description"
            maxLength={5000}
            multiline
            rows={3}
            uzId="descriptionUz"
            jaId="descriptionJa"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="startAt" name="startAt" label={t("startAt")} type="datetime-local" defaultValue={initialValues.startAt} required />
            <Field id="endAt" name="endAt" label={t("endAt")} type="datetime-local" defaultValue={initialValues.endAt} required />
          </div>

          <label className="text-label flex items-center gap-2">
            <input type="checkbox" name="allDay" defaultChecked={initialValues.allDay} className="size-4 rounded border-input" />
            {t("allDay")}
          </label>

          <BilingualFieldPair
            uzName="locationUz"
            jaName="locationJa"
            uzLabel={t("locationUz")}
            jaLabel={t("locationJa")}
            initialUz={initialValues.locationUz}
            initialJa={initialValues.locationJa}
            fieldType="location"
            maxLength={200}
            uzId="locationUz"
            jaId="locationJa"
          />

          <div className="space-y-2">
            <Label>{t("reminders")}</Label>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleReminder(option)}
                  className="text-body-sm cursor-pointer rounded-full border px-3.5 py-1.5"
                  style={{
                    backgroundColor: selectedReminders.includes(option) ? "var(--primary)" : "transparent",
                    color: selectedReminders.includes(option) ? "var(--primary-foreground)" : "inherit",
                  }}
                >
                  {t(`reminderOffsets.${option}`)}
                </button>
              ))}
            </div>
          </div>

          {state.formError ? (
            <p className="text-form-error">{t(`errors.${state.formError}`)}</p>
          ) : null}

          <Button type="submit" className="w-full cursor-pointer" disabled={pending}>
            {pending ? t("submitting") : t("submitUpdate")}
          </Button>

          {canDelete ? (
            <Button type="button" variant="destructive" className="w-full cursor-pointer" onClick={() => void handleDelete()}>
              {t("delete")}
            </Button>
          ) : null}
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}

export function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
