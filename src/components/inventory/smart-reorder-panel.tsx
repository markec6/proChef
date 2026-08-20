"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Printer,
  ShoppingCart,
} from "lucide-react";
import { useMemo } from "react";

import type { StockUpdateToastData } from "@/components/inventory/stock-update-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import {
  formatStockValue,
  type InventoryItem,
  type InventoryStatus,
} from "@/types/inventory";

interface SmartReorderPanelProps {
  items: InventoryItem[];
  locationName: string;
  isLoading?: boolean;
  onToast: (toast: StockUpdateToastData) => void;
}

type ReorderStatus = Exclude<InventoryStatus, "OPTIMAL">;

interface ReorderItem extends Omit<InventoryItem, "status"> {
  status: ReorderStatus;
  reorderAmount: number;
  stockRatio: number;
  progressPercent: number;
}

const statusLabels: Record<ReorderStatus, string> = {
  CRITICAL: "Kritično",
  WARNING: "Upozorenje",
};

const dateFormatter = new Intl.DateTimeFormat("sr-RS", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getProgressClassName(stockRatio: number) {
  if (stockRatio < 0.5) {
    return "bg-red-500";
  }

  if (stockRatio < 1) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

function isReorderItem(item: InventoryItem): item is InventoryItem & {
  status: ReorderStatus;
} {
  return item.status === "CRITICAL" || item.status === "WARNING";
}

function getCardAccentClassName(status: ReorderStatus) {
  return status === "CRITICAL"
    ? "border-red-200 bg-red-50/55"
    : "border-amber-200 bg-amber-50/55";
}

function getReorderItems(items: InventoryItem[]): ReorderItem[] {
  return items
    .filter(isReorderItem)
    .map((item) => {
      const stockRatio = item.min_stock > 0 ? item.current_stock / item.min_stock : 1;
      const progressPercent = Math.max(0, Math.min(100, stockRatio * 100));

      return {
        ...item,
        reorderAmount: Math.max(0, item.min_stock * 1.5 - item.current_stock),
        stockRatio,
        progressPercent,
      };
    })
    .sort((first, second) => {
      if (first.status !== second.status) {
        return first.status === "CRITICAL" ? -1 : 1;
      }

      return first.stockRatio - second.stockRatio;
    });
}

function buildSupplierText(locationName: string, reorderItems: ReorderItem[]) {
  const lines = reorderItems.map(
    (item) =>
      `• ${item.name}: +${formatStockValue(item.reorderAmount)} ${item.unit}`
  );

  return [
    `📦 NALOG ZA NABAVKU - ${locationName}`,
    `Datum: ${dateFormatter.format(new Date())}`,
    "----------------------------------------",
    ...lines,
    "----------------------------------------",
    "Prochef ERP Sistem",
  ].join("\n");
}

export function SmartReorderPanel({
  items,
  locationName,
  isLoading = false,
  onToast,
}: SmartReorderPanelProps) {
  const reorderItems = useMemo(() => getReorderItems(items), [items]);
  const criticalCount = reorderItems.filter(
    (item) => item.status === "CRITICAL"
  ).length;

  async function handleCopySupplierList() {
    if (!reorderItems.length) {
      onToast({
        id: `reorder-empty-${Date.now()}`,
        title: "Nema artikala za kopiranje",
        description: "Sve zalihe su trenutno na optimalnom nivou.",
        type: "success",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildSupplierText(locationName, reorderItems)
      );
      onToast({
        id: `reorder-copy-${Date.now()}`,
        title: "Spisak uspešno kopiran!",
        description: "Spremno za slanje dobavljaču",
        type: "success",
      });
    } catch {
      onToast({
        id: `reorder-copy-error-${Date.now()}`,
        title: "Kopiranje nije uspelo",
        description: "Pokušajte ponovo ili proverite dozvole browsera.",
        type: "error",
      });
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <ShoppingCart className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Smart Nalog za Dopunu Zaliha
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Automatska kalkulacija deficitarnih artikala za izabranu lokaciju
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Badge
            variant="secondary"
            className={cn(
              "w-fit px-3 py-1.5 font-semibold",
              reorderItems.length
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            )}
          >
            {reorderItems.length}{" "}
            {reorderItems.length === 1
              ? "artikal ispod minimuma"
              : "artikala ispod minimuma"}
          </Badge>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCopySupplierList}
              disabled={isLoading}
            >
              <Clipboard className="size-4" aria-hidden="true" />
              Kopiraj spisak za dobavljača
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handlePrint}
              disabled={isLoading}
            >
              <Printer className="size-4" aria-hidden="true" />
              Brzi Izvoz / Štampa
            </Button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : reorderItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reorderItems.map((item) => {
              const categoryMeta = getCategoryMeta(item.category);

              return (
                <article
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-4 shadow-sm transition-colors",
                    getCardAccentClassName(item.status)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "bg-white/80 font-semibold",
                            categoryMeta.textClass,
                            categoryMeta.borderClass
                          )}
                        >
                          {categoryMeta.label}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 uppercase">
                          {item.unit}
                        </Badge>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 font-semibold",
                        item.status === "CRITICAL"
                          ? "bg-red-500/10 text-red-700 dark:text-red-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {statusLabels[item.status]}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/80">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getProgressClassName(item.stockRatio)
                        )}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-sm text-muted-foreground">
                      <span>
                        Trenutno:{" "}
                        <strong className="font-semibold text-foreground">
                          {formatStockValue(item.current_stock)} {item.unit}
                        </strong>
                      </span>
                      <span>
                        Minimum:{" "}
                        <strong className="font-semibold text-foreground">
                          {formatStockValue(item.min_stock)} {item.unit}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/70 bg-white/80 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Predlog za nabavku
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-lg font-bold text-emerald-700">
                      +{formatStockValue(item.reorderAmount)} {item.unit}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-emerald-900">
              Sve zalihe su optimalne
            </h3>
            <p className="mt-2 max-w-xl text-sm text-emerald-800">
              Sve zalihe na ovoj lokaciji su na optimalnom nivou. Dopuna
              trenutno nije potrebna.
            </p>
          </div>
        )}

        {reorderItems.length ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            {criticalCount} kritično, {reorderItems.length - criticalCount} u
            upozorenju za lokaciju {locationName}
          </div>
        ) : null}
      </div>
    </section>
  );
}
