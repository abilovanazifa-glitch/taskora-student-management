"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Languages,
  Tag,
  Users,
  X,
} from "lucide-react";
import {
  createTask,
  updateTask,
  type TaskActionState,
} from "@/lib/actions/tasks";
import type { AppLocale } from "@/i18n/routing";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { KANBAN_STATUSES } from "@/lib/tasks/status";
import { TASK_STATUS_VISUALS } from "@/lib/tasks/visuals";
import { TaskActionsMenu } from "@/components/tasks/task-actions-menu";
import { TaskDetailExtras, TaskDetailSidebar } from "@/components/tasks/task-detail-extras";
import { taskToFormValues, type TaskListItem } from "@/components/tasks/task-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

type ProjectOption = {
  id: string;
  nameUz: string;
  nameJa: string;
  color?: string;
  members: { id: string; fullName: string; avatarUrl?: string | null }[];
};

type SubjectOption = {
  id: string;
  nameUz: string;
  nameJa: string;
  color: string;
};

type TagOption = {
  id: string;
  nameUz: string;
  nameJa: string;
  color: string;
};

type TaskFormValues = {
  projectId: string;
  titleUz: string;
  titleJa: string;
  descriptionUz: string;
  descriptionJa: string;
  subjectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  deadline: string;
  tagIds: string[];
};

type TaskDetailDialogProps = {
  locale: AppLocale;
  mode: "create" | "edit" | "view";
  taskId?: string;
  task?: TaskListItem;
  initialValues?: TaskFormValues;
  projects: ProjectOption[];
  subjects: SubjectOption[];
  tags: TagOption[];
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  canEdit?: boolean;
};

const initialState: TaskActionState = { success: false };

