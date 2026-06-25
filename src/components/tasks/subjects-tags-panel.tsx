"use client";

import { useActionState, useState, useTransition, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BookOpen, Library, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import {
  createSubject,
  deleteSubject,
  updateSubject,
  type SubjectActionState,
} from "@/lib/actions/subjects";
import {
  createTag,
  deleteTag,
  updateTag,
  type TagActionState,
} from "@/lib/actions/tags";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BilingualFieldPair } from "@/components/shared/bilingual-field-pair";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type EntityItem = {
  id: string;
  nameUz: string;
  nameJa: string;
  color: string;
  _count: { tasks: number };
};

type SubjectsTagsPanelProps = {
  locale: AppLocale;
  subjects: EntityItem[];
  tags: EntityItem[];
};

const initialSubjectState: SubjectActionState = { success: false };
const initialTagState: TagActionState = { success: false };

export function SubjectsTagsPanel({ locale, subjects, tags }: SubjectsTagsPanelProps) {
  const t = useTranslations("tasks.library");
  const [tab, setTab] = useState<"subjects" | "tags">("tags");

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="text-primary size-4" />
          {t("title")}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "tags" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTab("tags")}
          >
            <Tag className="size-4" />
            {t("tagsTab")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "subjects" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTab("subjects")}
          >
            <BookOpen className="size-4" />
            {t("subjectsTab")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "tags" ? (
          <EntitySection
            locale={locale}
            items={tags}
            kind="tag"
            createAction={createTag}
            updateAction={updateTag}
            deleteAction={deleteTag}
            initialState={initialTagState}
          />
        ) : (
          <EntitySection
            locale={locale}
            items={subjects}
            kind="subject"
            createAction={createSubject}
            updateAction={updateSubject}
            deleteAction={deleteSubject}
            initialState={initialSubjectState}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EntitySection({
  locale,
  items,
  kind,
  createAction,
  updateAction,
  deleteAction,
  initialState,
}: {
  locale: AppLocale;
  items: EntityItem[];
  kind: "subject" | "tag";
  createAction: (
    prev: SubjectActionState | TagActionState,
    formData: FormData,
  ) => Promise<SubjectActionState | TagActionState>;
  updateAction: (
    id: string,
    prev: SubjectActionState | TagActionState,
    formData: FormData,
  ) => Promise<SubjectActionState | TagActionState>;
  deleteAction: (id: string) => Promise<SubjectActionState | TagActionState>;
  initialState: SubjectActionState | TagActionState;
}) {
  const t = useTranslations("tasks.library");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.success) {
        toast(t("deleted"), "success");
        router.refresh();
      } else {
        toast(t(`errors.${result.formError ?? "saveFailed"}`), "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <EntityFormSheet
        mode="create"
        kind={kind}
        action={createAction}
        initialState={initialState}
        trigger={
          <Button size="sm" className="cursor-pointer">
            <Plus className="size-4" />
            {kind === "subject" ? t("createSubject") : t("createTag")}
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState title={kind === "subject" ? t("emptySubjects") : t("emptyTags")} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${item.color}22`, color: item.color }}
                >
                  {kind === "tag" ? (
                    <Tag className="size-4" aria-hidden="true" />
                  ) : (
                    <BookOpen className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <p className="font-medium">{pickLocalized(locale, item.nameUz, item.nameJa)}</p>
                  <p className="text-caption">
                    {t("taskCount", { count: item._count.tasks })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <EntityFormSheet
                  mode="edit"
                  kind={kind}
                  initialValues={{ nameUz: item.nameUz, nameJa: item.nameJa, color: item.color }}
                  action={updateAction.bind(null, item.id)}
                  initialState={initialState}
                  trigger={
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      <Pencil className="size-4" />
                      {t("edit")}
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-destructive"
                  disabled={isPending}
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="size-4" />
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntityFormSheet({
  mode,
  kind,
  initialValues = { nameUz: "", nameJa: "", color: "#6366f1" },
  action,
  initialState,
  trigger,
}: {
  mode: "create" | "edit";
  kind: "subject" | "tag";
  initialValues?: { nameUz: string; nameJa: string; color: string };
  action: (
    prev: SubjectActionState | TagActionState,
    formData: FormData,
  ) => Promise<SubjectActionState | TagActionState>;
  initialState: SubjectActionState | TagActionState;
  trigger: ReactElement;
}) {
  const t = useTranslations("tasks.library");
  const router = useRouter();
  const { toast } = useAppToast();
  const [userOpen, setUserOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: SubjectActionState | TagActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.success) {
        toast(mode === "create" ? t("created") : t("updated"), "success");
        router.refresh();
        setUserOpen(false);
      }
      return result;
    },
    initialState,
  );

  return (
    <Sheet open={userOpen} onOpenChange={setUserOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create"
              ? kind === "subject"
                ? t("createSubject")
                : t("createTag")
              : kind === "subject"
                ? t("editSubject")
                : t("editTag")}
          </SheetTitle>
        </SheetHeader>
        <form action={formAction} className="mt-6 space-y-4">
          <BilingualFieldPair
            uzName="nameUz"
            jaName="nameJa"
            uzLabel={t("nameUz")}
            jaLabel={t("nameJa")}
            initialUz={initialValues.nameUz}
            initialJa={initialValues.nameJa}
            fieldType="name"
            maxLength={kind === "tag" ? 40 : 80}
            required
            uzId={`${kind}-name-uz`}
            jaId={`${kind}-name-ja`}
          />
          <div className="space-y-2">
            <Label htmlFor={`${kind}-color`}>{t("color")}</Label>
            <Input id={`${kind}-color`} name="color" type="color" defaultValue={initialValues.color} />
          </div>
          {state.formError ? (
            <p className="text-form-error">{t(`errors.${state.formError}`)}</p>
          ) : null}
          <Button type="submit" className="cursor-pointer w-full" disabled={pending}>
            {pending ? t("submitting") : t("save")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
