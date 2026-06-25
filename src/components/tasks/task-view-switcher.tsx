"use client";



import { useRouter, usePathname } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { Columns3, LayoutGrid, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";



type TaskViewSwitcherProps = {

  view: "table" | "card" | "kanban";

};



export function TaskViewSwitcher({ view }: TaskViewSwitcherProps) {

  const t = useTranslations("tasks.views");

  const router = useRouter();

  const pathname = usePathname();



  function setView(nextView: "table" | "card" | "kanban") {

    const params = new URLSearchParams(window.location.search);

    if (nextView === "kanban") {

      params.delete("view");

    } else {

      params.set("view", nextView);

    }

    params.delete("page");

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname);

  }



  const options = [

    { value: "kanban" as const, icon: Columns3, label: t("kanban") },

    { value: "table" as const, icon: Table2, label: t("table") },

    { value: "card" as const, icon: LayoutGrid, label: t("card") },

  ];



  return (

    <div className="flex items-center gap-2 border-b border-border">

      {options.map((option) => {

        const Icon = option.icon;

        const active = view === option.value;

        return (

          <button

            key={option.value}

            type="button"

            onClick={() => setView(option.value)}

            className={cn(

              "relative flex cursor-pointer items-center gap-2 px-4 py-3 text-body font-medium transition-colors duration-200",

              active

                ? "text-primary"

                : "text-muted-foreground hover:text-foreground",

            )}

          >

            <Icon className="size-5" />

            {option.label}

            {active ? (

              <span className="bg-primary absolute inset-x-2 -bottom-px h-0.5 rounded-full" />

            ) : null}

          </button>

        );

      })}

    </div>

  );

}


