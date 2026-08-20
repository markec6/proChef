import { createClient } from "@/lib/supabase/client";
import { formatInvoiceRsd, INVOICE_STATUS_META } from "@/lib/constants/invoices";
import type { ActivityAction, ActivityModule, InvoiceStatus } from "@/types/database";
import type { WorksheetTemplateId } from "@/types/obrasci";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export const MAGACIN_ACTIVITY_MODULE = "Magacin" as const satisfies ActivityModule;

export const WORKSHEET_ACTIVITY_MODULES = {
  "daily-order": "Interna A",
  "special-regimes": "Specijalci",
  "menus-normatives": "Jelovnik",
  "stock-issuance": "I Hirurška",
} as const satisfies Record<WorksheetTemplateId, ActivityModule>;

export interface LogActivityInput {
  action: ActivityAction;
  module: ActivityModule;
  targetItem: string;
  details: string;
}

export interface UpdateInventoryStockInput {
  inventoryId: string;
  newStock: number;
  details: string;
}

export interface WorksheetActivityContext {
  templateId: WorksheetTemplateId;
  targetItem: string;
}

export interface WorksheetRowActivityContext extends WorksheetActivityContext {
  sectionTitle?: string;
  rowLabel?: string;
}

export interface WorksheetCellActivityContext extends WorksheetRowActivityContext {
  columnLabel: string;
  previousValue: string;
  nextValue: string;
}

export interface WorksheetPrintActivityContext extends WorksheetActivityContext {
  documentNumber?: string;
  date?: string;
  meal?: string;
}

export function getWorksheetActivityModule(
  templateId: WorksheetTemplateId
): ActivityModule {
  return WORKSHEET_ACTIVITY_MODULES[templateId];
}

export function buildWorksheetRowAddedActivity(
  input: WorksheetRowActivityContext
): LogActivityInput {
  const section = input.sectionTitle
    ? ` u sekciji ${input.sectionTitle}`
    : "";
  const row = input.rowLabel ? `: ${input.rowLabel}` : "";

  return {
    action: "CREATE",
    module: getWorksheetActivityModule(input.templateId),
    targetItem: input.targetItem,
    details: `Dodat red${section}${row}`,
  };
}

export function buildWorksheetRowDeletedActivity(
  input: WorksheetRowActivityContext
): LogActivityInput {
  const section = input.sectionTitle
    ? ` u sekciji ${input.sectionTitle}`
    : "";
  const row = input.rowLabel ? `: ${input.rowLabel}` : "";

  return {
    action: "DELETE",
    module: getWorksheetActivityModule(input.templateId),
    targetItem: input.targetItem,
    details: `Obrisan red${section}${row}`,
  };
}

export function buildWorksheetCellUpdatedActivity(
  input: WorksheetCellActivityContext
): LogActivityInput {
  return {
    action: "UPDATE",
    module: getWorksheetActivityModule(input.templateId),
    targetItem: input.targetItem,
    details: `${input.columnLabel} promenjeno sa "${input.previousValue}" na "${input.nextValue}"`,
  };
}

export function buildWorksheetPrintActivity(
  input: WorksheetPrintActivityContext
): LogActivityInput {
  const parts = [
    input.documentNumber ? `broj ${input.documentNumber}` : null,
    input.date ? `datum ${input.date}` : null,
    input.meal ? `obrok ${input.meal}` : null,
  ].filter((part): part is string => part !== null);

  return {
    action: "PRINT",
    module: getWorksheetActivityModule(input.templateId),
    targetItem: input.targetItem,
    details:
      parts.length > 0
        ? `Odštampan popunjen nalog (${parts.join(", ")})`
        : "Odštampan popunjen nalog",
  };
}

export const FAKTURE_ACTIVITY_MODULE = "Fakture" as const satisfies ActivityModule;

export interface InvoiceCreatedActivityContext {
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
}

export interface InvoiceStatusChangedActivityContext {
  invoiceNumber: string;
  previousStatus: InvoiceStatus;
  nextStatus: InvoiceStatus;
}

export interface InvoicePrintActivityContext {
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
}

export function buildInvoiceCreatedActivity(
  input: InvoiceCreatedActivityContext
): LogActivityInput {
  return {
    action: "CREATE",
    module: FAKTURE_ACTIVITY_MODULE,
    targetItem: input.invoiceNumber,
    details: `Kreirana nova faktura ${input.invoiceNumber} za klijenta ${input.clientName} u iznosu od ${formatInvoiceRsd(input.totalAmount)} RSD`,
  };
}

export function buildInvoiceStatusChangedActivity(
  input: InvoiceStatusChangedActivityContext
): LogActivityInput {
  return {
    action: "UPDATE",
    module: FAKTURE_ACTIVITY_MODULE,
    targetItem: input.invoiceNumber,
    details: `Status fakture ${input.invoiceNumber} promenjen iz ${INVOICE_STATUS_META[input.previousStatus].label} u ${INVOICE_STATUS_META[input.nextStatus].label}`,
  };
}

export async function logInvoiceStatusChangedActivity(
  input: InvoiceStatusChangedActivityContext,
  supabase: SupabaseBrowserClient = createClient()
) {
  return logActivity(buildInvoiceStatusChangedActivity(input), supabase);
}

export function buildInvoiceStatusUndoActivity(invoiceNumber: string): LogActivityInput {
  return {
    action: "UPDATE",
    module: FAKTURE_ACTIVITY_MODULE,
    targetItem: invoiceNumber,
    details: `Vraćene promene statusa za ${invoiceNumber}`,
  };
}

export async function logInvoiceStatusUndoActivity(
  invoiceNumber: string,
  supabase: SupabaseBrowserClient = createClient()
) {
  return logActivity(buildInvoiceStatusUndoActivity(invoiceNumber), supabase);
}

export function buildInvoicePrintActivity(
  input: InvoicePrintActivityContext
): LogActivityInput {
  return {
    action: "PRINT",
    module: FAKTURE_ACTIVITY_MODULE,
    targetItem: input.invoiceNumber,
    details: `Odštampana faktura ${input.invoiceNumber} za ${input.clientName}, iznos: ${formatInvoiceRsd(input.totalAmount)} RSD`,
  };
}

export async function logInvoicePrintActivity(
  input: InvoicePrintActivityContext,
  supabase: SupabaseBrowserClient = createClient()
) {
  return logActivity(buildInvoicePrintActivity(input), supabase);
}

export async function logActivity(
  input: LogActivityInput,
  supabase: SupabaseBrowserClient = createClient()
) {
  const { data, error } = await supabase.rpc("log_activity", {
    p_action: input.action,
    p_module: input.module,
    p_target_item: input.targetItem,
    p_details: input.details,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateInventoryStockWithActivity(
  input: UpdateInventoryStockInput,
  supabase: SupabaseBrowserClient = createClient()
) {
  const { data, error } = await supabase.rpc(
    "update_inventory_stock_with_activity",
    {
      p_inventory_id: input.inventoryId,
      p_new_stock: input.newStock,
      p_details: input.details,
    }
  );

  if (error) {
    throw error;
  }

  const updatedInventory = data?.[0];

  if (!updatedInventory) {
    throw new Error("Inventory update did not return a row.");
  }

  return {
    id: updatedInventory.id,
    current_stock: Number(updatedInventory.current_stock),
    min_stock: Number(updatedInventory.min_stock),
  };
}
