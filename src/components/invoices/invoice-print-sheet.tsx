import {
  formatInvoiceDate,
  formatInvoiceMoney,
  INVOICE_ISSUER,
  INVOICE_STATUS_META,
} from "@/lib/constants/invoices";
import type { InvoiceWithItems } from "@/types/invoice";

function formatInvoiceQuantity(value: number) {
  return new Intl.NumberFormat("sr-RS", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function InvoicePrintSheet({ invoice }: { invoice: InvoiceWithItems }) {
  const statusLabel = INVOICE_STATUS_META[invoice.status].label;

  return (
    <div data-invoice-print>
      <section
        data-invoice-sheet
        className="pointer-events-none fixed top-0 -left-[9999px] min-h-[297mm] w-[210mm] bg-white p-8 text-slate-950 shadow-none print:pointer-events-auto print:static print:left-auto print:w-full print:min-h-0 print:p-0 print:shadow-none"
      >
        <div className="flex items-start justify-between gap-6 border-b border-slate-300 pb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-700 uppercase">
              {INVOICE_ISSUER.brand} ERP
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              FAKTURA / OBRAČUN
            </h2>
            <p className="mt-1 text-sm text-slate-600">{INVOICE_ISSUER.legalName}</p>
          </div>
          <div className="rounded-lg border border-slate-300 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Broj dokumenta
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums">
              {invoice.invoice_number}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Klijent / Bolnica
            </p>
            <p className="mt-1 font-semibold">{invoice.client_name}</p>
            <p className="text-slate-600">PIB {invoice.client_pib}</p>
            <p className="text-slate-600">{invoice.client_address}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Period obračuna
              </p>
              <p className="mt-1 tabular-nums">
                {formatInvoiceDate(invoice.period_start)} –{" "}
                {formatInvoiceDate(invoice.period_end)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Status
              </p>
              <p className="mt-1 font-semibold">{statusLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Datum izdavanja
              </p>
              <p className="mt-1 tabular-nums">
                {formatInvoiceDate(invoice.issue_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Rok (Valuta)
              </p>
              <p className="mt-1 tabular-nums">
                {formatInvoiceDate(invoice.due_date)}
              </p>
            </div>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-[11px] tracking-[0.08em] text-slate-500 uppercase">
              <th className="py-2 pr-3 font-semibold">Usluga / obrok</th>
              <th className="py-2 pr-3 text-right font-semibold">Količina</th>
              <th className="py-2 pr-3 text-right font-semibold">Jed. cena</th>
              <th className="py-2 text-right font-semibold">Iznos</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="py-2 pr-3">{item.description}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatInvoiceQuantity(item.quantity)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatInvoiceMoney(item.unit_price)}
                </td>
                <td className="py-2 text-right font-medium tabular-nums">
                  {formatInvoiceMoney(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-72 space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Osnovica</span>
            <span className="tabular-nums">
              {formatInvoiceMoney(invoice.subtotal_amount)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">PDV ({invoice.tax_rate}%)</span>
            <span className="tabular-nums">
              {formatInvoiceMoney(invoice.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-300 pt-2 text-base font-bold">
            <span>Ukupno sa PDV-om</span>
            <span className="tabular-nums">
              {formatInvoiceMoney(invoice.total_amount)}
            </span>
          </div>
        </div>

        {invoice.note ? (
          <p className="mt-4 text-sm text-slate-600">Napomena: {invoice.note}</p>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Instrukcije za plaćanje
            </p>
            <p className="mt-2">{INVOICE_ISSUER.paymentNote}</p>
            <p className="mt-1">{INVOICE_ISSUER.bankName}</p>
            <p className="tabular-nums">{INVOICE_ISSUER.accountNumber}</p>
            <p className="mt-1 text-slate-600">
              {INVOICE_ISSUER.address} · PIB {INVOICE_ISSUER.pib}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-h-24 rounded-lg border border-dashed border-slate-300 p-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Potpis / pečat
              </p>
            </div>
            <div className="min-h-24 rounded-lg border border-dashed border-slate-300 p-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Odgovorno lice
              </p>
              <p className="mt-6 text-sm">{invoice.created_by_user_name}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
