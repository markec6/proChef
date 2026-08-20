"use client";

import {
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  columnVisibilityFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";

import {
  InvoiceStatusBadge,
  InvoiceStatusMenu,
  InvoiceStatusUndoBadge,
} from "@/components/invoices/invoice-status-badge";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInvoiceDate, formatInvoiceMoney } from "@/lib/constants/invoices";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const invoiceTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<typeof invoiceTableFeatures, Invoice>();

interface InvoicesTableProps {
  data: Invoice[];
  isLoading?: boolean;
  canUpdateStatus?: boolean;
  updatingInvoiceId?: string | null;
  previousStatusById?: Record<string, InvoiceStatus>;
  onStatusChange: (invoice: Invoice, status: InvoiceStatus) => Promise<void> | void;
  onStatusUndo: (invoice: Invoice) => Promise<void> | void;
  onPrint: (invoice: Invoice) => Promise<void> | void;
  printingInvoiceId?: string | null;
}

export function InvoicesTable({
  data,
  isLoading = false,
  canUpdateStatus = false,
  updatingInvoiceId = null,
  previousStatusById = {},
  onStatusChange,
  onStatusUndo,
  onPrint,
  printingInvoiceId = null,
}: InvoicesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "issue_date", desc: true },
  ]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("invoice_number", {
          header: "Broj fakture",
          cell: ({ getValue }) => (
            <span className="font-semibold tabular-nums">{getValue()}</span>
          ),
        }),
        columnHelper.accessor("client_name", {
          header: "Klijent / Bolnica",
          cell: ({ row, getValue }) => (
            <div>
              <div className="font-medium">{getValue()}</div>
              <div className="text-xs text-muted-foreground">{row.original.client_id}</div>
            </div>
          ),
          sortFn: (rowA, rowB) =>
            rowA.original.client_name.localeCompare(rowB.original.client_name, "sr"),
        }),
        columnHelper.accessor("period_start", {
          id: "period",
          header: "Period obračuna",
          cell: ({ row }) => (
            <span className="tabular-nums text-muted-foreground">
              {formatInvoiceDate(row.original.period_start)} –{" "}
              {formatInvoiceDate(row.original.period_end)}
            </span>
          ),
        }),
        columnHelper.accessor("issue_date", {
          header: "Datum izdavanja",
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatInvoiceDate(getValue())}</span>
          ),
        }),
        columnHelper.accessor("due_date", {
          header: "Rok (Valuta)",
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatInvoiceDate(getValue())}</span>
          ),
        }),
        columnHelper.accessor("total_amount", {
          header: () => <div className="text-right">Iznos sa PDV-om</div>,
          cell: ({ getValue }) => (
            <div className="text-right font-semibold tabular-nums">
              {formatInvoiceMoney(getValue())}
            </div>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row, getValue }) => {
            const status = getValue();
            const previousStatus = previousStatusById[row.original.id];
            const canUndo =
              canUpdateStatus &&
              previousStatus !== undefined &&
              previousStatus !== status;

            if (!canUndo) {
              return <InvoiceStatusBadge status={status} />;
            }

            return (
              <InvoiceStatusUndoBadge
                status={status}
                previousStatus={previousStatus}
                disabled={updatingInvoiceId === row.original.id}
                onUndo={() => {
                  void onStatusUndo(row.original);
                }}
              />
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Akcije",
          cell: ({ row }) => (
            <div className="flex flex-wrap items-center gap-2">
              <InvoiceStatusMenu
                status={row.original.status}
                disabled={!canUpdateStatus || updatingInvoiceId === row.original.id}
                onStatusChange={(nextStatus) => {
                  void onStatusChange(row.original, nextStatus);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrint(row.original)}
                disabled={printingInvoiceId === row.original.id}
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Štampaj
              </Button>
            </div>
          ),
        }),
      ]),
    [
      canUpdateStatus,
      onStatusChange,
      onStatusUndo,
      onPrint,
      previousStatusById,
      printingInvoiceId,
      updatingInvoiceId,
    ]
  );

  const table = useTable(
    {
      features: invoiceTableFeatures,
      columns,
      data,
      getRowId: (row) => row.id,
      state: { sorting },
      onSortingChange: setSorting,
    },
    (state) => ({
      sorting: state.sorting,
    })
  );

  return (
    <div className="w-full space-y-3">
      <div className="gpu-scroll overflow-x-auto rounded-md border bg-card">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-4 py-3",
                      header.column.id === "total_amount" && "text-right"
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
                  Učitavanje faktura...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    data-slot="table-row"
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-3",
                          cell.column.id === "total_amount" && "text-right"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nema faktura za zadate filtere.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      <div className="w-full text-sm text-muted-foreground">
        Prikazano {data.length} faktura
      </div>
    </div>
  );
}
