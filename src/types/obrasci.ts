export type WorksheetTemplateId =
  | "daily-order"
  | "special-regimes"
  | "menus-normatives"
  | "stock-issuance";

export type WorksheetCellType = "text" | "number" | "compact-text" | "computed";
export type WorksheetMealType = "Doručak" | "Ručak" | "Večera";

export interface WorksheetColumn {
  id: string;
  label: string;
  width?: string;
  inputType?: WorksheetCellType;
  computedFrom?: string[];
  nowrap?: boolean;
}

export interface WorksheetSection {
  id: string;
  title: string;
  printBreakBefore?: boolean;
}

export type WorksheetDefaultRow = Record<string, string> & {
  sectionId?: string;
};

export interface WorksheetTemplate {
  id: WorksheetTemplateId;
  title: string;
  selectorLabel: string;
  subtitle: string;
  documentPrefix: string;
  initialRowCount: number;
  columns: WorksheetColumn[];
  defaultRows?: WorksheetDefaultRow[];
  sections?: WorksheetSection[];
  printBreakAfterRowIndex?: number;
}

export interface WorksheetHeaderState {
  date: string;
  locationId: string;
  locationName: string;
  shiftWorker: string;
  meal: WorksheetMealType;
  documentNumber: string;
}

export interface WorksheetRowState {
  id: string;
  sectionId?: string;
  cells: Record<string, string>;
}

export interface WorksheetSignatureState {
  preparedBy: string;
  approvedBy: string;
  receivedBy: string;
}

export interface WorksheetDraftState {
  header: WorksheetHeaderState;
  rows: WorksheetRowState[];
  signatures: WorksheetSignatureState;
}

export type WorksheetDraftsByTemplate = Record<
  WorksheetTemplateId,
  WorksheetDraftState
>;
