import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BentoCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function BentoCard({ children, className, padding = "md" }: BentoCardProps) {
  return (
    <div className={cn("bento-card", paddingMap[padding], className)}>
      {children}
    </div>
  );
}

type BentoSectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function BentoSectionHeader({ title, description, action }: BentoSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0 max-w-prose space-y-1">
        <h2 className="text-title-lg">{title}</h2>
        {description ? <p className="text-caption">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
