"use client";

import {
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  flexRender,
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

import { StockUpdatePopover } from "@/components/inventory/stock-update-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatStockValue,
  type InventoryItem,
  type InventoryStatus,
} from "@/types/inventory";

const inventoryTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<
  typeof inventoryTableFeatures,
  InventoryItem
>();

const statusLabels: Record<InventoryStatus, string> = {
  CRITICAL: "Kritično",
  WARNING: "Upozorenje",
  OPTIMAL: "Optimalno",
};

const statusRanks: Record<InventoryStatus, number> = {
  CRITICAL: 0,
  WARNING: 1,
  OPTIMAL: 2,
};

interface InventoryTableProps {
  data: InventoryItem[];
  isLoading?: boolean;
  resetKey?: string;
  onStockUpdate: (item: InventoryItem, newStock: number) => Promise<void> | void;
}

interface SortableColumn {
  getIsSorted: () => false | "asc" | "desc";
  getToggleSortingHandler: () => undefined | ((event: unknown) => void);
}

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("sr-RS");
}

function highlightMatch(value: string, query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return value;
  }

  const matchIndex = value
    .toLocaleLowerCase("sr-RS")
    .indexOf(trimmedQuery.toLocaleLowerCase("sr-RS"));

  if (matchIndex === -1) {
    return value;
  }

  const before = value.slice(0, matchIndex);
  const match = value.slice(matchIndex, matchIndex + trimmedQuery.length);
  const after = value.slice(matchIndex + trimmedQuery.length);

  return (
    <>
      {before}
      <mark className="rounded bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-500/30">
        {match}
      </mark>
      {after}
    </>
  );
}

function getStatusBadgeClassName(status: InventoryStatus) {
  switch (status) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-700 dark:text-red-300";
    case "WARNING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "OPTIMAL":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
}

const InventoryStatusBadge = memo(function InventoryStatusBadge({
  status,
}: {
  status: InventoryStatus;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-semibold", getStatusBadgeClassName(status))}
    >
      {statusLabels[status]}
    </Badge>
  );
});

const InventoryTableRow = memo(function InventoryTableRow({
  item,
  globalFilter,
  onStockUpdate,
}: {
  item: InventoryItem;
  globalFilter: string;
  onStockUpdate: InventoryTableProps["onStockUpdate"];
}) {
  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <div className="min-w-52 font-semibold text-foreground">
          {highlightMatch(item.name, globalFilter)}
          {item.brand ? (
            <div className="text-xs font-normal text-muted-foreground sm:hidden">
              {highlightMatch(item.brand, globalFilter)}
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-muted-foreground">
          {item.brand ? highlightMatch(item.brand, globalFilter) : "Bez brenda"}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge variant="outline" className="uppercase tracking-wide">
          {item.unit}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="flex justify-end">
          <StockUpdatePopover item={item} onStockUpdate={onStockUpdate} />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="text-right tabular-nums text-muted-foreground">
          {formatStockValue(item.min_stock)} {item.unit}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <InventoryStatusBadge status={item.status} />
      </TableCell>
    </TableRow>
  );
});

function SortableHeader({
  label,
  column,
  align = "left",
}: {
  label: string;
  column: SortableColumn;
  align?: "left" | "right";
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "-mx-2 gap-1.5 px-2 font-medium",
        align === "right" && "ml-auto"
      )}
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      <ArrowUpDown
        className={cn(
          "size-3.5 text-muted-foreground",
          sorted && "text-foreground"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">
        {sorted === "asc"
          ? "Sortirano rastuće"
          : sorted === "desc"
            ? "Sortirano opadajuće"
            : "Sortiraj kolonu"}
      </span>
    </Button>
  );
}

export function InventoryTable({
  data,
  isLoading = false,
  resetKey,
  onStockUpdate,
}: InventoryTableProps) {
  const [globalFilterState, setGlobalFilterState] = useState({
    resetKey,
    value: "",
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: false },
  ]);
  const globalFilter =
    globalFilterState.resetKey === resetKey ? globalFilterState.value : "";

  const handleGlobalFilterChange = useCallback(
    (nextValue: unknown) => {
      setGlobalFilterState((current) => {
        const previousValue =
          current.resetKey === resetKey ? current.value : "";
        const value =
          typeof nextValue === "function"
            ? (nextValue as (oldValue: string) => unknown)(previousValue)
            : nextValue;

        return {
          resetKey,
          value: String(value ?? ""),
        };
      });
    },
    [resetKey]
  );

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: ({ column }) => (
            <SortableHeader label="Naziv artikla" column={column} />
          ),
          sortFn: (rowA, rowB) =>
            rowA.original.name.localeCompare(rowB.original.name, "sr"),
        }),
        columnHelper.accessor("brand", {
          header: "Proizvođač / Brend",
          enableSorting: false,
        }),
        columnHelper.accessor("unit", {
          header: "Jedinica mere",
          enableSorting: false,
        }),
        columnHelper.accessor("current_stock", {
          header: ({ column }) => (
            <SortableHeader
              label="Trenutno stanje"
              column={column}
              align="right"
            />
          ),
          sortFn: (rowA, rowB) =>
            rowA.original.current_stock - rowB.original.current_stock,
        }),
        columnHelper.accessor("min_stock", {
          header: () => <div className="text-right">Minimalno stanje</div>,
          enableSorting: false,
        }),
        columnHelper.accessor("status", {
          header: ({ column }) => (
            <SortableHeader label="Status" column={column} />
          ),
          sortFn: (rowA, rowB) =>
            statusRanks[rowA.original.status] - statusRanks[rowB.original.status],
        }),
      ]),
    []
  );

  const table = useTable(
    {
      features: inventoryTableFeatures,
      columns,
      data,
      getRowId: (row) => row.id,
      globalFilterFn: (row, _columnId, filterValue) => {
        const query = normalizeSearch(filterValue);

        if (!query) {
          return true;
        }

        return [row.original.name, row.original.brand]
          .map(normalizeSearch)
          .some((value) => value.includes(query));
      },
      state: {
        globalFilter,
        sorting,
      },
      onGlobalFilterChange: handleGlobalFilterChange,
      onSortingChange: setSorting,
    },
    (state) => ({
      globalFilter: state.globalFilter,
      sorting: state.sorting,
    })
  );

  const visibleCount = table.getFilteredRowModel().rows.length;
  const totalCount = data.length;

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={globalFilter}
          onChange={(event) => handleGlobalFilterChange(event.target.value)}
          placeholder="Pretraga po nazivu ili brendu..."
          className="pl-8"
          disabled={isLoading}
        />
      </div>

      <div className="gpu-scroll max-h-[calc(100vh-280px)] overflow-x-auto overflow-y-auto rounded-md border bg-card">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="gpu-sticky sticky top-0 z-10 bg-background shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "bg-background px-4 py-3",
                      ["current_stock", "min_stock"].includes(header.column.id) &&
                        "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  Učitavanje zaliha...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <InventoryTableRow
                  key={row.id}
                  item={row.original}
                  globalFilter={globalFilter}
                  onStockUpdate={onStockUpdate}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nema artikala za prikaz za zadatu pretragu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      <div className="w-full text-sm text-muted-foreground">
        Prikazano {visibleCount} od ukupno {totalCount} artikala
      </div>
    </div>
  );
}
