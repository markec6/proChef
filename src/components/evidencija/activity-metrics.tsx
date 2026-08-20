"use client";

import { CalendarDays, PackageSearch, Printer, Users } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ActivityMetricsData {
  todayCount: number;
  magacinStockCount: number;
  printCount: number;
  activeUsersToday: number;
}

export function ActivityMetrics({
  metrics,
  isLoading,
}: {
  metrics: ActivityMetricsData;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: "Akcije danas",
      value: metrics.todayCount,
      icon: CalendarDays,
      accent: "text-emerald-700 bg-emerald-500/10",
    },
    {
      label: "Izmene magacina",
      value: metrics.magacinStockCount,
      icon: PackageSearch,
      accent: "text-amber-700 bg-amber-500/10",
    },
    {
      label: "Odštampani nalozi",
      value: metrics.printCount,
      icon: Printer,
      accent: "text-sky-700 bg-sky-500/10",
    },
    {
      label: "Aktivni korisnici danas",
      value: metrics.activeUsersToday,
      icon: Users,
      accent: "text-slate-700 bg-slate-500/10",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} size="sm" className="gap-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{card.label}</CardDescription>
                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${card.accent}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <CardTitle className="text-2xl">
                {isLoading ? "—" : card.value}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
