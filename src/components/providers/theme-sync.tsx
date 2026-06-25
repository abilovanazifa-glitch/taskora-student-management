"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { dbThemeToNextTheme } from "@/lib/i18n/locale";

export function ThemeSync() {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
  const syncedUserId = useRef<string | null>(null);
  const syncedTheme = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      syncedUserId.current = null;
      syncedTheme.current = null;
      return;
    }

    const userId = session?.user?.id;
    const userTheme = session?.user?.theme;

    if (!userId || !userTheme) {
      return;
    }

    const nextTheme = dbThemeToNextTheme(userTheme);

    if (syncedUserId.current === userId && syncedTheme.current === userTheme) {
      return;
    }

    setTheme(nextTheme);
    syncedUserId.current = userId;
    syncedTheme.current = userTheme;
  }, [status, session?.user?.id, session?.user?.theme, setTheme]);

  return null;
}
