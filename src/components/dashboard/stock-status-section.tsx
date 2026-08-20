"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBelgradeDayRange } from "@/lib/constants/activity";
import { getBelgradeMonthDateRange } from "@/lib/constants/invoices";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLocation } from "@/providers/location-provider";
import {
  formatStockValue,
  getInventoryStatus,
  type InventoryStatus,
} from "@/types/inventory";

type AlertStatus = Extract<InventoryStatus, "CRITICAL" | "WARNING">;

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  status: AlertStatus;
}

interface InventoryProductJoinRow {
  id: string;
  location_id: string;
  current_stock: number | null;
  min_stock: number | null;
  products:
    | {
        id: string;
        name: string;
        brand: string | null;
        unit: string;
      }
    | Array<{
        id: string;
        name: string;
        brand: string | null;
        unit: string;
      }>
    | null;
}

interface DailyMetrics {
  printCountToday: number | null;
  invoicesThisMonth: number | null;
}

const ALERT_LIMIT = 6;

const STATUS_LABELS: Record<AlertStatus, string> = {
  CRITICAL: "Hitna dopuna",
  WARNING: "Upozorenje",
};

function isAlertStatus(status: InventoryStatus): status is AlertStatus {
  return status === "CRITICAL" || status === "WARNING";
}

function getStatusBadgeClassName(status: AlertStatus) {
  if (status === "CRITICAL") {
    return "bg-red-500/10 text-red-700 dark:text-red-300";
  }

  return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function mapLowStockRow(row: InventoryProductJoinRow): LowStockItem | null {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;

  if (!product) {
    return null;
  }

  const currentStock = row.current_stock ?? 0;
  const minStock = row.min_stock ?? 0;
  const status = getInventoryStatus(currentStock, minStock);

  if (!isAlertStatus(status)) {
    return null;
  }

  return {
    id: row.id,
    name: product.name,
    unit: product.unit,
    current_stock: currentStock,
    min_stock: minStock,
    status,
  };
}

function sortLowStockItems(items: LowStockItem[]) {
  return [...items].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "CRITICAL" ? -1 : 1;
    }

    const leftRatio = left.min_stock > 0 ? left.current_stock / left.min_stock : 0;
    const rightRatio =
      right.min_stock > 0 ? right.current_stock / right.min_stock : 0;

    return leftRatio - rightRatio;
  });
}

export function StockStatusSection() {
  const supabase = useMemo(() => createClient(), []);
  const { activeLocation, isLoading: isLocationLoading } = useLocation();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics>({
    printCountToday: null,
    invoicesThisMonth: null,
  });
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardStatus() {
      const todayRange = getBelgradeDayRange();
      const monthRange = getBelgradeMonthDateRange();

      setIsMetricsLoading(true);

      if (!activeLocation) {
        if (isMounted) {
          setItems([]);
          setInventoryError(null);
          setIsInventoryLoading(isLocationLoading);
        }
      } else {
        setIsInventoryLoading(true);
        setInventoryError(null);
      }

      const printPromise = supabase
        .from("activity_logs")
        .select("id", { count: "exact", head: true })
        .eq("action", "PRINT")
        .gte("created_at", todayRange.from.toISOString())
        .lte("created_at", todayRange.to.toISOString());

      const invoicePromise = supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .gte("issue_date", monthRange.start)
        .lte("issue_date", monthRange.end)
        .neq("status", "CANCELLED");

      const inventoryPromise = activeLocation
        ? supabase
            .from("inventory")
            .select(
              "id, location_id, current_stock, min_stock, products(id, name, brand, unit)"
            )
            .eq("location_id", activeLocation.id)
        : Promise.resolve({ data: null, error: null });

      const [printResult, invoiceResult, inventoryResult] = await Promise.all([
        printPromise,
        invoicePromise,
        inventoryPromise,
      ]);

      if (!isMounted) {
        return;
      }

      setMetrics({
        printCountToday: printResult.error ? null : (printResult.count ?? 0),
        invoicesThisMonth: invoiceResult.error
          ? null
          : (invoiceResult.count ?? 0),
      });
      setIsMetricsLoading(false);

      if (!activeLocation) {
        return;
      }

      if (inventoryResult.error) {
        setItems([]);
        setInventoryError("Nije moguće učitati stanje zaliha.");
        setIsInventoryLoading(false);
        return;
      }

      const mappedItems = (
        (inventoryResult.data ?? []) as unknown as InventoryProductJoinRow[]
      )
        .map(mapLowStockRow)
        .filter((item): item is LowStockItem => item !== null);

      setItems(sortLowStockItems(mappedItems).slice(0, ALERT_LIMIT));
      setIsInventoryLoading(false);
    }

    void loadDashboardStatus();

    return () => {
      isMounted = false;
    };
  }, [activeLocation, isLocationLoading, supabase]);

  const kitchenName = isLocationLoading
    ? null
    : (activeLocation?.name ?? "Nema lokacije");

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Kritične zalihe & Dnevni status
        </h2>
        <p className="text-sm text-muted-foreground">
          Artikli blizu minimuma na aktivnoj lokaciji i kratki dnevni pregled.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>Artikli na minimumu</CardTitle>
                  <CardDescription>
                    {activeLocation
                      ? `Stanje za ${activeLocation.name}`
                      : "Čeka se aktivna lokacija"}
                  </CardDescription>
                </div>
              </div>
              <Link
                href="/magacin"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "shrink-0"
                )}
              >
                Magacin
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isInventoryLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : inventoryError ? (
              <p className="text-sm text-destructive">{inventoryError}</p>
            ) : items.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                  >
                    Optimalno
                  </Badge>
                  <p className="mt-2 text-sm font-medium">
                    Sve zalihe su u optimalnom stanju.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatStockValue(item.current_stock)} {item.unit}
                        <span className="mx-1.5">·</span>
                        min. {formatStockValue(item.min_stock)} {item.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-semibold",
                          getStatusBadgeClassName(item.status)
                        )}
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      <Link
                        href="/magacin"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "text-emerald-700 hover:text-emerald-800"
                        )}
                      >
                        Dopuni u magacinu
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <ClipboardList className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Dnevna statistika</CardTitle>
                <CardDescription>
                  Nalozi, fakture i aktivna kuhinja.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <MetricTile
              label="Nalozi danas"
              hint="Odštampani obrasci i dokumenti"
              value={
                isMetricsLoading
                  ? "—"
                  : metrics.printCountToday === null
                    ? "N/A"
                    : String(metrics.printCountToday)
              }
              icon={ClipboardList}
              accent="bg-sky-500/10 text-sky-700"
            />
            <MetricTile
              label="Fakture ovog meseca"
              hint="Izdati i plaćeni obračuni"
              value={
                isMetricsLoading
                  ? "—"
                  : metrics.invoicesThisMonth === null
                    ? "N/A"
                    : String(metrics.invoicesThisMonth)
              }
              icon={Receipt}
              accent="bg-emerald-500/10 text-emerald-700"
            />
            <MetricTile
              label="Aktivna kuhinja"
              hint="Trenutna lokacija rada"
              value={kitchenName ?? "—"}
              icon={ChefHat}
              accent="bg-slate-500/10 text-slate-700"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  hint,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  hint: string;
  value: string;
  icon: typeof ClipboardList;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-semibold tabular-nums">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            accent
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
