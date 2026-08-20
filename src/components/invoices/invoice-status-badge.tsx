"use client";

import { memo } from "react";
import { ChevronDown, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getInvoiceStatusTransitions,
  INVOICE_STATUS_META,
} from "@/lib/constants/invoices";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/invoice";

export const InvoiceStatusBadge = memo(function InvoiceStatusBadge({
  status,
  interactive = false,
}: {
  status: InvoiceStatus;
  interactive?: boolean;
}) {
  const meta = INVOICE_STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-semibold",
        meta.className,
        interactive && "h-6 cursor-pointer pr-1 hover:opacity-90"
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
      {interactive ? <ChevronDown className="size-3 opacity-70" aria-hidden="true" /> : null}
    </Badge>
  );
});

export function InvoiceStatusUndoBadge({
  status,
  previousStatus,
  disabled = false,
  onUndo,
}: {
  status: InvoiceStatus;
  previousStatus: InvoiceStatus;
  disabled?: boolean;
  onUndo: () => void;
}) {
  const previousLabel = INVOICE_STATUS_META[previousStatus].label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          disabled && "opacity-60"
        )}
        aria-label={`Vrati na ${previousLabel}`}
      >
        <InvoiceStatusBadge status={status} interactive />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuItem onClick={onUndo}>
          <Undo2 className="size-3.5" aria-hidden="true" />
          Vrati na {previousLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InvoiceStatusMenu({
  status,
  disabled = false,
  onStatusChange,
}: {
  status: InvoiceStatus;
  disabled?: boolean;
  onStatusChange: (status: InvoiceStatus) => void;
}) {
  const transitions = getInvoiceStatusTransitions(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          disabled && "opacity-60"
        )}
        aria-label="Promeni status fakture"
      >
        <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium">
          {disabled ? "Čuvanje..." : "Promeni status"}
          <ChevronDown className="ml-1 size-3.5 text-muted-foreground" aria-hidden="true" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {transitions.map((nextStatus) => {
          const meta = INVOICE_STATUS_META[nextStatus];
          const Icon = meta.icon;

          return (
            <DropdownMenuItem
              key={nextStatus}
              onClick={() => onStatusChange(nextStatus)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {meta.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
