"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { updateTaskAssigneeQuick } from "@/lib/actions/tasks";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

type TaskAssigneePickerProps = {
  taskId: string;
  assignee: Member | null;
  members: Member[];
  canEdit: boolean;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskAssigneePicker({
  taskId,
  assignee,
  members,
  canEdit,
  className,
}: TaskAssigneePickerProps) {
  const t = useTranslations("tasks.kanban");
  const tErrors = useTranslations("tasks.errors");
  const router = useRouter();
  const { toast } = useAppToast();
  const [isPending, startTransition] = useTransition();

  function setAssignee(nextId: string | null) {
    startTransition(async () => {
      const result = await updateTaskAssigneeQuick(taskId, nextId);
      if (result.success) {
        router.refresh();
      } else {
        toast(tErrors(result.formError ?? "saveFailed"), "error");
      }
    });
  }

  const trigger = (
    <button
      type="button"
      disabled={!canEdit || isPending}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "cursor-pointer rounded-full transition-opacity duration-200",
        !canEdit && "cursor-default",
        className,
      )}
      aria-label={assignee ? assignee.fullName : t("assignMember")}
    >
      {assignee ? (
        <Avatar size="sm">
          {assignee.avatarUrl ? <AvatarImage src={assignee.avatarUrl} alt={assignee.fullName} /> : null}
          <AvatarFallback>{initials(assignee.fullName)}</AvatarFallback>
        </Avatar>
      ) : (
        <span className="text-muted-foreground hover:text-primary flex size-6 items-center justify-center rounded-full border border-dashed border-border transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5">
          <UserPlus className="size-3.5" />
        </span>
      )}
    </button>
  );

  if (!canEdit || members.length === 0) {
    return assignee ? trigger : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" className="min-w-44">
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            className="cursor-pointer gap-2"
            onClick={() => setAssignee(member.id)}
          >
            <Avatar size="sm">
              {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.fullName} /> : null}
              <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-body-sm">{member.fullName}</span>
          </DropdownMenuItem>
        ))}
        {assignee ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setAssignee(null)}>
              {t("unassign")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
