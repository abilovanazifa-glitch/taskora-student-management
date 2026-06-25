"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { ProjectStatus } from "@prisma/client";
import {
  createProject,
  updateProject,
  type ProjectActionState,
} from "@/lib/actions/projects";
import type { ProjectErrorCode } from "@/lib/validations/project";
import { pickLocalized, buildBilingualFieldValues } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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

type ProjectFormValues = {
  nameUz: string;
  nameJa: string;
  descriptionUz: string;
  descriptionJa: string;
  color: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
};

type ProjectFormSheetProps = {
  mode: "create" | "edit";
  projectId?: string;
  initialValues?: ProjectFormValues;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const defaultValues: ProjectFormValues = {
  nameUz: "",
  nameJa: "",
  descriptionUz: "",
  descriptionJa: "",
  color: "#6366f1",
  startDate: "",
  endDate: "",
  status: "PLANNED",
};

const PRESET_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;

const initialState: ProjectActionState = { success: false };

export function ProjectFormSheet({
  mode,
  projectId,
  initialValues = defaultValues,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProjectFormSheetProps) {
  const t = useTranslations("projects.form");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(initialValues.color);
  const [status, setStatus] = useState<ProjectStatus>(initialValues.status);
  const [clientNameError, setClientNameError] = useState<string | null>(null);
  const isControlled = controlledOpen !== undefined;
  const userOpen = isControlled ? controlledOpen : internalOpen;

  const setUserOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const action =
    mode === "create"
      ? createProject
      : updateProject.bind(null, projectId ?? "");

  const [state, formAction, isPending] = useActionState(
    async (prev: ProjectActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.success) {
        return result;
      }

      if (result.projectId && mode === "create") {
        router.push(`/projects/${result.projectId}`);
      } else {
        router.refresh();
        if (isControlled) {
          onOpenChange?.(false);
        } else {
          setInternalOpen(false);
        }
      }

      return result;
    },
    initialState,
  );

  const openValuesKey = userOpen
    ? `${locale}:${initialValues.nameUz}:${initialValues.color}:${initialValues.status}`
    : "";
  const [syncedOpenKey, setSyncedOpenKey] = useState("");

  if (userOpen && openValuesKey !== syncedOpenKey) {
    setSyncedOpenKey(openValuesKey);
    setName(pickLocalized(locale, initialValues.nameUz, initialValues.nameJa));
    setDescription(
      pickLocalized(locale, initialValues.descriptionUz, initialValues.descriptionJa),
    );
    setColor(initialValues.color);
    setStatus(initialValues.status);
    setClientNameError(null);
  }

  if (!userOpen && syncedOpenKey !== "") {
    setSyncedOpenKey("");
  }

  function fieldError(field: string) {
    const code = state.fieldErrors?.[field] as ProjectErrorCode | undefined;
    return code ? t(`errors.${code}`) : null;
  }

  const nameError = clientNameError ?? fieldError("nameUz") ?? fieldError("nameJa");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      event.preventDefault();
      setClientNameError(t("errors.nameMinLength"));
      return;
    }

    setClientNameError(null);
  }

  const bilingualFields = buildBilingualFieldValues(
    locale,
    { name, description },
    initialValues,
    mode,
  );

  return (
    <Dialog open={userOpen} onOpenChange={setUserOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent closeLabel={tCommon("close")} className="max-w-md">
        <DialogTitle className="px-5 pt-5">
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </DialogTitle>
        <form action={formAction} onSubmit={handleSubmit}>
          <input type="hidden" name="nameUz" value={bilingualFields.nameUz} />
          <input type="hidden" name="nameJa" value={bilingualFields.nameJa} />
          <input type="hidden" name="descriptionUz" value={bilingualFields.descriptionUz} />
          <input type="hidden" name="descriptionJa" value={bilingualFields.descriptionJa} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="status" value={mode === "create" ? "PLANNED" : status} />
          <input type="hidden" name="startDate" value={initialValues.startDate} />
          <input type="hidden" name="endDate" value={initialValues.endDate} />

          <DialogBody className="space-y-4 pt-2">
            <div className="space-y-2">
              <textarea
                value={name}
                autoFocus
                rows={2}
                disabled={isPending}
                placeholder={t("namePlaceholder")}
                onChange={(event) => {
                  setName(event.target.value);
                  if (clientNameError && event.target.value.trim().length >= 2) {
                    setClientNameError(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    setUserOpen(false);
                  }
                }}
                className="text-task-title min-h-14 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {nameError ? <p className="text-form-error">{nameError}</p> : null}
            </div>

            <textarea
              value={description}
              rows={2}
              disabled={isPending}
              placeholder={t("descriptionPlaceholder")}
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setUserOpen(false);
                }
              }}
              className="text-body-sm min-h-12 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <div className="space-y-2">
              <p className="text-label">{t("color")}</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isPending}
                    aria-label={t("colorPreset", { color: preset })}
                    aria-pressed={color === preset}
                    onClick={() => setColor(preset)}
                    className={cn(
                      "size-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-105",
                      color === preset
                        ? "border-foreground ring-2 ring-primary/30"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: preset }}
                  />
                ))}
                <label className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted/40">
                  <input
                    type="color"
                    value={color}
                    disabled={isPending}
                    onChange={(event) => setColor(event.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label={t("colorCustom")}
                  />
                  <span
                    className="size-6 rounded-full border border-border/60"
                    style={{ backgroundColor: color }}
                  />
                </label>
              </div>
              <p className="text-caption">{t("colorHint")}</p>
            </div>

            {mode === "edit" ? (
              <Select
                value={status}
                onValueChange={(value) => value && setStatus(value as ProjectStatus)}
                disabled={isPending}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer sm:w-auto sm:min-w-[8rem]">
                  <span>{t(`statuses.${status}`)}</span>
                </SelectTrigger>
                <SelectContent>
                  {(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`statuses.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {state.formError ? (
              <p className="text-form-error">{t(`errors.${state.formError}`)}</p>
            ) : null}

            <p className="text-caption">{t("hint")}</p>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              disabled={isPending}
              onClick={() => setUserOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isPending || name.trim().length < 2}
            >
              {isPending
                ? t("submitting")
                : mode === "create"
                  ? t("create")
                  : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
