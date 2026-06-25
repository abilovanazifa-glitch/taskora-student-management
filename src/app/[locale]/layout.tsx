import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSync } from "@/components/providers/theme-sync";
import { HtmlLangSetter } from "@/components/providers/html-lang-setter";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { routing } from "@/i18n/routing";
type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: t("title"),
      locale: locale === "ja" ? "ja_JP" : locale === "en" ? "en_US" : "uz_UZ",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      languages: {
        ja: "/ja",
        uz: "/uz",
        en: "/en",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <AuthSessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeSync />
        <TooltipProvider>
          <HtmlLangSetter />
          {children}
        </TooltipProvider>
      </NextIntlClientProvider>
    </AuthSessionProvider>
  );
}
