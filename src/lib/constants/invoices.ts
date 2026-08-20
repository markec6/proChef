import { format, parse } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { BELGRADE_TIME_ZONE } from "@/lib/constants/activity";
import type {
  CreateInvoiceItemPayload,
  Invoice,
  InvoiceClientId,
  InvoiceItem,
  InvoiceMealKind,
  InvoiceStatus,
  InvoiceTotals,
} from "@/types/invoice";

export const DEFAULT_INVOICE_TAX_RATE = 20;

export const INVOICE_UNIT_PRICES = {
  STANDARD: 450,
  DIET: 520,
  ENTERAL: 850,
} as const satisfies Record<InvoiceMealKind, number>;

export const INVOICE_MEAL_LABELS: Record<InvoiceMealKind, string> = {
  STANDARD: "Opšti obrok - Doručak/Ručak/Večera",
  DIET: "Dijetalna ishrana - Dijabet",
  ENTERAL: "Sonda ishrana",
};

export interface InvoiceClientCatalogEntry {
  id: InvoiceClientId;
  name: string;
  legalName: string;
  pib: string;
  address: string;
  taxRate: number;
  unitPrices: Record<InvoiceMealKind, number>;
}

export const INVOICE_CLIENTS: Record<InvoiceClientId, InvoiceClientCatalogEntry> =
  {
    "kbc-geneks": {
      id: "kbc-geneks",
      name: "KBC Geneks",
      legalName: "Kliničko-bolnički centar Geneks (test)",
      pib: "100000001",
      address: "Bulevar Arsenija Čarnojevića 178, 11070 Novi Beograd (test)",
      taxRate: DEFAULT_INVOICE_TAX_RATE,
      unitPrices: { ...INVOICE_UNIT_PRICES },
    },
    "i-hirurska": {
      id: "i-hirurska",
      name: "I Hirurška",
      legalName: "Klinika za I hiruršku (test)",
      pib: "100000002",
      address: "Pasterova 2, 11000 Beograd (test)",
      taxRate: DEFAULT_INVOICE_TAX_RATE,
      unitPrices: { ...INVOICE_UNIT_PRICES },
    },
    "interna-a": {
      id: "interna-a",
      name: "Interna A",
      legalName: "Klinika Interna A (test)",
      pib: "100000003",
      address: "Dr Subotića 13, 11000 Beograd (test)",
      taxRate: DEFAULT_INVOICE_TAX_RATE,
      unitPrices: { ...INVOICE_UNIT_PRICES },
    },
  };

export const INVOICE_CLIENT_LIST = Object.values(INVOICE_CLIENTS);

export const INVOICE_ISSUER = {
  brand: "proChef",
  legalName: "proChef d.o.o. (test)",
  pib: "100000000",
  address: "Dobanovci, Beograd (test)",
  bankName: "Banka Poštanska štedionica (test)",
  accountNumber: "200-0000000000000-00",
  paymentNote: "Plaćanje po predračunu / fakturi. Poziv na broj: broj fakture.",
} as const;

export function isInvoiceClientId(value: string): value is InvoiceClientId {
  return value in INVOICE_CLIENTS;
}

export function getInvoiceClient(id: string): InvoiceClientCatalogEntry | null {
  if (!isInvoiceClientId(id)) {
    return null;
  }

  return INVOICE_CLIENTS[id];
}

export function getMealUnitPrice(kind: InvoiceMealKind, clientId?: string) {
  const client = clientId ? getInvoiceClient(clientId) : null;
  return client?.unitPrices[kind] ?? INVOICE_UNIT_PRICES[kind];
}

