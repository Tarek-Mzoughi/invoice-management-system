import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Copy, Download, Edit, Eye, ExternalLink, FileText, Mail, MessageCircle, MoreHorizontal, Paperclip, Trash2 } from 'lucide-react';
import { INVOICE_STATUS, Invoice } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
type InvoiceDetailsTab = 'payments' | 'linked-documents';
interface InvoiceDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    detailPathPrefix?: string;
    scope?: 'selling' | 'buying';
    initialTab?: InvoiceDetailsTab;
    onPreview?: () => void;
    onDownload?: () => void;
    onDuplicate?: () => void;
    onStatusChange?: () => void;
    onDelete?: () => void;
    onCreditNote?: () => void;
    onReturnNote?: () => void;
    onEmail?: () => void;
    onWhatsApp?: () => void;
    onAttachment?: () => void;
    onDownloadWithAttachments?: () => void;
    onLinkedDocumentPreview?: (type: string, id: number) => void;
}
const CREDIT_NOTE_DRAFT_STATUS = 'creditNote.status.draft';
const getStatusBadgeClassName = (status?: INVOICE_STATUS) => {
    switch (status) {
        case INVOICE_STATUS.Paid:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case INVOICE_STATUS.PartiallyPaid:
            return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300';
        case INVOICE_STATUS.PartiallySettled:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case INVOICE_STATUS.Settled:
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
        case INVOICE_STATUS.Unpaid:
            return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300';
        case INVOICE_STATUS.Draft:
        default:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
export const InvoiceDetailsDialog: React.FC<InvoiceDetailsDialogProps> = ({ open, onClose, invoice, detailPathPrefix = '/selling/invoice', scope = 'selling', initialTab = 'payments', onPreview, onDownload, onDuplicate, onStatusChange, onDelete, onCreditNote, onReturnNote, onEmail, onWhatsApp, onAttachment, onDownloadWithAttachments, onLinkedDocumentPreview }) => {
  const router = useGuardedRouter();
    const { t: tCommon } = useTranslation('common');
    const { t: tInvoicing } = useTranslation('invoicing');
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    const creditNoteLabels = useScopedDocumentLabels('creditNote', scope);
    const customerOrderLabels = useScopedDocumentLabels('customerOrder', scope);
    const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
    const locale = router.locale === 'fr' ? fr : enUS;
    const [activeTab, setActiveTab] = React.useState<InvoiceDetailsTab>(initialTab);
    React.useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
        }
    }, [initialTab, open]);
    if (!invoice) {
        return null;
    }
    const isEditable = [INVOICE_STATUS.Draft, INVOICE_STATUS.Unpaid].includes(invoice.status as INVOICE_STATUS);
    const visibleCreditNotes = (invoice.creditNotes || []).filter((creditNote) => creditNote.status !== CREDIT_NOTE_DRAFT_STATUS);
    const isTransformed = visibleCreditNotes.length > 0;
    const amountRemaining = Math.max((invoice.total || 0) -
        (invoice.amountPaid || 0) -
        (invoice.amountSettled || 0) -
        (invoice.taxWithholdingAmount || 0), 0);
    const renderPayments = () => (<div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900/40">
          <tr className="text-left text-zinc-600 dark:text-zinc-400">
            <th className="px-4 py-3 font-medium">Mode</th>
            <th className="px-4 py-3 font-medium">Montant</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {invoice.payments?.length ? (invoice.payments.map((entry) => (<tr key={entry.id}>
                <td className="px-4 py-3">
                  {entry.payment?.mode
                ? tInvoicing(`payment.payment_mode.${entry.payment.mode.toLowerCase()}`)
                : '-'}
                </td>
                <td className="px-4 py-3">
                  {entry.amount?.toLocaleString(router.locale || 'fr-FR', {
                minimumFractionDigits: invoice.currency?.digitAfterComma ?? 3,
                maximumFractionDigits: invoice.currency?.digitAfterComma ?? 3
            })}{' '}
                  {invoice.currency?.symbol}
                </td>
                <td className="px-4 py-3">
                  {entry.payment?.date
                ? format(parseISO(entry.payment.date), 'dd MMM yyyy HH:mm', { locale })
                : '-'}
                </td>
                <td className="px-4 py-3 text-right">{entry.payment?.collectionStatus || '-'}</td>
              </tr>))) : (<tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {tInvoicing('payment.no_payments') || 'Aucun paiement trouvé'}
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>);
    const renderLinkedDocuments = () => {
        const hasLinkedDocuments = visibleCreditNotes.length > 0 ||
            !!invoice.quotation ||
            !!invoice.customerOrder?.id ||
            !!invoice.customerOrderId ||
            !!invoice.deliveryNote?.id ||
            !!invoice.deliveryNoteId;
        return (<div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800" onClick={() => toast.info('Stock bientôt disponible...')}>
            {tInvoicing('invoice.details_dialog.stock_effect') || "Voir l'effet sur le stock"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr className="text-left text-zinc-600 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Type de Document</th>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">{tCommon('commands.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {visibleCreditNotes.map((creditNote) => (<tr key={`credit-note-${creditNote.id}`}>
                  <td className="px-4 py-3">{creditNoteLabels.singular}</td>
                  <td className="px-4 py-3 font-medium">
                    {creditNoteLabels.displayNumber(creditNote)}
                  </td>
                  <td className="px-4 py-3">
                    {creditNote.date
                    ? format(parseISO(creditNote.date), 'dd MMM yyyy HH:mm', { locale })
                    : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {creditNote.status ? tInvoicing(creditNote.status) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => creditNote.id &&
                    onLinkedDocumentPreview &&
                    onLinkedDocumentPreview('credit-note', creditNote.id)} disabled={!onLinkedDocumentPreview}>
                      {tInvoicing('invoice.action_view_document') || 'Voir le Document'}
                    </Button>
                  </td>
                </tr>))}

              {invoice.quotation && (<tr key={`quotation-${invoice.quotation.id}`}>
                  <td className="px-4 py-3">{tInvoicing('quotation.singular')}</td>
                  <td className="px-4 py-3 font-medium">{invoice.quotation.sequential || '-'}</td>
                  <td className="px-4 py-3">
                    {invoice.quotation.date
                    ? format(parseISO(invoice.quotation.date), 'dd MMM yyyy HH:mm', { locale })
                    : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.quotation.status ? tInvoicing(invoice.quotation.status) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => invoice.quotationId &&
                    onLinkedDocumentPreview &&
                    onLinkedDocumentPreview('quotation', invoice.quotationId)} disabled={!onLinkedDocumentPreview}>
                      {tInvoicing('invoice.action_view_document') || 'Voir le Document'}
                    </Button>
                  </td>
                </tr>)}

              {(invoice.customerOrder?.id || invoice.customerOrderId) && (<tr key={`customer-order-${invoice.customerOrder?.id || invoice.customerOrderId}`}>
                  <td className="px-4 py-3">{customerOrderLabels.singular}</td>
                  <td className="px-4 py-3 font-medium">
                    {invoice.customerOrder
                    ? customerOrderLabels.displayNumber(invoice.customerOrder)
                    : `#${invoice.customerOrderId}`}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.customerOrder?.date
                    ? format(parseISO(invoice.customerOrder.date), 'dd MMM yyyy HH:mm', {
                        locale
                    })
                    : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.customerOrder?.status ? tInvoicing(invoice.customerOrder.status) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => onLinkedDocumentPreview &&
                    onLinkedDocumentPreview('customer-order', (invoice.customerOrder?.id || invoice.customerOrderId)!)} disabled={!onLinkedDocumentPreview}>
                      {tInvoicing('invoice.action_view_document') || 'Voir le Document'}
                    </Button>
                  </td>
                </tr>)}

              {(invoice.deliveryNote?.id || invoice.deliveryNoteId) && (<tr key={`delivery-note-${invoice.deliveryNote?.id || invoice.deliveryNoteId}`}>
                  <td className="px-4 py-3">{deliveryNoteLabels.singular}</td>
                  <td className="px-4 py-3 font-medium">
                    {invoice.deliveryNote
                    ? deliveryNoteLabels.displayNumber(invoice.deliveryNote)
                    : `#${invoice.deliveryNoteId}`}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.deliveryNote?.date
                    ? format(parseISO(invoice.deliveryNote.date), 'dd MMM yyyy HH:mm', {
                        locale
                    })
                    : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.deliveryNote?.status ? tInvoicing(invoice.deliveryNote.status) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => onLinkedDocumentPreview &&
                    onLinkedDocumentPreview('delivery-note', (invoice.deliveryNote?.id || invoice.deliveryNoteId)!)} disabled={!onLinkedDocumentPreview}>
                      {tInvoicing('invoice.action_view_document') || 'Voir le Document'}
                    </Button>
                  </td>
                </tr>)}

              {!hasLinkedDocuments && (<tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {tInvoicing('invoice.details_dialog.no_linked_documents') ||
                    'Aucun document lié'}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>);
    };
    return (<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent hideClose className="flex h-full w-full flex-col border-l border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[620px]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-6 dark:border-zinc-800">
          <div>
            <SheetTitle className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {tInvoicing('invoice.details_dialog.title') || 'Voir le Document'}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {invoiceLabels.detailDescription}
            </SheetDescription>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800">
                  {tCommon('commands.actions')}
                  <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {onPreview && (<DropdownMenuItem onClick={onPreview} className="gap-2">
                    <Eye className="h-4 w-4"/>
                    {tCommon('commands.preview')}
                  </DropdownMenuItem>)}
                <DropdownMenuItem onClick={() => router.push(`${detailPathPrefix}/${invoice.id}`)} className="gap-2">
                  <ExternalLink className="h-4 w-4"/>
                  {tInvoicing('invoice.action_view_document')}
                </DropdownMenuItem>
                {isEditable && (<DropdownMenuItem onClick={() => router.push(`${detailPathPrefix}/${invoice.id}`)} className="gap-2">
                    <Edit className="h-4 w-4"/>
                    {tCommon('commands.edit')}
                  </DropdownMenuItem>)}
                {invoice.status !== INVOICE_STATUS.Draft && !isTransformed && onCreditNote && (<DropdownMenuItem onClick={onCreditNote} className="gap-2">
                    <FileText className="h-4 w-4"/>
                    {invoiceLabels.t('action_transform_to_credit_note')}
                  </DropdownMenuItem>)}
                {isTransformed && (<DropdownMenuItem onClick={() => setActiveTab('linked-documents')} className="gap-2">
                    <ExternalLink className="h-4 w-4"/>
                    {invoiceLabels.t('action_view_credit_note') || "Voir l'Avoir"}
                  </DropdownMenuItem>)}
                {onDownload && (<DropdownMenuItem onClick={onDownload} className="gap-2">
                    <Download className="h-4 w-4"/>
                    {tInvoicing('invoice.attributes.download_pdf')}
                  </DropdownMenuItem>)}
                {onEmail && (<DropdownMenuItem onClick={onEmail} className="gap-2">
                    <Mail className="h-4 w-4"/>
                    {tInvoicing('invoice.action_email')}
                  </DropdownMenuItem>)}
                {onWhatsApp && (<DropdownMenuItem onClick={onWhatsApp} className="gap-2">
                    <MessageCircle className="h-4 w-4"/>
                    {tInvoicing('invoice.action_whatsapp')}
                  </DropdownMenuItem>)}
                {onDuplicate && (<DropdownMenuItem onClick={onDuplicate} className="gap-2">
                    <Copy className="h-4 w-4"/>
                    {tCommon('commands.duplicate')}
                  </DropdownMenuItem>)}
                {onAttachment && (<DropdownMenuItem onClick={onAttachment} className="gap-2">
                    <Paperclip className="h-4 w-4"/>
                    {tInvoicing('invoice.action_attachments')}
                  </DropdownMenuItem>)}
                {onDownloadWithAttachments && (<DropdownMenuItem onClick={onDownloadWithAttachments} className="gap-2">
                    <Paperclip className="h-4 w-4"/>
                    {tInvoicing('invoice.action_download_with_attachments')}
                  </DropdownMenuItem>)}
                {onDelete && (<DropdownMenuItem onClick={onDelete} className="gap-2 text-rose-600 focus:text-rose-600">
                    <Trash2 className="h-4 w-4"/>
                    {tCommon('commands.delete')}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800" onClick={onClose}>
              {tCommon('commands.close')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {invoiceLabels.document}
                </span>
                <span className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {invoiceLabels.displayNumber(invoice)}
                </span>
                <Badge className={cn('rounded-full border px-3 py-1 text-xs font-semibold', getStatusBadgeClassName(invoice.status))}>
                  {invoice.status ? tInvoicing(invoice.status) : '-'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <p>
                  {invoice.date
            ? format(parseISO(invoice.date), 'dd MMM yyyy HH:mm', { locale })
            : '-'}
                </p>
                <p>
                  {tInvoicing('invoice.details_dialog.created_by') || 'Créé par'}:{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Tarek Mzoughi
                  </span>
                </p>
              </div>

              <button type="button" className="text-left text-2xl font-semibold text-blue-600 hover:text-blue-700" onClick={() => invoice.firmId && router.push(`/contacts/firm/${invoice.firmId}`)}>
                {invoice.firm?.name || invoiceLabels.partnerFallback}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {tInvoicing('invoice.attributes.total')}
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {(invoice.total || 0).toLocaleString(router.locale || 'fr-FR', {
            minimumFractionDigits: invoice.currency?.digitAfterComma ?? 3,
            maximumFractionDigits: invoice.currency?.digitAfterComma ?? 3
        })}{' '}
                  {invoice.currency?.symbol}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {tInvoicing('invoice.attributes.amount_paid')}
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {(invoice.amountPaid || 0).toLocaleString(router.locale || 'fr-FR', {
            minimumFractionDigits: invoice.currency?.digitAfterComma ?? 3,
            maximumFractionDigits: invoice.currency?.digitAfterComma ?? 3
        })}{' '}
                  {invoice.currency?.symbol}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {tInvoicing('invoice.attributes.amount_settled')}
                </p>
                <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {(invoice.amountSettled || 0).toLocaleString(router.locale || 'fr-FR', {
            minimumFractionDigits: invoice.currency?.digitAfterComma ?? 3,
            maximumFractionDigits: invoice.currency?.digitAfterComma ?? 3
        })}{' '}
                  {invoice.currency?.symbol}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {tInvoicing('invoice.attributes.remaining_amount')}
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {amountRemaining.toLocaleString(router.locale || 'fr-FR', {
            minimumFractionDigits: invoice.currency?.digitAfterComma ?? 3,
            maximumFractionDigits: invoice.currency?.digitAfterComma ?? 3
        })}{' '}
                  {invoice.currency?.symbol}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800" onClick={onDownload} disabled={!onDownload}>
                <Download className="mr-2 h-4 w-4"/>
                {tInvoicing('invoice.attributes.download_document') || 'Télécharger le Document'}
              </Button>
              <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800" onClick={() => toast.info('Graphique bientôt disponible...')}>
                {tInvoicing('invoice.details_dialog.graph') || 'Voir le Graphique'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-md bg-zinc-50 p-1 dark:bg-zinc-900/40">
              <button type="button" className={cn('rounded-sm px-4 py-3 text-sm font-medium transition-colors', activeTab === 'payments'
            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
            : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50')} onClick={() => setActiveTab('payments')}>
                {tInvoicing('payment.plural')}
              </button>
              <button type="button" className={cn('rounded-sm px-4 py-3 text-sm font-medium transition-colors', activeTab === 'linked-documents'
            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
            : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50')} onClick={() => setActiveTab('linked-documents')}>
                {tInvoicing('invoice.details_dialog.linked_documents') || 'Documents Liés'}
              </button>
            </div>

            {activeTab === 'payments' ? renderPayments() : renderLinkedDocuments()}
          </div>
        </div>
      </SheetContent>
    </Sheet>);
};
