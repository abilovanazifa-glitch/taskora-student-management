"use client";

import type { ComponentProps, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { getHomePath } from "@/lib/navigation/home-path";

type BackHomeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  children: ReactNode;
};

export function BackHomeLink({ children, ...props }: BackHomeLinkProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const href = getHomePath(isAuthenticated);

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
