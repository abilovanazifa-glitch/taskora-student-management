import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ClockAlert, ListTodo, Loader } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardStatVariant = "overdue" | "inProgress" | "pending" | "completed";

type DashboardStatCardProps = {
  label: string;
  value: number;
  variant: DashboardStatVariant;
};

const variantConfig: Record<
  DashboardStatVariant,
  {
    Icon: LucideIcon;
    iconWell: string;
    iconTone: string;
    valueTone: string;
  }
> = {
  overdue: {
    Icon: ClockAlert,
    iconWell: "bg-red-50 dark:bg-red-950/40",
    iconTone: "text-red-600 dark:text-red-400",
    valueTone: "text-red-600 dark:text-red-400",
  },
  inProgress: {
    Icon: Loader,
    iconWell: "bg-accent dark:bg-primary/15",
    iconTone: "text-primary",
    valueTone: "text-primary",
  },
  pending: {
    Icon: ListTodo,
    iconWell: "bg-amber-50 dark:bg-amber-950/35",
    iconTone: "text-amber-700 dark:text-amber-400",
    valueTone: "text-amber-700 dark:text-amber-400",
  },
  completed: {
    Icon: CheckCircle2,
    iconWell: "bg-emerald-50 dark:bg-emerald-950/35",
    iconTone: "text-emerald-600 dark:text-emerald-400",
    valueTone: "text-emerald-600 dark:text-emerald-400",
  },
};

export function DashboardStatCard({ label, value, variant }: DashboardStatCardProps) {
  const config = variantConfig[variant];
  const { Icon } = config;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/70 bg-card",
        "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              config.iconWell,
            )}
          >
            <Icon
              aria-hidden
              strokeWidth={2.25}
              className={cn("size-5 shrink-0", config.iconTone)}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="stat-label line-clamp-2">{label}</p>
            <p className={cn("stat-value text-3xl sm:text-4xl", config.valueTone)}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
