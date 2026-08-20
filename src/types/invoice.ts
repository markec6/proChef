export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export type InvoiceMealKind = "STANDARD" | "DIET" | "ENTERAL";

export type InvoiceClientId = "kbc-geneks" | "i-hirurska" | "interna-a";

export type Invoice = {
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
  subtotal_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  note: string | null;
  created_by_user_id: string;
  created_by_user_name: string;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

export type CreateInvoiceItemPayload = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type CreateInvoicePayload = {
  client_id: string;
  client_name: string;
  client_pib: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  tax_rate: number;
  note?: string | null;
  items: CreateInvoiceItemPayload[];
};

export type InvoiceTotals = {
  subtotal_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
};
