"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type TaskPaginationProps = {
  page: number;
  totalPages: number;
};

export function TaskPagination({ page, totalPages }: TaskPaginationProps) {
  const t = useTranslations("tasks.pagination");
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) {
    return null;
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(window.location.search);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-caption">
        {t("pageInfo", { page, total: totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          {t("previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
