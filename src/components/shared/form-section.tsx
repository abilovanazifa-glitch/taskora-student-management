import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, icon, children, className }: FormSectionProps) {
  return (
    <section className={cn("bento-card space-y-4 p-5", className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-2xl">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 max-w-prose space-y-1">
          <h3 className="text-title">{title}</h3>
          {description ? <p className="text-caption">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
