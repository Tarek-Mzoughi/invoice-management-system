import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Copy, Download, Edit, Eye, Mail, MessageCircle, Paperclip, Trash2 } from 'lucide-react';
import { ACTIVITY_TYPE, CREDIT_NOTE_STATUS, CreditNote } from '@/types';
import { cn } from '@/lib/utils';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface CreditNoteDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    creditNote: CreditNote | null;
    detailPathPrefix?: string;
    scope?: 'selling' | 'buying';
    onPreview?: () => void;
    onDownload?: () => void;
    onDownloadWithAttachments?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onEmail?: () => void;
    onWhatsApp?: () => void;
    onAttachment?: () => void;
    onLinkedDocumentOpen?: (type: string, id: number) => void;
}
const getStatusBadgeClassName = (status?: CREDIT_NOTE_STATUS) => {
    switch (status) {
        case CREDIT_NOTE_STATUS.Paid:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case CREDIT_NOTE_STATUS.PartiallyPaid:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case CREDIT_NOTE_STATUS.Unpaid:
            return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300';
        case CREDIT_NOTE_STATUS.Expired:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
        case CREDIT_NOTE_STATUS.Draft:
        default:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
export const CreditNoteDetailsDialog: React.FC<CreditNoteDetailsDialogProps> = ({ open, onClose, creditNote, detailPathPrefix = '/selling/credit-note', scope = 'selling', onPreview, onDownload, onDownloadWithAttachments, onDuplicate, onDelete, onEmail, onWhatsApp, onAttachment, onLinkedDocumentOpen }) => {
  const router = useGuardedRouter();
    const { t: tCommon } = useTranslation('common');
    const { t: tInvoicing } = useTranslation('invoicing');
    const documentLabels = useScopedDocumentLabels('creditNote', scope);
    const returnNoteLabels = useScopedDocumentLabels('returnNote', scope);
    const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    const locale = router.locale === 'fr' ? fr : enUS;
    const [isActionsOpen, setIsActionsOpen] = React.useState(false);
    const runMenuAction = React.useCallback((action?: () => void) => {
        if (!action)
            return;
        setIsActionsOpen(false);
        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                action();
            });
            return;
        }
        action();
    }, []);
    if (!creditNote) {
        return null;
    }
    const hasUploads = (creditNote.uploads?.length ?? 0) > 0;
    const partnerLabel = tInvoicing('creditNote.attributes.customer');
    const partnerName = creditNote.firm?.name || documentLabels.partnerFallback;
    const linkedDocuments = [
        creditNote.sourceInvoice?.id
            ? {
                key: `source-invoice-${creditNote.sourceInvoice.id}`,
                type: 'invoice',
                label: invoiceLabels.singular,
                document: creditNote.sourceInvoice
            }
            : null,
        creditNote.sourceReturnNote?.id
            ? {
                key: `source-return-note-${creditNote.sourceReturnNote.id}`,
                type: 'return-note',
                label: returnNoteLabels.singular,
                document: creditNote.sourceReturnNote
            }
            : null,
        creditNote.quotation?.id
            ? {
                key: `quotation-${creditNote.quotation.id}`,
                type: 'quotation',
                label: tInvoicing('quotation.singular'),
                document: creditNote.quotation
            }
            : null,
        creditNote.deliveryNote?.id
            ? {
                key: `delivery-note-${creditNote.deliveryNote.id}`,
                type: 'delivery-note',
                label: deliveryNoteLabels.singular,
                document: creditNote.deliveryNote
            }
            : null,
        creditNote.goodsIssueNote?.id
            ? {
                key: `goods-issue-note-${creditNote.goodsIssueNote.id}`,
                type: 'goods-issue-note',
                label: tInvoicing('goodsIssueNote.singular'),
                document: creditNote.goodsIssueNote
            }
            : null
    ].filter((entry): entry is {
        key: string;
        type: string;
        label: string;
        document: NonNullable<CreditNote['sourceInvoice']>;
    } => !!entry);
    return (<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent hideClose className="flex h-full flex-col border-l border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[680px]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-900">
          <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {tInvoicing('creditNote.details.view_document')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {documentLabels.detailDescription}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu modal={false} open={isActionsOpen} onOpenChange={setIsActionsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 border-zinc-200 px-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  {tCommon('commands.actions')}
                  <ChevronDown className="h-4 w-4 opacity-50"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="z-[70] w-64 p-1">
                {onPreview && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onPreview);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Eye className="h-4 w-4"/>
                    {tCommon('commands.preview')}
                  </DropdownMenuItem>)}

                <DropdownMenuItem onSelect={(event) => {
            event.preventDefault();
            runMenuAction(() => {
                if (creditNote.id) {
                    router.push(`${detailPathPrefix}/${creditNote.id}`);
                }
            });
        }} className="cursor-pointer gap-2 px-3 py-2">
                  <Edit className="h-4 w-4"/>
                  {tCommon('commands.edit')}
                </DropdownMenuItem>

                {onDownload && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDownload);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Download className="h-4 w-4"/>
                    {tInvoicing('creditNote.details.download_pdf')}
                  </DropdownMenuItem>)}

                {onEmail && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onEmail);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Mail className="h-4 w-4"/>
                    {tInvoicing('creditNote.details.send_email')}
                  </DropdownMenuItem>)}

                {onWhatsApp && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onWhatsApp);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <MessageCircle className="h-4 w-4 text-green-500"/>
                    {tInvoicing('creditNote.details.send_whatsapp')}
                  </DropdownMenuItem>)}

                {onAttachment && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onAttachment);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Paperclip className="h-4 w-4"/>
                    {tInvoicing('creditNote.details.manage_attachments')}
                  </DropdownMenuItem>)}

                {onDuplicate && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDuplicate);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Copy className="h-4 w-4"/>
                    {tCommon('commands.duplicate')}
                  </DropdownMenuItem>)}

                {hasUploads && onDownloadWithAttachments && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDownloadWithAttachments);
            }} className="cursor-pointer gap-2 px-3 py-2">
                    <Paperclip className="h-4 w-4"/>
                    {tInvoicing('creditNote.details.download_with_attachments')}
                  </DropdownMenuItem>)}

                {onDelete && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDelete);
            }} className="cursor-pointer gap-2 px-3 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50">
                    <Trash2 className="h-4 w-4"/>
                    {tCommon('commands.delete')}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-9 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900" onClick={onClose}>
              {tCommon('commands.close')}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {documentLabels.document}
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {documentLabels.displayNumber(creditNote)}
              </span>
              <Badge className={cn('px-2.5 py-0.5 text-xs font-semibold', getStatusBadgeClassName(creditNote.status))}>
                {creditNote.status ? tInvoicing(creditNote.status) : '-'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {creditNote.date
            ? format(parseISO(creditNote.date), 'dd MMMM, yyyy HH:mm', { locale })
            : '-'}
              </p>
              <p className="text-sm italic text-zinc-500 dark:text-zinc-500">
                {tInvoicing('creditNote.details.created_by')}:{' '}
                <span className="whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                  Tarek Mzoughi
                </span>
              </p>
            </div>

            <div className="pt-2">
              <button type="button" onClick={() => creditNote.firmId && router.push(`/contacts/firm/${creditNote.firmId}`)} className="text-left font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                {partnerName}
              </button>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{partnerLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="h-10 gap-2 border-zinc-200 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900" onClick={onDownload} disabled={!onDownload}>
              <Download className="h-4 w-4 text-zinc-500"/>
              {tInvoicing('creditNote.details.download_document')}
            </Button>
          </div>

          <div className="space-y-4 border-t border-zinc-100 pt-8 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {tInvoicing('creditNote.details.linked_documents')}
              </h3>
            </div>

            <div className="overflow-hidden rounded-md border border-zinc-100 dark:border-zinc-900">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50 font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">{tInvoicing('creditNote.details.document_type')}</th>
                    <th className="px-4 py-3">{tInvoicing('creditNote.details.reference')}</th>
                    <th className="px-4 py-3">{tInvoicing('creditNote.attributes.date')}</th>
                    <th className="px-4 py-3">{tInvoicing('creditNote.attributes.status')}</th>
                    <th className="px-4 py-3 text-right">{tCommon('commands.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {linkedDocuments.map(({ key, type, label, document }) => (<tr key={key} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {type === 'invoice'
                ? invoiceLabels.singular
                : type === 'return-note'
                    ? returnNoteLabels.singular
                    : type === 'delivery-note'
                        ? deliveryNoteLabels.singular
                        : label}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {type === 'invoice'
                ? invoiceLabels.displayNumber(document)
                : type === 'return-note'
                    ? returnNoteLabels.displayNumber(document)
                    : type === 'delivery-note'
                        ? deliveryNoteLabels.displayNumber(document)
                        : document.reference || document.sequential || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {document.date
                ? format(parseISO(document.date), 'dd MMMM, yyyy HH:mm', { locale })
                : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {'status' in document && document.status
                ? tInvoicing(document.status)
                : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20" onClick={() => document.id &&
                onLinkedDocumentOpen &&
                onLinkedDocumentOpen(type, document.id)} disabled={!document.id || !onLinkedDocumentOpen}>
                          {tInvoicing('creditNote.details.view_linked_document')}
                        </Button>
                      </td>
                    </tr>))}

                  {!linkedDocuments.length && (<tr>
                      <td colSpan={5} className="px-4 py-8 text-center italic text-zinc-400 dark:text-zinc-600">
                        {tInvoicing('creditNote.details.no_linked_documents')}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>);
};
