import React from 'react';
import { cn } from '@/lib/utils';
import { Building2, Calendar, FileText, Hash, Receipt } from 'lucide-react';

interface SupplierInfo {
  name?: string;
  address?: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

interface InvoiceItem {
  title: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  lineTotal: number;
}

interface InvoiceTotals {
  subtotal: number;
  taxTotal: number;
  total: number;
}

interface InvoiceAnalysisData {
  supplier?: SupplierInfo;
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  currency?: string;
  items?: InvoiceItem[];
  totals?: InvoiceTotals;
  paymentTerms?: string;
  notes?: string;
}

interface AiInvoiceAnalysisCardProps {
  data: InvoiceAnalysisData;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency === 'TND' ? 'TND' : currency,
    minimumFractionDigits: 3,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function AiInvoiceAnalysisCard({ data }: AiInvoiceAnalysisCardProps) {
  const currency = data.currency || 'TND';

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-transparent border-b">
        <Receipt className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
          Analyse de facture fournisseur
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Supplier & Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.supplier && data.supplier.name && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">{data.supplier.name}</p>
                {data.supplier.address && (
                  <p className="text-muted-foreground">{data.supplier.address}</p>
                )}
                {data.supplier.taxId && (
                  <p className="text-muted-foreground">MF: {data.supplier.taxId}</p>
                )}
                {data.supplier.email && (
                  <p className="text-muted-foreground">{data.supplier.email}</p>
                )}
                {data.supplier.phone && (
                  <p className="text-muted-foreground">{data.supplier.phone}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {data.invoiceNumber && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">N°</span>
                <span className="text-xs font-medium">{data.invoiceNumber}</span>
              </div>
            )}
            {data.date && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Date</span>
                <span className="text-xs font-medium">{formatDate(data.date)}</span>
              </div>
            )}
            {data.dueDate && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Echéance</span>
                <span className="text-xs font-medium">{formatDate(data.dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        {data.items && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Article</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Qté</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">P.U.</th>
                  {data.items.some((i) => i.taxRate !== undefined) && (
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">TVA</th>
                  )}
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className={cn('border-b border-muted/30', idx % 2 === 0 && 'bg-muted/10')}>
                    <td className="py-2 px-2">{item.title}</td>
                    <td className="py-2 px-2 text-right">{item.quantity}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice, currency)}</td>
                    {data.items!.some((i) => i.taxRate !== undefined) && (
                      <td className="py-2 px-2 text-right">
                        {item.taxRate !== undefined ? `${item.taxRate}%` : '-'}
                      </td>
                    )}
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.lineTotal, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        {data.totals && (
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>{formatCurrency(data.totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatCurrency(data.totals.taxTotal, currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t font-semibold text-sm">
                <span>Total TTC</span>
                <span className="text-primary">{formatCurrency(data.totals.total, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Terms / Notes */}
        {(data.paymentTerms || data.notes) && (
          <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
            {data.paymentTerms && <p>Conditions: {data.paymentTerms}</p>}
            {data.notes && <p>Notes: {data.notes}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