export function roundInvoiceAmount(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateInvoiceItemTotal(quantity: number, unitPrice: number) {
  return roundInvoiceAmount(quantity * unitPrice);
}

export function calculateInvoiceTotals(
  items: CreateInvoiceItemPayload[],
  taxRate: number = DEFAULT_INVOICE_TAX_RATE
): InvoiceTotals {
  const subtotalAmount = roundInvoiceAmount(
    items.reduce(
      (sum, item) => sum + calculateInvoiceItemTotal(item.quantity, item.unit_price),
      0
    )
  );
  const taxAmount = roundInvoiceAmount(subtotalAmount * (taxRate / 100));

  return {
    subtotal_amount: subtotalAmount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_amount: roundInvoiceAmount(subtotalAmount + taxAmount),
  };
}

export function formatInvoiceRsd(amount: number) {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInvoiceMoney(amount: number) {
  return `${formatInvoiceRsd(amount)} RSD`;
}

export const INVOICE_MEAL_KINDS: InvoiceMealKind[] = [
  "STANDARD",
  "DIET",
  "ENTERAL",
];

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "CANCELLED",
];

export const INVOICE_TAX_RATE_OPTIONS = [20, 10] as const;

export interface InvoiceStatusMeta {
  value: InvoiceStatus;
  label: string;
  icon: LucideIcon;
  className: string;
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  DRAFT: {
    value: "DRAFT",
    label: "Nacrt",
    icon: AlertCircle,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  ISSUED: {
    value: "ISSUED",
    label: "Izdata",
    icon: Clock,
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  PAID: {
    value: "PAID",
    label: "Plaćena",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Stornirana",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

export const INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> =
  {
    DRAFT: ["ISSUED", "PAID", "CANCELLED"],
    ISSUED: ["DRAFT", "PAID", "CANCELLED"],
    PAID: ["DRAFT", "ISSUED", "CANCELLED"],
    CANCELLED: ["DRAFT", "ISSUED", "PAID"],
  };

export type InvoicePeriodFilter = "thisMonth" | "lastMonth" | "all";

export type InvoiceFilters = {
  search: string;
  status: InvoiceStatus | "all";
  period: InvoicePeriodFilter;
};

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  search: "",
  status: "all",
  period: "thisMonth",
};

export const INVOICE_PERIOD_OPTIONS: Array<{
  value: InvoicePeriodFilter;
  label: string;
}> = [
  { value: "thisMonth", label: "Ovaj mesec" },
  { value: "lastMonth", label: "Prethodni mesec" },
  { value: "all", label: "Svi periodi" },
];

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus);
}

export function getInvoiceStatusTransitions(status: InvoiceStatus) {
  return INVOICE_STATUS_TRANSITIONS[status];
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function getBelgradeTodayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getBelgradeYearMonth(offsetMonths = 0, now = new Date()) {
  const [year, month] = getBelgradeTodayIso(now).split("-").map(Number);
  const shifted = new Date(year, month - 1 + offsetMonths, 1);

  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
  };
}

export function getBelgradeMonthDateRange(offsetMonths = 0, now = new Date()) {
  const { year, month } = getBelgradeYearMonth(offsetMonths, now);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${padDatePart(month)}-01`,
    end: `${year}-${padDatePart(month)}-${padDatePart(lastDay)}`,
  };
}

export function addInvoiceDays(isoDate: string, amount: number) {
  const parsed = parseInvoiceCalendarDate(isoDate);
  parsed.setDate(parsed.getDate() + amount);
  return format(parsed, "yyyy-MM-dd");
}

export function parseInvoiceCalendarDate(isoDate: string) {
  return parse(isoDate.slice(0, 10), "yyyy-MM-dd", new Date());
}

export function formatInvoiceDate(isoDate: string) {
  return format(parseInvoiceCalendarDate(isoDate), "dd.MM.yyyy.");
}

export function isInvoiceDateInYearMonth(
  isoDate: string,
  year: number,
  month: number
) {
  const [dateYear, dateMonth] = isoDate.slice(0, 10).split("-").map(Number);
  return dateYear === year && dateMonth === month;
}

export function isInvoiceDateInPeriod(
  isoDate: string,
  period: InvoicePeriodFilter,
  now = new Date()
) {
  if (period === "all") {
    return true;
  }

  const { year, month } = getBelgradeYearMonth(
    period === "lastMonth" ? -1 : 0,
    now
  );
  return isInvoiceDateInYearMonth(isoDate, year, month);
}

export function mapInvoiceRow(row: {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_pib: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  subtotal_amount: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: InvoiceStatus;
  note: string | null;
  created_by_user_id: string;
  created_by_user_name: string;
  created_at: string;
}): Invoice {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    client_id: row.client_id,
    client_name: row.client_name,
    client_pib: row.client_pib,
    client_address: row.client_address,
    issue_date: row.issue_date,
    due_date: row.due_date,
    period_start: row.period_start,
    period_end: row.period_end,
    subtotal_amount: Number(row.subtotal_amount),
    tax_rate: Number(row.tax_rate),
    tax_amount: Number(row.tax_amount),
    total_amount: Number(row.total_amount),
    status: row.status,
    note: row.note,
    created_by_user_id: row.created_by_user_id,
    created_by_user_name: row.created_by_user_name,
    created_at: row.created_at,
  };
}

export function mapInvoiceItemRow(row: {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  created_at: string;
}): InvoiceItem {
  return {
    id: row.id,
    invoice_id: row.invoice_id,
    description: row.description,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total_price: Number(row.total_price),
    created_at: row.created_at,
  };
}
