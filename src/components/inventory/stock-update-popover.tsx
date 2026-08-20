"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, Edit3, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatStockValue,
  getInventoryStatus,
  type InventoryItem,
  type InventoryStatus,
} from "@/types/inventory";

const statusLabels: Record<InventoryStatus, string> = {
  CRITICAL: "Kritično",
  WARNING: "Upozorenje",
  OPTIMAL: "Optimalno",
};

const statusClasses: Record<InventoryStatus, string> = {
  CRITICAL: "bg-red-500/10 text-red-700 dark:text-red-300",
  WARNING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  OPTIMAL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const quickAdjustments = [-10, -1, 1, 10];

interface StockUpdatePopoverProps {
  item: InventoryItem;
  onStockUpdate: (item: InventoryItem, newStock: number) => Promise<void> | void;
}

function normalizeStockValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

export function StockUpdatePopover({
  item,
  onStockUpdate,
}: StockUpdatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftStock, setDraftStock] = useState(item.current_stock);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setDraftStock(item.current_stock);
      return;
    }

    setIsSubmitting(false);
  }

  const previewStatus = useMemo(
    () => getInventoryStatus(draftStock, item.min_stock),
    [draftStock, item.min_stock]
  );

  async function handleConfirm() {
    const nextStock = normalizeStockValue(draftStock);

    setDraftStock(nextStock);
    setIsSubmitting(true);
    setOpen(false);

    try {
      await onStockUpdate(item, nextStock);
    } finally {
      setIsSubmitting(false);
    }
  }

  function adjustStock(amount: number) {
    setDraftStock((current) => normalizeStockValue(current + amount));
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <Popover.Trigger
        render={
          <button
            type="button"
            title="Kliknite za promenu stanja"
            className="group ml-auto inline-flex items-center justify-end gap-1.5 rounded-md px-2 py-1 font-medium tabular-nums transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-slate-800"
          />
        }
      >
        {formatStockValue(item.current_stock)}
        <span className="text-muted-foreground">{item.unit}</span>
        <Edit3
          className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8}>
          <Popover.Popup className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none">
            <div className="space-y-4">
              <div>
                <Popover.Title className="text-base font-semibold">
                  Ažuriranje stanja
                </Popover.Title>
                <Popover.Description className="mt-1 text-sm text-muted-foreground">
                  {item.name} ({item.unit.toUpperCase()})
                </Popover.Description>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`stock-${item.id}`}
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Novo stanje
                </label>
                <Input
                  id={`stock-${item.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={draftStock}
                  onChange={(event) =>
                    setDraftStock(normalizeStockValue(event.target.valueAsNumber))
                  }
                  className="h-10 text-base font-semibold tabular-nums"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAdjustments.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustStock(amount)}
                    className="gap-1"
                  >
                    {amount < 0 ? (
                      <Minus className="size-3" aria-hidden="true" />
                    ) : (
                      <Plus className="size-3" aria-hidden="true" />
                    )}
                    {Math.abs(amount)}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Status posle izmene
                </span>
                <Badge
                  variant="secondary"
                  className={cn("font-semibold", statusClasses[previewStatus])}
                >
                  {statusLabels[previewStatus]}
                </Badge>
              </div>

              <div className="flex justify-end gap-2">
                <Popover.Close
                  render={<Button type="button" variant="outline" />}
                >
                  Otkaži
                </Popover.Close>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                >
                  <Check className="size-4" aria-hidden="true" />
                  Potvrdi promenu
                </Button>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
