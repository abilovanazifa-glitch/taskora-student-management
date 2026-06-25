"use client";

import { useTransition } from "react";
import { Archive, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { ProjectStatus } from "@prisma/client";
import { archiveProject, deleteProject } from "@/lib/actions/projects";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { Button } from "@/components/ui/button";

type ProjectDetailActionsProps = {
  projectId: string;
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  initialValues: {
    nameUz: string;
    nameJa: string;
    descriptionUz: string;
    descriptionJa: string;
    color: string;
    startDate: string;
    endDate: string;
    status: ProjectStatus;
  };
};

export function ProjectDetailActions({
  projectId,
  permissions,
  initialValues,
}: ProjectDetailActionsProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await archiveProject(projectId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.success) {
        router.push("/projects");
      }
    });
  }

  if (!permissions.canEdit && !permissions.canArchive && !permissions.canDelete) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {permissions.canEdit ? (
        <ProjectFormSheet
          mode="edit"
          projectId={projectId}
          initialValues={initialValues}
          trigger={
            <Button variant="outline" className="cursor-pointer">
              <Pencil className="size-4" />
              {t("editProject")}
            </Button>
          }
        />
      ) : null}
      {permissions.canArchive ? (
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleArchive}
          disabled={isPending}
        >
          <Archive className="size-4" />
          {t("archiveProject")}
        </Button>
      ) : null}
      {permissions.canDelete ? (
        <Button
          variant="destructive"
          className="cursor-pointer"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="size-4" />
          {t("deleteProject")}
        </Button>
      ) : null}
    </div>
  );
}
