"use client";

import { Receipt } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CreateInvoiceModal } from "@/components/invoices/create-invoice-modal";
import { InvoiceFiltersBar } from "@/components/invoices/invoice-filters";
import {
  InvoiceMetrics,
  type InvoiceMetricsData,
} from "@/components/invoices/invoice-metrics";
import { InvoicePrintSheet } from "@/components/invoices/invoice-print-sheet";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import {
  StockUpdateToast,
  type StockUpdateToastData,
} from "@/components/inventory/stock-update-toast";
import {
  logInvoicePrintActivity,
  logInvoiceStatusChangedActivity,
  logInvoiceStatusUndoActivity,
} from "@/lib/activity/log-activity";
import {
  DEFAULT_INVOICE_FILTERS,
  isInvoiceDateInPeriod,
  isInvoiceDateInYearMonth,
  getBelgradeYearMonth,
  mapInvoiceItemRow,
  mapInvoiceRow,
  type InvoiceFilters,
} from "@/lib/constants/invoices";
import { printDocument } from "@/lib/print/print-document";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { Invoice, InvoiceStatus, InvoiceWithItems } from "@/types/invoice";

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("sr-RS");
}

function getInvoiceMetrics(invoices: Invoice[]): InvoiceMetricsData {
  const currentMonth = getBelgradeYearMonth();

  return invoices.reduce<InvoiceMetricsData>(
    (metrics, invoice) => {
      if (
        (invoice.status === "ISSUED" || invoice.status === "PAID") &&
        isInvoiceDateInYearMonth(
          invoice.issue_date,
          currentMonth.year,
          currentMonth.month
        )
      ) {
        metrics.billedThisMonth += invoice.total_amount;
      }

      if (invoice.status === "ISSUED") {
        metrics.outstandingAmount += invoice.total_amount;
      }

      if (invoice.status === "PAID") {
        metrics.paidCount += 1;
        metrics.paidAmount += invoice.total_amount;
      }

      if (invoice.status === "DRAFT") {
        metrics.draftCount += 1;
      }

      return metrics;
    },
    {
      billedThisMonth: 0,
      outstandingAmount: 0,
      paidCount: 0,
      paidAmount: 0,
      draftCount: 0,
    }
  );
}

