"use client";

import { Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addInvoiceDays,
  calculateInvoiceItemTotal,
  calculateInvoiceTotals,
  DEFAULT_INVOICE_TAX_RATE,
  formatInvoiceMoney,
  getBelgradeMonthDateRange,
  getBelgradeTodayIso,
  getInvoiceClient,
  getMealUnitPrice,
  INVOICE_CLIENT_LIST,
  INVOICE_MEAL_KINDS,
  INVOICE_MEAL_LABELS,
  INVOICE_TAX_RATE_OPTIONS,
  isInvoiceClientId,
} from "@/lib/constants/invoices";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type {
  CreateInvoiceItemPayload,
  InvoiceClientId,
  InvoiceMealKind,
} from "@/types/invoice";

interface CreateInvoiceModalProps {
  open: boolean;
  profile: Profile | null;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface DraftLineItem {
  id: string;
  mealKind?: InvoiceMealKind;
  description: string;
  quantity: string;
  unitPrice: string;
}

function createLineItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCatalogLineItems(clientId?: string): DraftLineItem[] {
  return INVOICE_MEAL_KINDS.map((mealKind) => ({
    id: createLineItemId(),
    mealKind,
    description: INVOICE_MEAL_LABELS[mealKind],
    quantity: "",
    unitPrice: String(getMealUnitPrice(mealKind, clientId)),
  }));
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CreateInvoiceModal({
  open,
  profile,
  onOpenChange,
  onCreated,
}: CreateInvoiceModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const today = getBelgradeTodayIso();
  const currentMonth = getBelgradeMonthDateRange();

  const [clientId, setClientId] = useState<InvoiceClientId>(
    INVOICE_CLIENT_LIST[0]?.id ?? "kbc-geneks"
  );
  const [periodStart, setPeriodStart] = useState(currentMonth.start);
  const [periodEnd, setPeriodEnd] = useState(currentMonth.end);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(addInvoiceDays(today, 15));
  const [taxRate, setTaxRate] = useState(DEFAULT_INVOICE_TAX_RATE);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<DraftLineItem[]>(() =>
    createCatalogLineItems(INVOICE_CLIENT_LIST[0]?.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextToday = getBelgradeTodayIso();
    const nextMonth = getBelgradeMonthDateRange();
    const firstClientId = INVOICE_CLIENT_LIST[0]?.id ?? "kbc-geneks";

    setClientId(firstClientId);
    setPeriodStart(nextMonth.start);
    setPeriodEnd(nextMonth.end);
    setIssueDate(nextToday);
    setDueDate(addInvoiceDays(nextToday, 15));
    setTaxRate(DEFAULT_INVOICE_TAX_RATE);
    setNote("");
    setItems(createCatalogLineItems(firstClientId));
    setErrorMessage(null);
  }, [open]);

  const selectedClient = getInvoiceClient(clientId);

  const payloadItems = useMemo<CreateInvoiceItemPayload[]>(
    () =>
      items
        .map((item) => ({
          description: item.description.trim(),
          quantity: parseAmount(item.quantity),
          unit_price: parseAmount(item.unitPrice),
        }))
        .filter((item) => item.description.length > 0 && item.quantity > 0),
    [items]
  );

  const totals = calculateInvoiceTotals(payloadItems, taxRate);

  function handleClientChange(nextClientId: InvoiceClientId) {
    setClientId(nextClientId);
    setItems((current) =>
      current.map((item) =>
        item.mealKind
          ? {
              ...item,
              unitPrice: String(getMealUnitPrice(item.mealKind, nextClientId)),
            }
          : item
      )
    );
  }

  function updateItem(id: string, patch: Partial<DraftLineItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function handleSubmit() {
    if (!profile) {
      setErrorMessage("Profil korisnika nije učitan.");
      return;
    }

    if (!selectedClient) {
      setErrorMessage("Izaberite klijenta.");
      return;
    }

    if (periodEnd < periodStart) {
      setErrorMessage("Period obračuna nije ispravan.");
      return;
    }

    if (dueDate < issueDate) {
      setErrorMessage("Rok plaćanja ne može biti pre datuma izdavanja.");
      return;
    }

    if (payloadItems.length === 0) {
      setErrorMessage("Unesite bar jednu stavku sa količinom većom od nule.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    let createdInvoiceId: string | null = null;

    try {
      const { data: invoiceNumber, error: numberError } = await supabase.rpc(
        "next_invoice_number"
      );

      if (numberError || !invoiceNumber) {
        throw numberError ?? new Error("Broj fakture nije dodeljen.");
      }

      const { data: createdInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          client_id: selectedClient.id,
          client_name: selectedClient.name,
          client_pib: selectedClient.pib,
          client_address: selectedClient.address,
          issue_date: issueDate,
          due_date: dueDate,
          period_start: periodStart,
          period_end: periodEnd,
          subtotal_amount: totals.subtotal_amount,
          tax_rate: totals.tax_rate,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount,
          status: "DRAFT",
          note: note.trim() || null,
          created_by_user_id: profile.id,
          created_by_user_name: profile.full_name,
        })
        .select("id")
        .single();

      if (invoiceError || !createdInvoice) {
        throw invoiceError ?? new Error("Faktura nije sačuvana.");
      }

      createdInvoiceId = createdInvoice.id;

      const { error: itemsError } = await supabase.from("invoice_items").insert(
        payloadItems.map((item) => ({
          invoice_id: createdInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: calculateInvoiceItemTotal(item.quantity, item.unit_price),
        }))
      );

      if (itemsError) {
        throw itemsError;
      }

      onOpenChange(false);
      onCreated();
    } catch (error) {
      if (createdInvoiceId) {
        await supabase.from("invoices").delete().eq("id", createdInvoiceId);
      }

      console.error("Failed to create invoice:", error);
      setErrorMessage("Faktura nije sačuvana. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Nova faktura</DialogTitle>
            <DialogDescription>
              Izaberite klijenta, period obračuna i stavke. Cene se preuzimaju iz
              kataloga ugovora.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Klijent / Bolnica</span>
              <Select
                value={clientId}
                onValueChange={(value) => {
                  if (typeof value === "string" && isInvoiceClientId(value)) {
                    handleClientChange(value);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Izaberite klijenta">
                    {selectedClient?.name ?? "Izaberite klijenta"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_CLIENT_LIST.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">PDV</span>
              <Select
                value={String(taxRate)}
                onValueChange={(value) => {
                  const nextRate = Number(value);
                  if (nextRate === 10 || nextRate === 20) {
                    setTaxRate(nextRate);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>{`${taxRate} %`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TAX_RATE_OPTIONS.map((rate) => (
                    <SelectItem key={rate} value={String(rate)}>
                      {rate} %
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Period od</span>
              <Input
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Period do</span>
              <Input
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Datum izdavanja</span>
              <Input
                type="date"
                value={issueDate}
                onChange={(event) => {
                  setIssueDate(event.target.value);
                  setDueDate(addInvoiceDays(event.target.value, 15));
                }}
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Rok (Valuta)</span>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>

          {selectedClient ? (
            <p className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {selectedClient.legalName} · PIB {selectedClient.pib} ·{" "}
              {selectedClient.address}
            </p>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Stavke</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    {
                      id: createLineItemId(),
                      description: "",
                      quantity: "",
                      unitPrice: "",
                    },
                  ])
                }
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Dodaj stavku
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_6rem_7rem_auto]"
                >
                  <Input
                    value={item.description}
                    onChange={(event) =>
                      updateItem(item.id, { description: event.target.value })
                    }
                    placeholder="Opis stavke"
                  />
                  <Input
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, { quantity: event.target.value })
                    }
                    placeholder="Kol."
                  />
                  <Input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(item.id, { unitPrice: event.target.value })
                    }
                    placeholder="Cena"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setItems((current) =>
                        current.filter((row) => row.id !== item.id)
                      )
                    }
                    aria-label="Obriši stavku"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Napomena</span>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Opciona napomena ili broj ugovora"
            />
          </label>

          <div className="grid gap-2 rounded-xl border bg-muted/30 p-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Osnovica</div>
              <div className="font-semibold tabular-nums">
                {formatInvoiceMoney(totals.subtotal_amount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">PDV ({taxRate}%)</div>
              <div className="font-semibold tabular-nums">
                {formatInvoiceMoney(totals.tax_amount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Ukupno za uplatu</div>
              <div className="font-semibold tabular-nums">
                {formatInvoiceMoney(totals.total_amount)}
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Otkaži
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Čuvanje..." : "Sačuvaj nacrt"}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
