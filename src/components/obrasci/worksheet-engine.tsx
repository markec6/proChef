"use client";

import {
  ClipboardList,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Salad,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildWorksheetCellUpdatedActivity,
  buildWorksheetPrintActivity,
  buildWorksheetRowAddedActivity,
  buildWorksheetRowDeletedActivity,
  logActivity,
  type LogActivityInput,
} from "@/lib/activity/log-activity";
import {
  DEFAULT_WORKSHEET_TEMPLATE_ID,
  WORKSHEET_TEMPLATES,
} from "@/lib/constants/obrasci";
import { printDocument } from "@/lib/print/print-document";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "@/providers/location-provider";
import type {
  WorksheetColumn,
  WorksheetDraftsByTemplate,
  WorksheetDraftState,
  WorksheetMealType,
  WorksheetRowState,
  WorksheetSection,
  WorksheetTemplate,
  WorksheetTemplateId,
} from "@/types/obrasci";

const CLINICAL_TEMPLATE_IDS: WorksheetTemplateId[] = [
  "daily-order",
  "stock-issuance",
];
const MEAL_OPTIONS: WorksheetMealType[] = ["Doručak", "Ručak", "Večera"];
const TEMPLATE_IDS = WORKSHEET_TEMPLATES.map((template) => template.id);

const TEMPLATE_CARD_META: Record<
  WorksheetTemplateId,
  { icon: LucideIcon; hint: string }
> = {
  "daily-order": {
    icon: ClipboardList,
    hint: "Dnevni nalozi za klinike",
  },
  "special-regimes": {
    icon: Salad,
    hint: "Posebni režimi i pacijenti",
  },
  "menus-normatives": {
    icon: UtensilsCrossed,
    hint: "Jelovnik i normative",
  },
  "stock-issuance": {
    icon: Package,
    hint: "Trebovanje i otprema",
  },
};

function getTemplateById(templateId: WorksheetTemplateId) {
  return (
    WORKSHEET_TEMPLATES.find((template) => template.id === templateId) ??
    WORKSHEET_TEMPLATES[0]
  );
}

function isClinicalTemplate(templateId: WorksheetTemplateId) {
  return CLINICAL_TEMPLATE_IDS.includes(templateId);
}

function isWorksheetMeal(value: string): value is WorksheetMealType {
  return MEAL_OPTIONS.includes(value as WorksheetMealType);
}

function isWorksheetTemplateId(value: string): value is WorksheetTemplateId {
  return TEMPLATE_IDS.includes(value as WorksheetTemplateId);
}

function getBelgradeDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

function getTodayDate() {
  const { year, month, day } = getBelgradeDateParts();
  return `${year}-${month}-${day}`;
}

function createDocumentNumber(prefix: string) {
  const { year, month, day } = getBelgradeDateParts();
  return `${prefix}-${year}${month}${day}`;
}

function createRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseNumeric(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTotal(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function getComputedCellValue(
  column: WorksheetColumn,
  cells: Record<string, string>
) {
  if (column.inputType !== "computed" || !column.computedFrom?.length) {
    return cells[column.id] ?? "";
  }

  const sources = column.computedFrom.map((columnId) => cells[columnId] ?? "");

  if (sources.every((value) => value.trim() === "")) {
    return "";
  }

  return formatTotal(
    sources.reduce((sum, value) => sum + parseNumeric(value), 0)
  );
}

function getRowLabel(template: WorksheetTemplate, row: WorksheetRowState) {
  const firstColumn = template.columns[0];
  return firstColumn ? row.cells[firstColumn.id]?.trim() : "";
}

function createBlankRow(
  template: WorksheetTemplate,
  sectionId?: string
): WorksheetRowState {
  const cells: Record<string, string> = {};

  for (const column of template.columns) {
    cells[column.id] = "";
  }

  return {
    id: createRowId(),
    sectionId: sectionId ?? template.sections?.[0]?.id,
    cells,
  };
}

function createRowsFromTemplate(template: WorksheetTemplate): WorksheetRowState[] {
  if (template.defaultRows?.length) {
    return template.defaultRows.map((defaultRow, index) => {
      const cells: Record<string, string> = {};

      for (const column of template.columns) {
        cells[column.id] = defaultRow[column.id] ?? "";
      }

      return {
        id: `${template.id}-${defaultRow.sectionId ?? "main"}-${index}`,
        sectionId: defaultRow.sectionId ?? template.sections?.[0]?.id,
        cells,
      };
    });
  }

  return Array.from({ length: template.initialRowCount }, (_, index) => ({
    ...createBlankRow(template),
    id: `${template.id}-row-${index}`,
  }));
}

function createDraft(template: WorksheetTemplate): WorksheetDraftState {
  return {
    header: {
      date: getTodayDate(),
      locationId: "",
      locationName: "",
      shiftWorker: "",
      meal: "Ručak",
      documentNumber: createDocumentNumber(template.documentPrefix),
    },
    rows: createRowsFromTemplate(template),
    signatures: {
      preparedBy: "",
      approvedBy: "",
      receivedBy: "",
    },
  };
}

function createInitialDrafts(): WorksheetDraftsByTemplate {
  return Object.fromEntries(
    WORKSHEET_TEMPLATES.map((template) => [template.id, createDraft(template)])
  ) as WorksheetDraftsByTemplate;
}

async function recordActivity(input: LogActivityInput) {
  try {
    await logActivity(input);
  } catch (error) {
    console.error("Failed to log worksheet activity:", error);
  }
}

function WorksheetField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const AutoExpandingTextarea = memo(function AutoExpandingTextarea({
  value,
  onChange,
  onBlur,
  onFocus,
  ariaLabel,
  compact = false,
  dense = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: () => void;
  ariaLabel: string;
  compact?: boolean;
  dense?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
  }, [value]);

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={(event) => onBlur?.(event.target.value)}
        aria-label={ariaLabel}
        className={cn(
          "block min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent text-slate-950 outline-none transition focus:bg-emerald-50/50 print:hidden",
          dense
            ? "px-1 py-0.5 text-[11px] font-normal leading-tight"
            : compact
              ? "px-1.5 py-1 text-xs font-normal leading-4"
              : "px-2 py-1 text-sm font-semibold leading-5"
        )}
      />
      <div
        className={cn(
          "hidden whitespace-pre-wrap print:block",
          dense
            ? "px-1 py-0.5 text-[11px] font-normal leading-tight"
            : compact
              ? "px-1.5 py-1 text-xs font-normal leading-4"
              : "px-2 py-1 text-sm font-semibold leading-5"
        )}
      >
        {value}
      </div>
    </>
  );
});