export default function FakturePage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<InvoiceFilters>(DEFAULT_INVOICE_FILTERS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);
  const [previousStatusById, setPreviousStatusById] = useState<
    Record<string, InvoiceStatus>
  >({});
  const [printingInvoice, setPrintingInvoice] = useState<InvoiceWithItems | null>(
    null
  );
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);
  const [printToast, setPrintToast] = useState<StockUpdateToastData | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("issue_date", { ascending: false });

      if (error) {
        throw error;
      }

      setInvoices((data ?? []).map(mapInvoiceRow));
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      setInvoices([]);
      setErrorMessage("Fakture nisu učitane. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const search = normalizeSearch(filters.search);

    return invoices.filter((invoice) => {
      if (filters.status !== "all" && invoice.status !== filters.status) {
        return false;
      }

      if (!isInvoiceDateInPeriod(invoice.issue_date, filters.period)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        normalizeSearch(invoice.invoice_number).includes(search) ||
        normalizeSearch(invoice.client_name).includes(search)
      );
    });
  }, [filters.period, filters.search, filters.status, invoices]);

  const metrics = useMemo(() => getInvoiceMetrics(invoices), [invoices]);

  const persistInvoiceStatus = useCallback(
    async (invoice: Invoice, status: InvoiceStatus, mode: "change" | "undo") => {
    if (invoice.status === status) {
      return;
    }

    const previousStatus = invoice.status;
    setUpdatingInvoiceId(invoice.id);
    setInvoices((current) =>
      current.map((row) => (row.id === invoice.id ? { ...row, status } : row))
    );

    if (mode === "change") {
      setPreviousStatusById((current) => ({
        ...current,
        [invoice.id]: previousStatus,
      }));
    }

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", invoice.id);

      if (error) {
        throw error;
      }

      if (mode === "undo") {
        await logInvoiceStatusUndoActivity(invoice.invoice_number, supabase);
        setPreviousStatusById((current) => {
          const next = { ...current };
          delete next[invoice.id];
          return next;
        });
      } else {
        await logInvoiceStatusChangedActivity(
          {
            invoiceNumber: invoice.invoice_number,
            previousStatus,
            nextStatus: status,
          },
          supabase
        );
      }

      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to update invoice status:", error);
      setInvoices((current) =>
        current.map((row) =>
          row.id === invoice.id ? { ...row, status: previousStatus } : row
        )
      );

      if (mode === "change") {
        setPreviousStatusById((current) => {
          const next = { ...current };
          delete next[invoice.id];
          return next;
        });
      }

      setErrorMessage("Status fakture nije promenjen. Pokušajte ponovo.");
    } finally {
      setUpdatingInvoiceId(null);
    }
    },
    [supabase]
  );

  const handleStatusChange = useCallback(
    async (invoice: Invoice, status: InvoiceStatus) => {
      await persistInvoiceStatus(invoice, status, "change");
    },
    [persistInvoiceStatus]
  );

  const handleStatusUndo = useCallback(
    async (invoice: Invoice) => {
      const previousStatus = previousStatusById[invoice.id];

      if (!previousStatus) {
        return;
      }

      await persistInvoiceStatus(invoice, previousStatus, "undo");
    },
    [persistInvoiceStatus, previousStatusById]
  );

  const handlePrint = useCallback(
    async (invoice: Invoice) => {
    setPrintingInvoiceId(invoice.id);

    try {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setPrintingInvoice({
        ...invoice,
        items: (data ?? []).map(mapInvoiceItemRow),
      });
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to load invoice items for print:", error);
      setPrintingInvoice(null);
      setPrintingInvoiceId(null);
      setErrorMessage("Faktura nije spremna za štampu. Pokušajte ponovo.");
    }
    },
    [supabase]
  );

  const dismissPrintToast = useCallback(() => {
    setPrintToast(null);
  }, []);

  useEffect(() => {
    if (!printingInvoice) {
      return;
    }

    let cancelled = false;
    const invoiceToLog = printingInvoice;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      printDocument(
        () => {
          void (async () => {
            try {
              await logInvoicePrintActivity(
                {
                  invoiceNumber: invoiceToLog.invoice_number,
                  clientName: invoiceToLog.client_name,
                  totalAmount: invoiceToLog.total_amount,
                },
                supabase
              );
              setPrintToast({
                id: `${invoiceToLog.id}-${Date.now()}`,
                title: `Faktura ${invoiceToLog.invoice_number} odštampana i evidentirana.`,
                description: "Unos je sačuvan u evidenciji aktivnosti.",
                type: "success",
              });
            } catch (error) {
              console.error("Failed to log invoice print:", error);
              setErrorMessage("Štampa je završena, ali evidencija nije sačuvana.");
            }
          })();
        },
        () => {
          if (!cancelled) {
            setPrintingInvoice(null);
            setPrintingInvoiceId(null);
          }
        }
      );
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [printingInvoice, supabase]);

  return (
    <div className="flex w-full flex-col gap-4">
      <StockUpdateToast
        toast={printToast}
        onDismiss={dismissPrintToast}
      />
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
          <Receipt className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fakture & Obračuni
          </h1>
          <p className="text-sm text-muted-foreground">
            Pregled faktura, potraživanja i mesečnih obračuna.
          </p>
        </div>
      </div>

      <InvoiceMetrics metrics={metrics} isLoading={isLoading} />

      <InvoiceFiltersBar
        filters={filters}
        canCreate={isAdmin}
        onFiltersChange={setFilters}
        onCreate={() => setIsCreateOpen(true)}
      />

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <InvoicesTable
        data={filteredInvoices}
        isLoading={isLoading}
        canUpdateStatus={isAdmin}
        updatingInvoiceId={updatingInvoiceId}
        previousStatusById={previousStatusById}
        onStatusChange={handleStatusChange}
        onStatusUndo={handleStatusUndo}
        onPrint={handlePrint}
        printingInvoiceId={printingInvoiceId}
      />

      {printingInvoice ? <InvoicePrintSheet invoice={printingInvoice} /> : null}

      <CreateInvoiceModal
        open={isCreateOpen}
        profile={profile}
        onOpenChange={setIsCreateOpen}
        onCreated={() => void loadInvoices()}
      />
    </div>
  );
}
