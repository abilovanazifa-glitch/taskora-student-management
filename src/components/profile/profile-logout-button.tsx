"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ProfileLogoutButton() {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <Button
      type="button"
      variant="outline"
      className="cursor-pointer gap-2"
      onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
    >
      <LogOut className="size-4 shrink-0" />
      {t("logout")}
    </Button>
  );
}