const CompactCellInput = memo(function CompactCellInput({
  value,
  onChange,
  onBlur,
  onFocus,
  ariaLabel,
  numeric = false,
  compact = false,
  dense = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: () => void;
  ariaLabel: string;
  numeric?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  return (
    <>
      <input
        type="text"
        inputMode={numeric ? "numeric" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={(event) => onBlur?.(event.target.value)}
        aria-label={ariaLabel}
        className={cn(
          "h-full min-h-8 w-full border-0 bg-transparent text-center text-slate-950 outline-none transition focus:bg-emerald-50/50 print:hidden",
          dense
            ? "px-1 py-0.5 text-[11px] leading-tight"
            : compact
              ? "px-1.5 py-1 text-xs leading-4"
              : "px-2 py-1 text-base",
          numeric ? "font-bold" : "font-normal"
        )}
      />
      <div
        className={cn(
          "hidden text-center whitespace-pre-wrap print:block",
          dense
            ? "px-1 py-0.5 text-[11px] leading-tight"
            : compact
              ? "px-1.5 py-1 text-xs leading-4"
              : "px-2 py-1 text-base",
          numeric ? "font-bold" : "font-normal"
        )}
      >
        {value}
      </div>
    </>
  );
});

const WorksheetRow = memo(function WorksheetRow({
  row,
  rowIndex,
  columns,
  printBreakAfterRowIndex,
  showRowNumberColumn,
  isCompactWorksheet,
  isJelovnikWorksheet,
  isSpecialRegimesWorksheet,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onDelete,
}: {
  row: WorksheetRowState;
  rowIndex: number;
  columns: WorksheetColumn[];
  printBreakAfterRowIndex?: number;
  showRowNumberColumn: boolean;
  isCompactWorksheet: boolean;
  isJelovnikWorksheet: boolean;
  isSpecialRegimesWorksheet: boolean;
  onCellChange: (rowId: string, columnId: string, value: string) => void;
  onCellFocus: (value: string) => void;
  onCellBlur: (
    row: WorksheetRowState,
    column: WorksheetColumn,
    value: string
  ) => void;
  onDelete: (row: WorksheetRowState) => void;
}) {
  return (
    <tr
      data-obrasci-print-break-after={
        printBreakAfterRowIndex === rowIndex ? "true" : undefined
      }
      className="align-middle"
    >
      {showRowNumberColumn ? (
        <td
          data-obrasci-index-col
          className={cn(
            "w-10 min-w-[40px] whitespace-nowrap border border-slate-400 text-center font-bold text-slate-950",
            isCompactWorksheet ? "px-1 py-0.5 text-xs" : "px-2 py-1 text-sm"
          )}
        >
          {rowIndex + 1}
        </td>
      ) : null}
      {columns.map((column) => {
        const cellValue =
          column.inputType === "computed"
            ? getComputedCellValue(column, row.cells)
            : (row.cells[column.id] ?? "");
        const ariaLabel = `${column.label}, red ${rowIndex + 1}`;

        return (
          <td
            key={column.id}
            style={{ width: column.width }}
            className={cn(
              "border border-slate-400 align-middle text-slate-950",
              column.inputType === "computed" && "bg-emerald-50/70",
              isCompactWorksheet ? "px-1 py-0.5" : "px-1.5 py-1"
            )}
          >
            {column.inputType === "computed" ? (
              <div
                className={cn(
                  "text-center font-bold",
                  isCompactWorksheet ? "px-1 text-xs" : "px-2 text-base"
                )}
              >
                {cellValue}
              </div>
            ) : column.inputType === "number" ||
              column.inputType === "compact-text" ? (
              <CompactCellInput
                value={cellValue}
                numeric={column.inputType === "number"}
                compact={isJelovnikWorksheet}
                dense={isSpecialRegimesWorksheet}
                ariaLabel={ariaLabel}
                onChange={(value) => onCellChange(row.id, column.id, value)}
                onFocus={() => {
                  onCellFocus(cellValue);
                }}
                onBlur={(value) => onCellBlur(row, column, value)}
              />
            ) : (
              <AutoExpandingTextarea
                value={cellValue}
                compact={isJelovnikWorksheet}
                dense={isSpecialRegimesWorksheet}
                ariaLabel={ariaLabel}
                onChange={(value) => onCellChange(row.id, column.id, value)}
                onFocus={() => {
                  onCellFocus(cellValue);
                }}
                onBlur={(value) => onCellBlur(row, column, value)}
              />
            )}
          </td>
        );
      })}
      <td
        data-obrasci-row-controls
        className="border border-slate-400 text-center print:hidden"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => onDelete(row)}
          aria-label={`Obriši red ${rowIndex + 1}`}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </td>
    </tr>
  );
});

export function WorksheetEngine() {
  const { profile } = useAuth();
  const { activeLocation } = useLocation();
  const [activeTemplateId, setActiveTemplateId] = useState<WorksheetTemplateId>(
    DEFAULT_WORKSHEET_TEMPLATE_ID
  );
  const [drafts, setDrafts] = useState<WorksheetDraftsByTemplate>(createInitialDrafts);
  const focusedCellValueRef = useRef("");
  const documentNumberRef = useRef("");

  const activeTemplate = useMemo(
    () => getTemplateById(activeTemplateId),
    [activeTemplateId]
  );
  const activeDraft = drafts[activeTemplateId];
  documentNumberRef.current = activeDraft.header.documentNumber;
  const isClinicalWorksheet = isClinicalTemplate(activeTemplateId);
  const isJelovnikWorksheet = activeTemplateId === "menus-normatives";
  const isSpecialRegimesWorksheet = activeTemplateId === "special-regimes";
  const isCompactWorksheet = isJelovnikWorksheet || isSpecialRegimesWorksheet;
  const showRowNumberColumn = !isSpecialRegimesWorksheet;
  const tableColumnSpan =
    activeTemplate.columns.length + (showRowNumberColumn ? 1 : 0) + 1;

  useEffect(() => {
    if (!activeLocation && !profile?.full_name) {
      return;
    }

    setDrafts((current) => {
      let changed = false;
      const next = { ...current };

      for (const templateId of TEMPLATE_IDS) {
        const draft = next[templateId];
        const nextLocationId = activeLocation?.id ?? draft.header.locationId;
        const nextLocationName =
          activeLocation?.name ?? draft.header.locationName;
        const nextShiftWorker =
          draft.header.shiftWorker || profile?.full_name || "";

        if (
          draft.header.locationId === nextLocationId &&
          draft.header.locationName === nextLocationName &&
          draft.header.shiftWorker === nextShiftWorker
        ) {
          continue;
        }

        changed = true;
        next[templateId] = {
          ...draft,
          header: {
            ...draft.header,
            locationId: nextLocationId,
            locationName: nextLocationName,
            shiftWorker: nextShiftWorker,
          },
        };
      }

      return changed ? next : current;
    });
  }, [activeLocation, profile?.full_name]);

  const updateActiveDraft = useCallback(
    (updater: (draft: WorksheetDraftState) => WorksheetDraftState) => {
      setDrafts((current) => ({
        ...current,
        [activeTemplateId]: updater(current[activeTemplateId]),
      }));
    },
    [activeTemplateId]
  );

  const updateHeaderField = useCallback(
    (field: keyof WorksheetDraftState["header"], value: string) => {
      updateActiveDraft((draft) => ({
        ...draft,
        header: {
          ...draft.header,
          [field]: value,
        },
      }));
    },
    [updateActiveDraft]
  );

  const updateCellValue = useCallback(
    (rowId: string, columnId: string, value: string) => {
      updateActiveDraft((draft) => ({
        ...draft,
        rows: draft.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                cells: {
                  ...row.cells,
                  [columnId]: value,
                },
              }
            : row
        ),
      }));
    },
    [updateActiveDraft]
  );

  const handleCellFocus = useCallback((value: string) => {
    focusedCellValueRef.current = value;
  }, []);

  const handleCellBlur = useCallback(
    (row: WorksheetRowState, column: WorksheetColumn, nextValue: string) => {
      const previousValue = focusedCellValueRef.current;

      if (previousValue === nextValue) {
        return;
      }

      void recordActivity(
        buildWorksheetCellUpdatedActivity({
          templateId: activeTemplateId,
          targetItem: documentNumberRef.current,
          sectionTitle: activeTemplate.sections?.find(
            (section) => section.id === row.sectionId
          )?.title,
          rowLabel: getRowLabel(activeTemplate, {
            ...row,
            cells: { ...row.cells, [column.id]: nextValue },
          }),
          columnLabel: column.label,
          previousValue,
          nextValue,
        })
      );
    },
    [activeTemplate, activeTemplateId]
  );

  const addRow = useCallback(
    (section?: WorksheetSection) => {
      const nextRow = createBlankRow(activeTemplate, section?.id);

      updateActiveDraft((draft) => {
        if (!section) {
          return {
            ...draft,
            rows: [...draft.rows, nextRow],
          };
        }

        const lastIndex = draft.rows.reduce(
          (index, row, rowIndex) =>
            row.sectionId === section.id ? rowIndex : index,
          -1
        );

        if (lastIndex === -1) {
          return {
            ...draft,
            rows: [...draft.rows, nextRow],
          };
        }

        const rows = [...draft.rows];
        rows.splice(lastIndex + 1, 0, nextRow);
        return { ...draft, rows };
      });

      void recordActivity(
        buildWorksheetRowAddedActivity({
          templateId: activeTemplateId,
          targetItem: documentNumberRef.current,
          sectionTitle: section?.title,
        })
      );
    },
    [activeTemplate, activeTemplateId, updateActiveDraft]
  );

  const deleteRow = useCallback(
    (row: WorksheetRowState) => {
      updateActiveDraft((draft) => ({
        ...draft,
        rows: draft.rows.filter((currentRow) => currentRow.id !== row.id),
      }));

      void recordActivity(
        buildWorksheetRowDeletedActivity({
          templateId: activeTemplateId,
          targetItem: documentNumberRef.current,
          sectionTitle: activeTemplate.sections?.find(
            (section) => section.id === row.sectionId
          )?.title,
          rowLabel: getRowLabel(activeTemplate, row),
        })
      );
    },
    [activeTemplate, activeTemplateId, updateActiveDraft]
  );

  const resetActiveWorksheet = () => {
    const nextDraft = createDraft(activeTemplate);

    setDrafts((current) => ({
      ...current,
      [activeTemplateId]: {
        ...nextDraft,
        header: {
          ...nextDraft.header,
          locationId: activeLocation?.id ?? "",
          locationName: activeLocation?.name ?? "",
          shiftWorker: profile?.full_name ?? "",
        },
      },
    }));
  };

  const printActiveWorksheet = () => {
    const printActivity = buildWorksheetPrintActivity({
      templateId: activeTemplateId,
      targetItem: activeDraft.header.documentNumber,
      documentNumber: activeDraft.header.documentNumber,
      date: activeDraft.header.date,
      meal: activeDraft.header.meal,
    });

    printDocument(() => {
      void recordActivity(printActivity);
    });
  };

  const summaryColumns = useMemo(
    () =>
      activeTemplate.columns.filter(
        (column) => column.inputType === "number" || column.inputType === "computed"
      ),
    [activeTemplate]
  );

  const columnTotals = useMemo(
    () =>
      Object.fromEntries(
        summaryColumns.map((column) => {
          const total = activeDraft.rows.reduce((sum, row) => {
            const value =
              column.inputType === "computed"
                ? getComputedCellValue(column, row.cells)
                : (row.cells[column.id] ?? "");
            return sum + parseNumeric(value);
          }, 0);

          return [column.id, formatTotal(total)];
        })
      ),
    [activeDraft.rows, summaryColumns]
  );

  const renderWorksheetRow = (row: WorksheetRowState, rowIndex: number) => (
    <WorksheetRow
      key={row.id}
      row={row}
      rowIndex={rowIndex}
      columns={activeTemplate.columns}
      printBreakAfterRowIndex={activeTemplate.printBreakAfterRowIndex}
      showRowNumberColumn={showRowNumberColumn}
      isCompactWorksheet={isCompactWorksheet}
      isJelovnikWorksheet={isJelovnikWorksheet}
      isSpecialRegimesWorksheet={isSpecialRegimesWorksheet}
      onCellChange={updateCellValue}
      onCellFocus={handleCellFocus}
      onCellBlur={handleCellBlur}
      onDelete={deleteRow}
    />
  );

  const renderSectionedRows = () => {
    const sections = activeTemplate.sections ?? [];

    return sections.flatMap((section, sectionIndex) => {
      const sectionRows = activeDraft.rows
        .map((row, rowIndex) => ({ row, rowIndex }))
        .filter(({ row }) => (row.sectionId ?? sections[0]?.id) === section.id);

      return [
        section.title ? (
          <tr
            key={`section-${section.id}`}
            data-obrasci-section-row
            data-obrasci-print-break-before={
              section.printBreakBefore ? "true" : undefined
            }
          >
            <td
              colSpan={tableColumnSpan}
              className="border border-slate-400 bg-slate-200 px-2 py-1 text-center text-[11px] font-bold tracking-wide text-slate-800 uppercase"
            >
              {section.title}
            </td>
          </tr>
        ) : null,
        ...sectionRows.map(({ row, rowIndex }) =>
          renderWorksheetRow(row, rowIndex)
        ),
        <tr key={`add-${section.id}`} data-obrasci-row-controls className="print:hidden">
          <td colSpan={tableColumnSpan} className="border border-slate-300 px-2 py-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-emerald-700"
              onClick={() => addRow(section)}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {section.title
                ? `Dodaj red (${section.title})`
                : sectionIndex === 0
                  ? "Dodaj red"
                  : "Dodaj red u sekciju"}
            </Button>
          </td>
        </tr>,
      ];
    });
  };

  return (
    <div data-obrasci-workspace className="flex w-full flex-col gap-4">
      <div data-obrasci-controls className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Obrasci & nalozi
          </h1>
          <p className="text-sm text-muted-foreground">
            Digitalni obrasci za dnevne naloge, kuhinjsku evidenciju i otpremu.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WORKSHEET_TEMPLATES.map((template) => {
          const meta = TEMPLATE_CARD_META[template.id];
          const Icon = meta.icon;
          const isActive = template.id === activeTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setActiveTemplateId(template.id)}
              className="text-left"
            >
              <Card
                className={cn(
                  "h-full transition hover:border-emerald-300 hover:shadow-sm",
                  isActive && "border-emerald-500 ring-2 ring-emerald-500/20"
                )}
              >
                <CardHeader className="gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/10 text-emerald-700"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <CardTitle>{template.selectorLabel}</CardTitle>
                  <CardDescription>{meta.hint}</CardDescription>
                </CardHeader>
              </Card>
            </button>
          );
        })}
      </div>

      <div
        data-obrasci-controls
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <WorksheetField label="Šablon obrasca" className="sm:w-72">
          <select
            value={activeTemplateId}
            onChange={(event) => {
              if (isWorksheetTemplateId(event.target.value)) {
                setActiveTemplateId(event.target.value);
              }
            }}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Izaberi šablon obrasca"
          >
            {WORKSHEET_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.selectorLabel}
              </option>
            ))}
          </select>
        </WorksheetField>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={resetActiveWorksheet}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Resetuj
          </Button>
          {!activeTemplate.sections?.length ? (
            <Button type="button" variant="outline" onClick={() => addRow()}>
              <Plus className="size-4" aria-hidden="true" />
              Dodaj red
            </Button>
          ) : null}
          <Button type="button" onClick={printActiveWorksheet}>
            <Printer className="size-4" aria-hidden="true" />
            Štampaj
          </Button>
        </div>
      </div>
      </div>

      <section
        data-obrasci-sheet
        data-obrasci-template={activeTemplateId}
        data-obrasci-print-pages={isCompactWorksheet ? "2" : "1"}
        className="gpu-sheet min-h-[297mm] w-full max-w-none rounded-xl border border-slate-200 bg-white p-8 text-slate-950 shadow-xl"
      >
        <div
          data-obrasci-sheet-header
          className="flex items-start justify-between gap-6 border-b border-slate-300 pb-4"
        >
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-700 uppercase">
              proChef
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {activeTemplate.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 print:hidden">
              {activeTemplate.subtitle}
            </p>
          </div>
          <div className="rounded-lg border border-slate-300 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Broj dokumenta
            </p>
            <input
              type="text"
              value={activeDraft.header.documentNumber}
              onChange={(event) =>
                updateHeaderField("documentNumber", event.target.value)
              }
              className="mt-1 w-44 border-0 bg-transparent text-right text-sm font-bold outline-none"
              aria-label="Broj dokumenta"
            />
          </div>
        </div>

        <div
          data-obrasci-metadata
          className="mt-4 grid gap-3 border-b border-slate-200 pb-4 sm:grid-cols-3"
        >
          <WorksheetField label="Datum">
            <input
              type="date"
              value={activeDraft.header.date}
              onChange={(event) => updateHeaderField("date", event.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-transparent px-2 text-sm outline-none"
            />
          </WorksheetField>
          <WorksheetField label="Smena / Radnik" className="print:hidden">
            <input
              type="text"
              value={activeDraft.header.shiftWorker}
              onChange={(event) =>
                updateHeaderField("shiftWorker", event.target.value)
              }
              className="h-8 rounded-md border border-slate-300 bg-transparent px-2 text-sm outline-none"
            />
          </WorksheetField>
          <WorksheetField label="Obrok">
            <select
              value={activeDraft.header.meal}
              onChange={(event) => {
                if (isWorksheetMeal(event.target.value)) {
                  updateHeaderField("meal", event.target.value);
                }
              }}
              className="h-8 rounded-md border border-slate-300 bg-transparent px-2 text-sm outline-none print:hidden"
              aria-label="Obrok"
            >
              {MEAL_OPTIONS.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
            <span className="hidden text-sm font-semibold print:inline">
              OBROK: {activeDraft.header.meal}
            </span>
          </WorksheetField>
        </div>

        <div className="mt-4 w-full overflow-x-auto print:mt-2 print:overflow-visible">
          <table className="w-full table-fixed border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100">
                {showRowNumberColumn ? (
                  <th
                    data-obrasci-index-col
                    className={cn(
                      "w-10 min-w-[40px] whitespace-nowrap border border-slate-400 text-center font-semibold",
                      isCompactWorksheet
                        ? "px-1 py-1 text-[11px]"
                        : "px-2 py-1.5 text-[11px]"
                    )}
                  >
                    Br.
                  </th>
                ) : null}
                {activeTemplate.columns.map((column) => (
                  <th
                    key={column.id}
                    data-obrasci-nowrap={column.nowrap ? "true" : undefined}
                    style={{ width: column.width }}
                    className={cn(
                      "border border-slate-400 font-semibold uppercase",
                      isCompactWorksheet
                        ? "px-1 py-1 text-[11px]"
                        : "px-2 py-1.5 text-[11px]",
                      column.nowrap && "whitespace-nowrap",
                      column.inputType === "number" ||
                        column.inputType === "computed" ||
                        column.inputType === "compact-text"
                        ? "text-center"
                        : "text-left"
                    )}
                  >
                    {column.label}
                  </th>
                ))}
                <th
                  data-obrasci-row-controls
                  className="w-10 border border-slate-400 print:hidden"
                />
              </tr>
            </thead>
            <tbody>
              {activeTemplate.sections?.length
                ? renderSectionedRows()
                : activeDraft.rows.map((row, rowIndex) =>
                    renderWorksheetRow(row, rowIndex)
                  )}
            </tbody>
            {isClinicalWorksheet ? (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  {showRowNumberColumn ? (
                    <td
                      data-obrasci-index-col
                      className="w-10 min-w-[40px] whitespace-nowrap border border-slate-400"
                    />
                  ) : null}
                  {activeTemplate.columns.map((column, columnIndex) => (
                    <td
                      key={column.id}
                      className={cn(
                        "border border-slate-400 px-2 py-1 text-sm",
                        column.inputType === "computed" && "bg-emerald-100",
                        column.inputType === "number" ||
                          column.inputType === "computed"
                          ? "text-center"
                          : "text-left"
                      )}
                    >
                      {columnIndex === 0
                        ? "UKUPNO"
                        : (columnTotals[column.id] ?? "")}
                    </td>
                  ))}
                  <td className="border border-slate-400 print:hidden" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        {!activeTemplate.sections?.length ? (
          <div data-obrasci-row-controls className="mt-3 print:hidden">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-emerald-700"
              onClick={() => addRow()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Dodaj novi red
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
