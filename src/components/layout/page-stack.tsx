import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageStackProps = {
  children: ReactNode;
  className?: string;
  size?: "wide" | "medium" | "narrow";
};

const widthMap = {
  wide: "max-w-7xl",
  medium: "max-w-6xl",
  narrow: "max-w-4xl",
} as const;

export function PageStack({ children, className, size = "wide" }: PageStackProps) {
  return (
    <div className={cn("page-stack", widthMap[size], className)}>
      {children}
    </div>
  );
}

export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("page-section", className)}>{children}</section>;
}