const defaultValues: TaskFormValues = {
  projectId: "",
  titleUz: "",
  titleJa: "",
  descriptionUz: "",
  descriptionJa: "",
  subjectId: "",
  assigneeId: "",
  priority: "MEDIUM",
  status: "TODO",
  startDate: "",
  deadline: "",
  tagIds: [],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskDetailDialog({
  mode,
  taskId,
  task,
  initialValues = defaultValues,
  projects,
  subjects,
  tags,
  trigger,
  open: controlledOpen,
  onOpenChange,
  canEdit = true,
}: TaskDetailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(nextOpen: boolean) {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  }

  const values = task ? taskToFormValues(task) : initialValues;
  const formKey = `${task?.id ?? taskId ?? "create"}-${mode}`;

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      {open ? (
        <TaskDetailForm
          key={formKey}
          mode={mode}
          taskId={taskId}
          task={task}
          values={values}
          projects={projects}
          subjects={subjects}
          tags={tags}
          canEdit={canEdit}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Dialog>
  );
}

type TaskDetailFormProps = {
  locale: AppLocale;
  mode: "create" | "edit" | "view";
  taskId?: string;
  task?: TaskListItem;
  values: TaskFormValues;
  projects: ProjectOption[];
  subjects: SubjectOption[];
  tags: TagOption[];
  canEdit: boolean;
  onClose: () => void;
};

function TaskDetailForm({
  mode,
  taskId,
  task,
  values,
  projects,
  subjects,
  tags,
  canEdit,
  onClose,
}: Omit<TaskDetailFormProps, "locale">) {
  const locale = useAppLocale();
  const t = useTranslations("tasks.detail");
  const tForm = useTranslations("tasks.form");
  const tTasks = useTranslations("tasks");
  const router = useRouter();
  const { toast } = useAppToast();
  const readOnly = mode === "view" || !canEdit;

  const [showOtherLang, setShowOtherLang] = useState(
    Boolean(values.titleJa && locale === "uz" && values.titleJa !== values.titleUz),
  );
  const [projectId] = useState(values.projectId || projects[0]?.id || "");
  const [titleUz, setTitleUz] = useState(values.titleUz);
  const [titleJa, setTitleJa] = useState(values.titleJa);
  const [descriptionUz, setDescriptionUz] = useState(values.descriptionUz);
  const [descriptionJa, setDescriptionJa] = useState(values.descriptionJa);
  const [priority] = useState<TaskPriority>(values.priority);
  const [status, setStatus] = useState<TaskStatus>(values.status);
  const [subjectId, setSubjectId] = useState(values.subjectId || "none");
  const [assigneeId, setAssigneeId] = useState(values.assigneeId || "none");
  const [startDate] = useState(values.startDate);
  const [deadline, setDeadline] = useState(values.deadline);
  const [selectedTags, setSelectedTags] = useState<string[]>(values.tagIds);
  const membersRef = useRef<HTMLElement>(null);
  const labelsRef = useRef<HTMLElement>(null);
  const datesRef = useRef<HTMLElement>(null);
  const descriptionRef = useRef<HTMLElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: TaskActionState, formData: FormData) => {
      const result =
        mode === "create"
          ? await createTask(prev, formData)
          : await updateTask(taskId ?? "", prev, formData);

      if (result.success) {
        toast(mode === "create" ? tForm("created") : tForm("updated"), "success");
        router.refresh();
        onClose();
      }

      return result;
    },
    initialState,
  );

  const members = useMemo(
    () => projects.find((project) => project.id === projectId)?.members ?? [],
    [projectId, projects],
  );

  const isPrimaryUz = locale === "uz" || locale === "en";
  const secondaryLang = locale === "ja" ? "uz" : "ja";
  const finalTitleUz = titleUz.trim() || titleJa.trim();
  const finalTitleJa = titleJa.trim() || titleUz.trim();
  const primaryTitle = isPrimaryUz ? titleUz : titleJa;
  const secondaryTitle = secondaryLang === "uz" ? titleUz : titleJa;
  const primaryDescription = isPrimaryUz ? descriptionUz : descriptionJa;
  const secondaryDescription = secondaryLang === "uz" ? descriptionUz : descriptionJa;
  const StatusIcon = TASK_STATUS_VISUALS[status].icon;

  function toggleTag(tagId: string) {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  function setPrimaryTitle(value: string) {
    if (isPrimaryUz) setTitleUz(value);
    else setTitleJa(value);
  }

  function setSecondaryTitle(value: string) {
    if (secondaryLang === "uz") setTitleUz(value);
    else setTitleJa(value);
  }

  function setPrimaryDescription(value: string) {
    if (isPrimaryUz) setDescriptionUz(value);
    else setDescriptionJa(value);
  }

  function setSecondaryDescription(value: string) {
    if (secondaryLang === "uz") setDescriptionUz(value);
    else setDescriptionJa(value);
  }

  function scrollToSection(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <DialogContent
      closeLabel={t("close")}
      className="max-h-[min(92vh,820px)] max-w-6xl [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 sm:[&_[data-slot=dialog-close]]:right-6"
    >
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="priority" value={priority} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="assigneeId" value={assigneeId} />
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="deadline" value={deadline} />
        <input type="hidden" name="titleUz" value={finalTitleUz} />
        <input type="hidden" name="titleJa" value={finalTitleJa} />
        <input type="hidden" name="descriptionUz" value={descriptionUz} />
        <input type="hidden" name="descriptionJa" value={descriptionJa} />
        {selectedTags.map((tagId) => (
          <input key={tagId} type="hidden" name="tagIds" value={tagId} />
        ))}

        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4 pr-16 sm:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => value && setStatus(value as TaskStatus)}
              disabled={readOnly}
            >
              <SelectTrigger
                id="task-status"
                className="h-9 w-auto min-w-[8rem] cursor-pointer gap-2 rounded-lg bg-muted/50 text-body-sm font-medium"
              >
                <StatusIcon
                  className={cn("size-5 shrink-0", TASK_STATUS_VISUALS[status].accentClass)}
                />
                <SelectValue>{tTasks(`statuses.${status}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {KANBAN_STATUSES.map((value) => {
                  const ItemIcon = TASK_STATUS_VISUALS[value].icon;
                  return (
                    <SelectItem key={value} value={value}>
                      <ItemIcon
                        className={cn("size-5", TASK_STATUS_VISUALS[value].accentClass)}
                      />
                      {tTasks(`statuses.${value}`)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {subjectId !== "none" ? (
              <span className="text-caption flex items-center gap-1.5 truncate">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      subjects.find((s) => s.id === subjectId)?.color ?? "#6366f1",
                  }}
                  aria-hidden="true"
                />
                {pickLocalized(
                  locale,
                  subjects.find((s) => s.id === subjectId)?.nameUz ?? "",
                  subjects.find((s) => s.id === subjectId)?.nameJa ?? "",
                )}
              </span>
            ) : null}
          </div>

          {task && mode !== "create" ? (
            <TaskActionsMenu taskId={task.id} permissions={task.permissions} />
          ) : null}
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)]">
          <DialogBody className="space-y-6 px-6 py-5 sm:px-8 sm:py-6 lg:pr-8">
            {readOnly ? (
              <p className="text-caption rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground">
                {t("viewOnly")}
              </p>
            ) : null}

            <div className="flex gap-3.5">
              <Circle className="text-muted-foreground mt-2 size-5 shrink-0" aria-hidden="true" />
              <textarea
                value={primaryTitle}
                onChange={(event) => setPrimaryTitle(event.target.value)}
                readOnly={readOnly}
                rows={2}
                placeholder={t("titlePlaceholder")}
                className="text-task-title min-h-[2.75rem] w-full resize-none bg-transparent px-0.5 py-1 outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionPill
                icon={<Tag className="size-4" />}
                label={t("quickActions.label")}
                onClick={() => scrollToSection(labelsRef)}
              />
              <ActionPill
                icon={<CalendarDays className="size-4" />}
                label={t("quickActions.dueDate")}
                onClick={() => scrollToSection(datesRef)}
              />
              {task ? (
                <ActionPill
                  icon={<Check className="size-4" />}
                  label={t("quickActions.checklist")}
                  onClick={() => scrollToSection(checklistRef)}
                />
              ) : null}
              <ActionPill
                icon={<Users className="size-4" />}
                label={t("quickActions.assignee")}
                onClick={() => scrollToSection(membersRef)}
              />
            </div>

          <section ref={membersRef} className="space-y-2.5 scroll-mt-4">
            <h4 className="text-caption font-medium">{t("members")}</h4>
            <div className="flex flex-wrap items-center gap-2">
              {members.map((member) => {
                const active = assigneeId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setAssigneeId(active ? "none" : member.id)}
                    className={cn(
                      "cursor-pointer rounded-full ring-2 ring-transparent transition-all duration-200",
                      active && "ring-primary",
                      readOnly && "cursor-default",
                    )}
                    title={member.fullName}
                  >
                    <Avatar size="default">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                      ) : null}
                      <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
                    </Avatar>
                  </button>
                );
              })}
              {!readOnly && assigneeId !== "none" ? (
                <button
                  type="button"
                  onClick={() => setAssigneeId("none")}
                  className="text-caption text-muted-foreground hover:text-foreground cursor-pointer px-2 transition-colors"
                >
                  {tForm("unassigned")}
                </button>
              ) : null}
            </div>
          </section>

          {tags.length > 0 ? (
            <section ref={labelsRef} className="space-y-2.5 scroll-mt-4">
              <h4 className="text-caption flex items-center gap-1.5 font-medium">
                <Tag className="size-3.5" />
                {t("labels")}
              </h4>
              {!readOnly ? (
                <p className="text-caption text-muted-foreground">{t("labelsHint")}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={readOnly}
                      aria-pressed={active}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleTag(tag.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-body-sm font-medium transition-all duration-200",
                        !readOnly && "cursor-pointer hover:opacity-90",
                        readOnly && "cursor-default",
                        active && "ring-2 ring-offset-1",
                      )}
                      style={{
                        backgroundColor: active ? `${tag.color}33` : `${tag.color}14`,
                        color: tag.color,
                        ...(active ? { ringColor: tag.color } : {}),
                      }}
                    >
                      {active ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                      {pickLocalized(locale, tag.nameUz, tag.nameJa)}
                      {active && !readOnly ? (
                        <X className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section ref={datesRef} className="grid gap-3 scroll-mt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-deadline">{t("dueDate")}</Label>
              <Input
                id="task-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                readOnly={readOnly}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-subject">{t("list")}</Label>
              <Select
                value={subjectId}
                onValueChange={(value) => value && setSubjectId(value)}
                disabled={readOnly}
              >
                <SelectTrigger id="task-subject" className="w-full cursor-pointer">
                  <SelectValue>
                    {subjectId === "none"
                      ? tForm("noSubject")
                      : pickLocalized(
                          locale,
                          subjects.find((s) => s.id === subjectId)?.nameUz ?? "",
                          subjects.find((s) => s.id === subjectId)?.nameJa ?? "",
                        )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tForm("noSubject")}</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {pickLocalized(locale, subject.nameUz, subject.nameJa)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section ref={descriptionRef} className="space-y-2 scroll-mt-4">
            <h4 className="text-caption font-medium">{t("description")}</h4>
            <Textarea
              value={primaryDescription}
              onChange={(event) => setPrimaryDescription(event.target.value)}
              readOnly={readOnly}
              rows={4}
              placeholder={t("descriptionPlaceholder")}
              className="min-h-[7rem] resize-none bg-muted/30 px-4 py-3"
            />
          </section>

          {!readOnly ? (
            <button
              type="button"
              onClick={() => setShowOtherLang((current) => !current)}
              className="text-caption text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 transition-colors"
            >
              <Languages className="size-4" />
              {t("otherLanguage")}
              <ChevronDown
                className={cn("size-4 transition-transform", showOtherLang && "rotate-180")}
              />
            </button>
          ) : null}

          {showOtherLang && !readOnly ? (
            <section className="space-y-3 rounded-xl bg-muted/30 p-4 ring-1 ring-border/50">
              <div className="space-y-2">
                <Label>{secondaryLang === "uz" ? tForm("titleUz") : tForm("titleJa")}</Label>
                <Input
                  value={secondaryTitle}
                  onChange={(event) => setSecondaryTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {secondaryLang === "uz" ? tForm("descriptionUz") : tForm("descriptionJa")}
                </Label>
                <Textarea
                  value={secondaryDescription}
                  onChange={(event) => setSecondaryDescription(event.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </section>
          ) : null}

          {state.formError ? (
            <p className="text-form-error">{tForm(`errors.${state.formError}`)}</p>
          ) : null}

            {task && mode !== "create" ? (
              <div ref={checklistRef} className="scroll-mt-4">
                <TaskDetailExtras taskId={task.id} canEdit={!readOnly} />
              </div>
            ) : null}
          </DialogBody>

          {task && mode !== "create" ? (
            <TaskDetailSidebar taskId={task.id} canEdit={!readOnly} />
          ) : null}
        </div>

        {!readOnly ? (
          <DialogFooter className="flex justify-end gap-2 px-6 py-4 sm:px-8 sm:py-5">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={pending}>
              {pending
                ? tForm("submitting")
                : mode === "create"
                  ? tForm("submitCreate")
                  : tForm("submitUpdate")}
            </Button>
          </DialogFooter>
        ) : null}
      </form>
    </DialogContent>
  );
}

function ActionPill({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <span className="text-body-sm inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body-sm inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}

export type { TaskFormValues, ProjectOption, SubjectOption, TagOption };
