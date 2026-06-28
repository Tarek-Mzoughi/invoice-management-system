import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Copy, Download, Edit, Eye, FileText, LayoutDashboard, Mail, MessageCircle, Package, Paperclip, Trash2 } from 'lucide-react';
import { ACTIVITY_TYPE, RETURN_NOTE_STATUS, ReturnNote } from '@/types';
import { cn } from '@/lib/utils';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface ReturnNoteDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    returnNote: ReturnNote | null;
    detailPathPrefix?: string;
    scope?: 'selling' | 'buying';
    onPreview?: () => void;
    onDownload?: () => void;
    onDownloadWithAttachments?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onInvoice?: () => void;
    onEmail?: () => void;
    onWhatsApp?: () => void;
    onAttachment?: () => void;
    onLinkedDocumentOpen?: (type: string, id: number) => void;
}
const getStatusBadgeClassName = (status?: RETURN_NOTE_STATUS) => {
    switch (status) {
        case RETURN_NOTE_STATUS.Accepted:
        case RETURN_NOTE_STATUS.Validated:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case RETURN_NOTE_STATUS.Created:
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
        case RETURN_NOTE_STATUS.Invoiced:
        case RETURN_NOTE_STATUS.Expired:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case RETURN_NOTE_STATUS.Rejected:
        case RETURN_NOTE_STATUS.Cancelled:
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
        case RETURN_NOTE_STATUS.Sent:
            return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
        case RETURN_NOTE_STATUS.Draft:
        default:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
export const ReturnNoteDetailsDialog: React.FC<ReturnNoteDetailsDialogProps> = ({ open, onClose, returnNote, detailPathPrefix = '/selling/return-note', scope = 'selling', onPreview, onDownload, onDownloadWithAttachments, onDuplicate, onDelete, onInvoice, onEmail, onWhatsApp, onAttachment, onLinkedDocumentOpen }) => {
  const router = useGuardedRouter();
    const { t: tCommon } = useTranslation('common');
    const { t: tInvoicing } = useTranslation('invoicing');
    const documentLabels = useScopedDocumentLabels('returnNote', scope);
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
    if (!returnNote) {
        return null;
    }
    const hasUploads = (returnNote.uploads?.length ?? 0) > 0;
    const linkedInvoice = returnNote.invoices?.[0];
    const isSelling = true;
    const partnerLabel = tInvoicing('returnNote.attributes.customer');
    const partnerName = returnNote.firm?.name || documentLabels.partnerFallback;
    return (<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent hideClose className="sm:max-w-[680px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {tInvoicing('returnNote.details.view_document')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {documentLabels.detailDescription}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu modal={false} open={isActionsOpen} onOpenChange={setIsActionsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 px-3 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  {tCommon('commands.actions')} <ChevronDown className="h-4 w-4 opacity-50"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="z-[70] w-64 p-1">
                {onPreview && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onPreview);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Eye className="h-4 w-4"/> Voir
                  </DropdownMenuItem>)}

                <DropdownMenuItem onSelect={(event) => {
            event.preventDefault();
            runMenuAction(() => {
                if (returnNote.id) {
                    router.push(`${detailPathPrefix}/${returnNote.id}`);
                }
            });
        }} className="gap-2 px-3 py-2 cursor-pointer">
                  <Edit className="h-4 w-4"/> {tCommon('commands.edit')}
                </DropdownMenuItem>

                {isSelling && !linkedInvoice && onInvoice && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onInvoice);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <FileText className="h-4 w-4"/> {tCommon('commands.transform_to')}{' '}
                    {invoiceLabels.singular}
                  </DropdownMenuItem>)}

                {isSelling && linkedInvoice?.id && onLinkedDocumentOpen && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(() => onLinkedDocumentOpen('invoice', linkedInvoice.id!));
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-amber-500"/>{' '}
                    {tInvoicing('returnNote.view_created_invoice')}
                  </DropdownMenuItem>)}

                {onDownload && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDownload);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Download className="h-4 w-4"/> {tInvoicing('returnNote.details.download_pdf')}
                  </DropdownMenuItem>)}

                {onEmail && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onEmail);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Mail className="h-4 w-4"/> {tInvoicing('returnNote.details.send_email')}
                  </DropdownMenuItem>)}

                {onWhatsApp && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onWhatsApp);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <MessageCircle className="h-4 w-4 text-green-500"/>{' '}
                    {tInvoicing('returnNote.details.send_whatsapp')}
                  </DropdownMenuItem>)}

                {onAttachment && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onAttachment);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Paperclip className="h-4 w-4"/>{' '}
                    {tInvoicing('returnNote.details.manage_attachments')}
                  </DropdownMenuItem>)}

                {onDuplicate && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDuplicate);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Copy className="h-4 w-4"/> {tCommon('commands.duplicate')}
                  </DropdownMenuItem>)}

                {hasUploads && onDownloadWithAttachments && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDownloadWithAttachments);
            }} className="gap-2 px-3 py-2 cursor-pointer">
                    <Paperclip className="h-4 w-4"/>{' '}
                    {tInvoicing('returnNote.details.download_with_attachments')}
                  </DropdownMenuItem>)}

                {onDelete && (<DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                runMenuAction(onDelete);
            }} className="gap-2 px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50">
                    <Trash2 className="h-4 w-4"/> {tCommon('commands.delete')}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={onClose}>
              {tCommon('commands.close')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {documentLabels.document}
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {documentLabels.displayNumber(returnNote)}
              </span>
              <Badge className={cn('px-2.5 py-0.5 text-xs font-semibold', getStatusBadgeClassName(returnNote.status))}>
                {returnNote.status ? tInvoicing(returnNote.status) : '-'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {returnNote.date
            ? format(parseISO(returnNote.date), 'dd MMMM, yyyy HH:mm', { locale })
            : '-'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                {tInvoicing('returnNote.details.created_by')}:{' '}
                <span className="text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                  Tarek Mzoughi
                </span>
              </p>
            </div>

            <div className="pt-2">
              <button type="button" onClick={() => returnNote.firmId && router.push(`/contacts/firm/${returnNote.firmId}`)} className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors text-left">
                {partnerName}
              </button>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{partnerLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900" onClick={onDownload} disabled={!onDownload}>
              <Download className="h-4 w-4 text-zinc-500"/>{' '}
              {tInvoicing('returnNote.details.download_document')}
            </Button>
            <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900" onClick={() => toast.info('Graphique bientôt disponible...')}>
              <LayoutDashboard className="h-4 w-4 text-zinc-500"/> Voir le Graphique
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900" onClick={() => toast.info('Stock bientôt disponible...')}>
              <Package className="h-4 w-4 text-zinc-500"/> Voir l&apos;effet sur le stock
            </Button>
          </div>

          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {tInvoicing('returnNote.details.linked_documents')}
              </h3>
            </div>

            <div className="rounded-md border border-zinc-100 dark:border-zinc-900 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="px-4 py-3">{tInvoicing('returnNote.details.document_type')}</th>
                    <th className="px-4 py-3">{tInvoicing('returnNote.details.reference')}</th>
                    <th className="px-4 py-3">{tInvoicing('returnNote.attributes.date')}</th>
                    <th className="px-4 py-3">{tInvoicing('returnNote.attributes.status')}</th>
                    <th className="px-4 py-3 text-right">{tCommon('commands.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {returnNote.invoices?.map((invoice) => (<tr key={`invoice-${invoice.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {invoiceLabels.singular}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoiceLabels.displayNumber(invoice)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.date
                ? format(parseISO(invoice.date), 'dd MMMM, yyyy HH:mm', { locale })
                : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.status ? tInvoicing(invoice.status) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold" onClick={() => invoice.id && onLinkedDocumentOpen?.('invoice', invoice.id)} disabled={!invoice.id || !onLinkedDocumentOpen}>
                          {tInvoicing('returnNote.details.view_linked_document')}
                        </Button>
                      </td>
                    </tr>))}

                  {!returnNote.invoices?.length && (<tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-600 italic">
                        {tInvoicing('returnNote.details.no_linked_documents')}
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
