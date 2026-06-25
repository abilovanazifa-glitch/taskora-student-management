import { cn } from "@/lib/utils";

type LanguageBadgeProps = {
  language: "uz" | "ja";
  className?: string;
};

const config = {
  uz: {
    label: "UZ",
    title: "Oʻzbekcha",
    className: "bg-muted text-foreground",
  },
  ja: {
    label: "JA",
    title: "日本語",
    className: "bg-accent text-primary",
  },
} as const;

export function LanguageBadge({ language, className }: LanguageBadgeProps) {
  const item = config[language];
  return (
    <span
      title={item.title}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tracking-wide",
        item.className,
        className,
      )}
    >
      {item.label}
    </span>
  );
}
