"use client";

import { Filter, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INVOICE_PERIOD_OPTIONS,
  INVOICE_STATUS_META,
  INVOICE_STATUSES,
  isInvoiceStatus,
  type InvoiceFilters,
  type InvoicePeriodFilter,
} from "@/lib/constants/invoices";
import type { InvoiceStatus } from "@/types/invoice";

interface InvoiceFiltersBarProps {
  filters: InvoiceFilters;
  canCreate: boolean;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onCreate: () => void;
}

export function InvoiceFiltersBar({
  filters,
  canCreate,
  onFiltersChange,
  onCreate,
}: InvoiceFiltersBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          Filteri faktura
        </div>
        {canCreate ? (
          <Button type="button" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nova faktura
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Pretraga broja ili klijenta"
            className="h-10 pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => {
            if (value === "all" || (typeof value === "string" && isInvoiceStatus(value))) {
              onFiltersChange({
                ...filters,
                status: value as InvoiceStatus | "all",
              });
            }
          }}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Svi statusi">
              {filters.status === "all"
                ? "Svi statusi"
                : INVOICE_STATUS_META[filters.status].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {INVOICE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {INVOICE_STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.period}
          onValueChange={(value) => {
            if (
              value === "thisMonth" ||
              value === "lastMonth" ||
              value === "all"
            ) {
              onFiltersChange({
                ...filters,
                period: value as InvoicePeriodFilter,
              });
            }
          }}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Svi periodi">
              {INVOICE_PERIOD_OPTIONS.find((option) => option.value === filters.period)
                ?.label ?? "Svi periodi"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {INVOICE_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
