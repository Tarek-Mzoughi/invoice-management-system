import { FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Invoice, PaymentInvoiceEntry } from '@/types';
import { formatAmount, getInvoiceRemainingAmount } from './payment-workflow-utils';
import { PaymentWorkflowEmptyState, formatWorkflowDate } from './payment-workflow-ui';

interface PayableDocumentsCardProps {
  disabled?: boolean;
  documents: Invoice[];
  documentSearch: string;
  emptyLabel: string;
  formatStatus: (status?: string) => string;
  getPaymentRemainingAmount: (invoice: Invoice) => number;
  onDocumentSearchChange: (value: string) => void;
  onOpenDocument: (invoice: Invoice) => void;
  onToggleDocument: (invoiceId?: number) => void;
  onUpdateAllocation: (invoiceId: number | undefined, value: number) => void;
  searchPlaceholder: string;
  selectedEntries: PaymentInvoiceEntry[];
  selectPartnerLabel: string;
  title: string;
  hasPartner?: boolean;
  labels: {
    date: string;
    dueDate: string;
    number: string;
    payment: string;
    remaining: string;
    status: string;
    total: string;
  };
}

const toNumericInput = (value: number | undefined) => (Number.isFinite(value) ? String(value) : '');

export const PayableDocumentsCard = ({
  disabled,
  documents,
  documentSearch,
  emptyLabel,
  formatStatus,
  getPaymentRemainingAmount,
  hasPartner,
  labels,
  onDocumentSearchChange,
  onOpenDocument,
  onToggleDocument,
  onUpdateAllocation,
  searchPlaceholder,
  selectedEntries,
  selectPartnerLabel,
  title
}: PayableDocumentsCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {title}
        </CardTitle>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            className="pl-9"
            value={documentSearch}
            onChange={(event) => onDocumentSearchChange(event.target.value)}
            disabled={disabled}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-5 pt-0">
      {!hasPartner ? (
        <PaymentWorkflowEmptyState label={selectPartnerLabel} />
      ) : documents.length === 0 ? (
        <PaymentWorkflowEmptyState label={emptyLabel} />
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>{labels.number}</TableHead>
                <TableHead>{labels.date}</TableHead>
                <TableHead>{labels.dueDate}</TableHead>
                <TableHead>{labels.total}</TableHead>
                <TableHead>{labels.remaining}</TableHead>
                <TableHead>{labels.payment}</TableHead>
                <TableHead>{labels.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((invoice) => {
                const selectedEntry = selectedEntries.find((entry) => entry.invoice?.id === invoice.id);
                const remainingAmount = getInvoiceRemainingAmount(invoice);
                const paymentRemaining = getPaymentRemainingAmount(invoice);

                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Checkbox
                        checked={!!selectedEntry}
                        disabled={disabled}
                        onCheckedChange={() => onToggleDocument(invoice.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-left font-medium text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => onOpenDocument(invoice)}>
                        {invoice.sequential || invoice.reference || `INV-${invoice.id}`}
                      </button>
                    </TableCell>
                    <TableCell>{formatWorkflowDate(invoice.date)}</TableCell>
                    <TableCell>{formatWorkflowDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatAmount(invoice.total || 0, invoice.currency)}</TableCell>
                    <TableCell>{formatAmount(remainingAmount, invoice.currency)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={paymentRemaining}
                        step="0.001"
                        value={toNumericInput(selectedEntry?.amount || 0)}
                        disabled={disabled || !selectedEntry}
                        onChange={(event) =>
                          onUpdateAllocation(invoice.id, Number(event.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(invoice.status)}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);
