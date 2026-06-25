"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { BackHomeLink } from "@/components/navigation/back-home-link";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: ErrorPageProps) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-16 text-center"
      role="alert"
    >
      <h1 className="text-2xl font-semibold sm:text-3xl">{t("pageTitle")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{t("pageDescription")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" className="cursor-pointer" onClick={() => reset()}>
          {tCommon("tryAgain")}
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          render={<BackHomeLink>{tCommon("backHome")}</BackHomeLink>}
        />
      </div>
    </div>
  );
}
