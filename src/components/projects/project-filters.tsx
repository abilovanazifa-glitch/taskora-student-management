"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ProjectStatus } from "@prisma/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type ProjectFiltersProps = {
  search: string;
  status: ProjectStatus | "ALL";
  sort: "name" | "startDate" | "status" | "updatedAt";
  order: "asc" | "desc";
};

const SORT_OPTIONS = [
  "updatedAt:desc",
  "updatedAt:asc",
  "name:asc",
  "name:desc",
  "startDate:asc",
  "status:asc",
] as const;

type SortKey = (typeof SORT_OPTIONS)[number];

export function ProjectFilters({ search, status, sort, order }: ProjectFiltersProps) {
  const t = useTranslations("projects.filters");
  const router = useRouter();
  const pathname = usePathname();
  const sortValue = `${sort}:${order}` as SortKey;

  function navigate(next: ProjectFiltersProps) {
    const params = new URLSearchParams();
    if (next.search) params.set("q", next.search);
    if (next.status !== "ALL") params.set("status", next.status);
    if (next.sort !== "updatedAt") params.set("sort", next.sort);
    if (next.order !== "desc") params.set("order", next.order);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function sortLabel(value: SortKey) {
    switch (value) {
      case "updatedAt:desc":
        return t("sortUpdatedDesc");
      case "updatedAt:asc":
        return t("sortUpdatedAsc");
      case "name:asc":
        return t("sortNameAsc");
      case "name:desc":
        return t("sortNameDesc");
      case "startDate:asc":
        return t("sortStartAsc");
      case "status:asc":
        return t("sortStatusAsc");
      default:
        return t("sortUpdatedDesc");
    }
  }

  function statusLabel(value: ProjectStatus | "ALL") {
    return value === "ALL" ? t("allStatuses") : t(`statuses.${value}`);
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-border p-6 md:grid-cols-2 xl:grid-cols-[1fr_180px_220px_auto] xl:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        navigate({
          search: String(formData.get("q") ?? ""),
          status,
          sort,
          order,
        });
      }}
    >
      <div className="space-y-2 md:col-span-2 xl:col-span-1">
        <Label htmlFor="project-search">{t("search")}</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="project-search"
            name="q"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            className="border-transparent bg-muted/45 pl-9 focus-visible:border-input focus-visible:bg-background"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-status">{t("status")}</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            navigate({
              search,
              status: value as ProjectStatus | "ALL",
              sort,
              order,
            })
          }
        >
          <SelectTrigger id="project-status" className="w-full cursor-pointer">
            <span>{statusLabel(status)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            {(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`statuses.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-sort">{t("sort")}</Label>
        <Select
          value={sortValue}
          onValueChange={(value) => {
            if (!value) return;
            const [nextSort, nextOrder] = value.split(":") as [
              ProjectFiltersProps["sort"],
              ProjectFiltersProps["order"],
            ];
            navigate({ search, status, sort: nextSort, order: nextOrder });
          }}
        >
          <SelectTrigger id="project-sort" className="w-full cursor-pointer">
            <span>{sortLabel(sortValue)}</span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {sortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 md:col-span-2 xl:col-span-1">
        <Button type="submit" className="cursor-pointer">
          {t("apply")}
        </Button>
        {(search || status !== "ALL" || sort !== "updatedAt" || order !== "desc") && (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() =>
              navigate({
                search: "",
                status: "ALL",
                sort: "updatedAt",
                order: "desc",
              })
            }
          >
            {t("reset")}
          </Button>
        )}
      </div>
    </form>
  );
}
