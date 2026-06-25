"use client";

import { useEffect } from "react";
import { getHomePath } from "@/lib/navigation/home-path";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const COPY = {
  uz: {
    title: "Ilova xatosi",
    description: "Jiddiy xatolik yuz berdi. Sahifani yangilang.",
    tryAgain: "Qayta urinish",
    backHome: "Bosh sahifaga qaytish",
  },
  ja: {
    title: "アプリケーションエラー",
    description: "重大なエラーが発生しました。ページを再読み込みしてください。",
    tryAgain: "再試行",
    backHome: "ホームへ戻る",
  },
  en: {
    title: "Application error",
    description: "A critical error occurred. Reload the page or try again.",
    tryAgain: "Try again",
    backHome: "Back to home",
  },
} as const;

type AppLocale = keyof typeof COPY;

function getLocaleFromPathname(pathname: string): AppLocale {
  const match = pathname.match(/^\/(ja|uz|en)(\/|$)/);
  const code = match?.[1];
  if (code === "ja" || code === "uz" || code === "en") {
    return code;
  }
  return "uz";
}

function isAuthenticatedSession(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie.includes("authjs.session-token") ||
    document.cookie.includes("__Secure-authjs.session-token");
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  function goHome() {
    const locale = getLocaleFromPathname(window.location.pathname);
    const path = getHomePath(isAuthenticatedSession());
    window.location.assign(`/${locale}${path}`);
  }

  const locale = typeof window !== "undefined"
    ? getLocaleFromPathname(window.location.pathname)
    : "uz";
  const t = COPY[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans antialiased">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground max-w-md text-center text-sm">{t.description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            {t.tryAgain}
          </button>
          <button
            type="button"
            onClick={goHome}
            className="rounded-md border px-4 py-2 text-sm"
          >
            {t.backHome}
          </button>
        </div>
      </body>
    </html>
  );
}
