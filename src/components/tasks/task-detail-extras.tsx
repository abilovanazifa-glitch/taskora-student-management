"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  CheckSquare,
  Clock,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/bilingual";
import { getDateLocale } from "@/lib/i18n/date-locale";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import {
  addChecklistItem,
  addTaskAttachment,
  addTaskComment,
  createTaskChecklist,
  toggleChecklistItem,
} from "@/lib/actions/task-extras";
import { fetchTaskDetailForModal } from "@/lib/actions/fetch-task-detail";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TaskDetailExtrasProps = {
  taskId: string;
  canEdit: boolean;
};

type TaskDetailData = NonNullable<Awaited<ReturnType<typeof fetchTaskDetailForModal>>>;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskDetailExtras({ taskId, canEdit }: TaskDetailExtrasProps) {
  return <TaskDetailExtrasContent key={taskId} taskId={taskId} canEdit={canEdit} />;
}

function TaskDetailExtrasContent({ taskId, canEdit }: TaskDetailExtrasProps) {
  const locale = useAppLocale();
  const t = useTranslations("tasks.detail");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const dateLocale = getDateLocale(locale);
  const [detail, setDetail] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newItemByChecklist, setNewItemByChecklist] = useState<Record<string, string>>({});
  const [commentBody, setCommentBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);

  async function reload() {
    const data = await fetchTaskDetailForModal(taskId);
    setDetail(data);
    router.refresh();
  }

  useEffect(() => {
    let active = true;
    fetchTaskDetailForModal(taskId).then((data) => {
      if (active) {
        setDetail(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [taskId]);

  function runAction(action: () => Promise<{ success: boolean; formError?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        await reload();
      } else {
        toast(tErrors("saveFailed"), "error");
      }
    });
  }

  if (loading) {
    return <p className="text-caption text-muted-foreground px-1 py-4">{t("loading")}</p>;
  }

  if (!detail) {
    return null;
  }

  const activityItems = [
    {
      id: "created",
      at: detail.createdAt,
      label: t("activityCreated"),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-body-sm flex items-center gap-2 font-medium">
            <CheckSquare className="size-4" />
            {t("checklist")}
          </h4>
          {canEdit && !showChecklistForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowChecklistForm(true)}
            >
              <Plus className="size-3.5" />
              {t("addChecklist")}
            </Button>
          ) : null}
        </div>

        {showChecklistForm && canEdit ? (
          <div className="flex gap-2">
            <Input
              value={newChecklistTitle}
              placeholder={t("checklistTitlePlaceholder")}
              disabled={isPending}
              onChange={(event) => setNewChecklistTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runAction(() =>
                    createTaskChecklist(taskId, newChecklistTitle, locale).then((result) => {
                      if (result.success) {
                        setNewChecklistTitle("");
                        setShowChecklistForm(false);
                      }
                      return result;
                    }),
                  );
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="cursor-pointer shrink-0"
              disabled={isPending || newChecklistTitle.trim().length < 1}
              onClick={() =>
                runAction(() =>
                  createTaskChecklist(taskId, newChecklistTitle, locale).then((result) => {
                    if (result.success) {
                      setNewChecklistTitle("");
                      setShowChecklistForm(false);
                    }
                    return result;
                  }),
                )
              }
            >
              {t("addChecklist")}
            </Button>
          </div>
        ) : null}

        {detail.checklists.map((checklist) => {
          const done = checklist.items.filter((item) => item.isCompleted).length;
          const total = checklist.items.length;
          const progress = total === 0 ? 0 : Math.round((done / total) * 100);

          return (
            <div key={checklist.id} className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-body-sm font-medium">
                  {pickLocalized(locale, checklist.titleUz, checklist.titleJa)}
                </p>
                {total > 0 ? (
                  <span className="text-caption tabular-nums">
                    {done}/{total}
                  </span>
                ) : null}
              </div>
              {total > 0 ? (
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
              <ul className="space-y-1.5">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      disabled={!canEdit || isPending}
                      onChange={() =>
                        runAction(() => toggleChecklistItem(item.id, !item.isCompleted))
                      }
                      className="mt-1 size-4 cursor-pointer rounded border-border"
                    />
                    <span
                      className={cn(
                        "text-body-sm",
                        item.isCompleted && "text-muted-foreground line-through",
                      )}
                    >
                      {pickLocalized(locale, item.titleUz, item.titleJa)}
                    </span>
                  </li>
                ))}
              </ul>
              {canEdit ? (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newItemByChecklist[checklist.id] ?? ""}
                    placeholder={t("addChecklistItem")}
                    disabled={isPending}
                    className="h-8 text-body-sm"
                    onChange={(event) =>
                      setNewItemByChecklist((current) => ({
                        ...current,
                        [checklist.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const value = newItemByChecklist[checklist.id] ?? "";
                        runAction(() =>
                          addChecklistItem(checklist.id, value, locale).then((result) => {
                            if (result.success) {
                              setNewItemByChecklist((current) => ({
                                ...current,
                                [checklist.id]: "",
                              }));
                            }
                            return result;
                          }),
                        );
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-body-sm flex items-center gap-2 font-medium">
            <Paperclip className="size-4" />
            {t("attachments")}
          </h4>
          {canEdit && !showAttachmentForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowAttachmentForm(true)}
            >
              <Plus className="size-3.5" />
              {t("addAttachment")}
            </Button>
          ) : null}
        </div>

        {showAttachmentForm && canEdit ? (
          <div className="space-y-2 rounded-xl border border-border/60 p-3">
            <Input
              value={attachmentName}
              placeholder={t("attachmentNamePlaceholder")}
              disabled={isPending}
              onChange={(event) => setAttachmentName(event.target.value)}
            />
            <Input
              value={attachmentUrl}
              placeholder={t("attachmentUrlPlaceholder")}
              disabled={isPending}
              onChange={(event) => setAttachmentUrl(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              disabled={isPending}
              onClick={() =>
                runAction(() =>
                  addTaskAttachment(taskId, attachmentName, attachmentUrl).then((result) => {
                    if (result.success) {
                      setAttachmentName("");
                      setAttachmentUrl("");
                      setShowAttachmentForm(false);
                    }
                    return result;
                  }),
                )
              }
            >
              {t("addAttachment")}
            </Button>
          </div>
        ) : null}

        {detail.attachments.length === 0 ? (
          <p className="text-caption text-muted-foreground">{t("noAttachments")}</p>
        ) : (
          <ul className="space-y-2">
            {detail.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm hover:text-primary flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 transition-colors"
                >
                  <Link2 className="size-4 shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 lg:hidden">
        <h4 className="text-body-sm flex items-center gap-2 font-medium">
          <MessageSquare className="size-4" />
          {t("comments")}
        </h4>
        <CommentSection
          comments={detail.comments}
          commentBody={commentBody}
          setCommentBody={setCommentBody}
          canEdit={canEdit}
          isPending={isPending}
          locale={locale}
          dateLocale={dateLocale}
          onSubmit={() =>
            runAction(() =>
              addTaskComment(taskId, commentBody, locale).then((result) => {
                if (result.success) setCommentBody("");
                return result;
              }),
            )
          }
          placeholder={t("commentPlaceholder")}
        />
      </section>

      <section className="space-y-3 lg:hidden">
        <h4 className="text-body-sm flex items-center gap-2 font-medium">
          <Clock className="size-4" />
          {t("activity")}
        </h4>
        <ActivityList items={activityItems} dateLocale={dateLocale} />
      </section>
    </div>
  );
}

export function TaskDetailSidebar({ taskId, canEdit }: TaskDetailExtrasProps) {
  return <TaskDetailSidebarContent key={taskId} taskId={taskId} canEdit={canEdit} />;
}

function TaskDetailSidebarContent({ taskId, canEdit }: TaskDetailExtrasProps) {
  const locale = useAppLocale();
  const t = useTranslations("tasks.detail");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const dateLocale = getDateLocale(locale);
  const [detail, setDetail] = useState<TaskDetailData | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetchTaskDetailForModal(taskId).then((data) => {
      if (active) setDetail(data);
    });
    return () => {
      active = false;
    };
  }, [taskId]);

  async function reload() {
    const data = await fetchTaskDetailForModal(taskId);
    setDetail(data);
    router.refresh();
  }

  if (!detail) {
    return (
      <aside className="hidden min-w-0 space-y-6 border-l border-border/60 bg-muted/20 px-6 py-5 sm:px-8 sm:py-6 lg:block lg:min-w-[340px]">
        <p className="text-caption text-muted-foreground">{t("loading")}</p>
      </aside>
    );
  }

  const activityItems = [
    {
      id: "created",
      at: detail.createdAt,
      label: t("activityCreated"),
    },
  ];

  return (
    <aside className="hidden min-w-0 space-y-6 border-l border-border/60 bg-muted/20 px-6 py-5 sm:px-8 sm:py-6 lg:block lg:min-w-[340px]">
      <section className="space-y-3">
        <h4 className="text-body-sm flex items-center gap-2 font-medium">
          <MessageSquare className="size-4" />
          {t("comments")}
        </h4>
        <CommentSection
          comments={detail.comments}
          commentBody={commentBody}
          setCommentBody={setCommentBody}
          canEdit={canEdit}
          isPending={isPending}
          locale={locale}
          dateLocale={dateLocale}
          onSubmit={() =>
            startTransition(async () => {
              const result = await addTaskComment(taskId, commentBody, locale);
              if (result.success) {
                setCommentBody("");
                await reload();
              } else {
                toast(tErrors("saveFailed"), "error");
              }
            })
          }
          placeholder={t("commentPlaceholder")}
        />
      </section>

      <section className="space-y-3">
        <h4 className="text-body-sm flex items-center gap-2 font-medium">
          <Clock className="size-4" />
          {t("activity")}
        </h4>
        <ActivityList items={activityItems} dateLocale={dateLocale} />
      </section>
    </aside>
  );
}

function CommentSection({
  comments,
  commentBody,
  setCommentBody,
  canEdit,
  isPending,
  locale,
  dateLocale,
  onSubmit,
  placeholder,
}: {
  comments: TaskDetailData["comments"];
  commentBody: string;
  setCommentBody: (value: string) => void;
  canEdit: boolean;
  isPending: boolean;
  locale: ReturnType<typeof useAppLocale>;
  dateLocale: ReturnType<typeof getDateLocale>;
  onSubmit: () => void;
  placeholder: string;
}) {
  const t = useTranslations("tasks.detail");
  const { data: session } = useSession();
  const [isComposing, setIsComposing] = useState(false);
  const showActions = isComposing || commentBody.trim().length > 0;

  function handleCancel() {
    setCommentBody("");
    setIsComposing(false);
  }

  function handleSubmit() {
    if (commentBody.trim().length < 1 || isPending) return;
    onSubmit();
    setIsComposing(false);
  }

  return (
    <div className="space-y-5">
      {canEdit ? (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-1 shrink-0">
            {session?.user?.avatarUrl ? (
              <AvatarImage src={session.user.avatarUrl} alt={session.user.fullName ?? ""} />
            ) : null}
            <AvatarFallback>
              {initials(session?.user?.fullName ?? session?.user?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2.5">
            <textarea
              value={commentBody}
              rows={showActions ? 4 : 3}
              disabled={isPending}
              placeholder={placeholder}
              onFocus={() => setIsComposing(true)}
              onChange={(event) => setCommentBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  handleSubmit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  handleCancel();
                }
              }}
              className={cn(
                "text-body-sm w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition-colors",
                isComposing ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            />
            {showActions ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  disabled={isPending || commentBody.trim().length < 1}
                  onClick={handleSubmit}
                >
                  {t("saveComment")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer"
                  disabled={isPending}
                  onClick={handleCancel}
                >
                  {t("cancel")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {comments.length > 0 ? (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar size="sm" className="shrink-0">
                {comment.author.avatarUrl ? (
                  <AvatarImage src={comment.author.avatarUrl} alt={comment.author.fullName} />
                ) : null}
                <AvatarFallback>{initials(comment.author.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-body-sm font-medium">{comment.author.fullName}</p>
                  <time
                    dateTime={comment.createdAt.toISOString()}
                    className="text-caption text-muted-foreground"
                  >
                    {format(comment.createdAt, "PPp", { locale: dateLocale })}
                  </time>
                </div>
                <p className="text-body-sm mt-1 whitespace-pre-wrap">
                  {pickLocalized(locale, comment.bodyUz, comment.bodyJa)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : !canEdit ? (
        <p className="text-caption text-muted-foreground">{placeholder}</p>
      ) : null}
    </div>
  );
}

function ActivityList({
  items,
  dateLocale,
}: {
  items: { id: string; at: Date; label: string }[];
  dateLocale: ReturnType<typeof getDateLocale>;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="text-caption text-muted-foreground">
          <span className="text-foreground block">{item.label}</span>
          <time dateTime={item.at.toISOString()}>{format(item.at, "PPp", { locale: dateLocale })}</time>
        </li>
      ))}
    </ul>
  );
}
