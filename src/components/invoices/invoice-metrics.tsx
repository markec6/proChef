"use client";

import { CheckCircle2, Clock, FileText, Receipt } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInvoiceMoney } from "@/lib/constants/invoices";

export interface InvoiceMetricsData {
  billedThisMonth: number;
  outstandingAmount: number;
  paidCount: number;
  paidAmount: number;
  draftCount: number;
}

export function InvoiceMetrics({
  metrics,
  isLoading,
}: {
  metrics: InvoiceMetricsData;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: "Ukupno fakturisano (Tekući mesec)",
      value: formatInvoiceMoney(metrics.billedThisMonth),
      icon: Receipt,
      accent: "text-emerald-700 bg-emerald-500/10",
    },
    {
      label: "Nenaplaćena potraživanja",
      value: formatInvoiceMoney(metrics.outstandingAmount),
      icon: Clock,
      accent: "text-sky-700 bg-sky-500/10",
    },
    {
      label: "Plaćene fakture",
      value: isLoading
        ? "—"
        : `${metrics.paidCount} · ${formatInvoiceMoney(metrics.paidAmount)}`,
      icon: CheckCircle2,
      accent: "text-emerald-700 bg-emerald-500/10",
    },
    {
      label: "Nacrti u izradi",
      value: String(metrics.draftCount),
      icon: FileText,
      accent: "text-amber-700 bg-amber-500/10",
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
              <CardTitle className="text-xl tabular-nums sm:text-2xl">
                {isLoading && card.label !== "Plaćene fakture" ? "—" : card.value}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
