import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { AppToastProvider } from "@/components/providers/app-toast-provider";
import { getUnreadNotificationCount } from "@/lib/queries/calendar";

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const unreadCount = await getUnreadNotificationCount(session.user.id);

  return (
    <AppToastProvider>
      <AppShell user={session.user} unreadCount={unreadCount}>
        {children}
      </AppShell>
    </AppToastProvider>
  );
}
