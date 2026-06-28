import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Copy, Download, Edit, ExternalLink, Eye, FileText, LayoutDashboard, Mail, MessageCircle, Package, Paperclip, RefreshCw, Trash2 } from 'lucide-react';
import { DeliveryNote, DELIVERY_NOTE_STATUS, INVOICE_STATUS } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface DeliveryNoteDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    deliveryNote: DeliveryNote | null;
    detailPathPrefix?: string;
    scope?: 'selling' | 'buying';
    onPreview?: () => void;
    onDownload?: () => void;
    onDownloadWithAttachments?: () => void;
    onDuplicate?: () => void;
    onStatusChange?: () => void;
    onDelete?: () => void;
    onInvoice?: () => void;
    onReturnNote?: () => void;
    onEmail?: () => void;
    onWhatsApp?: () => void;
    onAttachment?: () => void;
    onLinkedDocumentPreview?: (type: string, id: number) => void;
}
const getStatusBadgeClassName = (status?: DELIVERY_NOTE_STATUS) => {
    switch (status) {
        case DELIVERY_NOTE_STATUS.Delivered:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case DELIVERY_NOTE_STATUS.Created:
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
        case DELIVERY_NOTE_STATUS.Cancelled:
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
        case DELIVERY_NOTE_STATUS.Draft:
        default:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
export const DeliveryNoteDetailsDialog: React.FC<DeliveryNoteDetailsDialogProps> = ({ open, onClose, deliveryNote, detailPathPrefix = '/selling/delivery-note', scope = 'selling', onPreview, onDownload, onDownloadWithAttachments, onDuplicate, onStatusChange, onDelete, onInvoice, onReturnNote, onEmail, onWhatsApp, onAttachment, onLinkedDocumentPreview }) => {
  const router = useGuardedRouter();
    const { t: tCommon } = useTranslation('common');
    const { t: tInvoicing } = useTranslation('invoicing');
    const documentLabels = useScopedDocumentLabels('deliveryNote', scope);
    const returnNoteLabels = useScopedDocumentLabels('returnNote', scope);
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    if (!deliveryNote) {
        return null;
    }
    const hasUploads = (deliveryNote.uploads?.length ?? 0) > 0;
    const linkedInvoices = deliveryNote.invoices || [];
    const invoicedInvoices = linkedInvoices.filter((invoice) => invoice.status !== INVOICE_STATUS.Draft);
    const visibleReturnNotes = deliveryNote.returnNotes || [];
    const isTransformed = linkedInvoices.length > 0 || visibleReturnNotes.length > 0;
    return (<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent hideClose className="sm:max-w-[680px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Voir le Document
          </SheetTitle>
          <SheetDescription className="sr-only">
            {documentLabels.detailDescription}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 px-3 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  Actions <ChevronDown className="h-4 w-4 opacity-50"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1">
                {onPreview && (<DropdownMenuItem onClick={onPreview} className="gap-2 px-3 py-2 cursor-pointer">
                    <Eye className="h-4 w-4"/> {tCommon('commands.view')}
                  </DropdownMenuItem>)}
                <DropdownMenuItem onClick={() => router.push(`${detailPathPrefix}/${deliveryNote.id}`)} className="gap-2 px-3 py-2 cursor-pointer">
                  <ExternalLink className="h-4 w-4"/> {tCommon('commands.details')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`${detailPathPrefix}/${deliveryNote.id}`)} className="gap-2 px-3 py-2 cursor-pointer">
                  <Edit className="h-4 w-4"/> {tCommon('commands.edit')}
                </DropdownMenuItem>

                {!isTransformed && (<>
                    {onInvoice && (<DropdownMenuItem onClick={onInvoice} className="gap-2 px-3 py-2 cursor-pointer">
                        <FileText className="h-4 w-4"/>{' '}
                        {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
                      </DropdownMenuItem>)}
                    {onReturnNote && (<DropdownMenuItem onClick={onReturnNote} className="gap-2 px-3 py-2 cursor-pointer">
                        <FileText className="h-4 w-4"/>
                        {`${tCommon('commands.transform_to')} ${returnNoteLabels.singular}`}
                      </DropdownMenuItem>)}
                  </>)}

                {linkedInvoices.map((invoice) => (<DropdownMenuItem key={`invoice-${invoice.id}`} onClick={() => invoice.id && onLinkedDocumentPreview?.('invoice', invoice.id)} className="gap-2 px-3 py-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-amber-500"/>
                    {tInvoicing('deliveryNote.view_created_invoice')}
                  </DropdownMenuItem>))}

                {visibleReturnNotes.map((returnNote) => (<DropdownMenuItem key={`return-note-${returnNote.id}`} onClick={() => returnNote.id && onLinkedDocumentPreview?.('return-note', returnNote.id)} className="gap-2 px-3 py-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-blue-500"/>
                    {tInvoicing('deliveryNote.view_created_return_note')}
                  </DropdownMenuItem>))}

                {onDownload && (<DropdownMenuItem onClick={onDownload} className="gap-2 px-3 py-2 cursor-pointer">
                    <Download className="h-4 w-4"/> Télécharger PDF
                  </DropdownMenuItem>)}
                {onEmail && (<DropdownMenuItem onClick={onEmail} className="gap-2 px-3 py-2 cursor-pointer">
                    <Mail className="h-4 w-4"/> Envoyer par email
                  </DropdownMenuItem>)}
                {onWhatsApp && (<DropdownMenuItem onClick={onWhatsApp} className="gap-2 px-3 py-2 cursor-pointer">
                    <MessageCircle className="h-4 w-4 text-green-500"/> Envoyer par WhatsApp
                  </DropdownMenuItem>)}
                {onStatusChange && (<DropdownMenuItem onClick={onStatusChange} className="gap-2 px-3 py-2 cursor-pointer">
                    <RefreshCw className="h-4 w-4"/> Changer le statut
                  </DropdownMenuItem>)}
                {onDuplicate && (<DropdownMenuItem onClick={onDuplicate} className="gap-2 px-3 py-2 cursor-pointer">
                    <Copy className="h-4 w-4"/> {tCommon('commands.duplicate')}
                  </DropdownMenuItem>)}
                {onAttachment && (<DropdownMenuItem onClick={onAttachment} className="gap-2 px-3 py-2 cursor-pointer">
                    <Paperclip className="h-4 w-4"/> Gérer les pièces jointes
                  </DropdownMenuItem>)}
                {hasUploads && onDownloadWithAttachments && (<DropdownMenuItem onClick={onDownloadWithAttachments} className="gap-2 px-3 py-2 cursor-pointer">
                    <Paperclip className="h-4 w-4"/> Télécharger avec pièces jointes
                  </DropdownMenuItem>)}
                {onDelete && (<DropdownMenuItem onClick={onDelete} className="gap-2 px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50">
                    <Trash2 className="h-4 w-4"/> {tCommon('commands.delete')}
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={onClose}>
              Fermer
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
                {documentLabels.displayNumber(deliveryNote)}
              </span>
              <Badge className={cn('px-2.5 py-0.5 text-xs font-semibold', getStatusBadgeClassName(deliveryNote.status))}>
                {deliveryNote.status ? tInvoicing(deliveryNote.status) : '-'}
              </Badge>

              {invoicedInvoices.length > 0 && (<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  {tInvoicing('deliveryNote.status.invoiced')}
                </Badge>)}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {deliveryNote.date
            ? format(parseISO(deliveryNote.date), 'dd MMMM, yyyy HH:mm', { locale: fr })
            : '-'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                Créé par:{' '}
                <span className="text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                  Tarek Mzoughi
                </span>
              </p>
            </div>

            <div className="pt-2">
              <button type="button" onClick={() => deliveryNote.firmId && router.push(`/contacts/firm/${deliveryNote.firmId}`)} className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors text-left">
                {deliveryNote.firm?.name || documentLabels.partnerFallback}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900" onClick={onDownload} disabled={!onDownload}>
              <Download className="h-4 w-4 text-zinc-500"/> Télécharger le Document
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
                Documents Liés
              </h3>
            </div>

            <div className="rounded-md border border-zinc-100 dark:border-zinc-900 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="px-4 py-3">{tCommon('table.document_type')}</th>
                    <th className="px-4 py-3">{tCommon('table.reference')}</th>
                    <th className="px-4 py-3">{tCommon('table.date')}</th>
                    <th className="px-4 py-3">{tCommon('table.status')}</th>
                    <th className="px-4 py-3 text-right">{tCommon('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {linkedInvoices.map((invoice) => (<tr key={`invoice-${invoice.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {invoiceLabels.singular}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoiceLabels.displayNumber(invoice)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.date
                ? format(parseISO(invoice.date), 'dd MMMM, yyyy HH:mm', { locale: fr })
                : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.status ? tInvoicing(invoice.status) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold" onClick={() => invoice.id && onLinkedDocumentPreview?.('invoice', invoice.id)} disabled={!onLinkedDocumentPreview}>
                          Voir le Document
                        </Button>
                      </td>
                    </tr>))}

                  {visibleReturnNotes.map((returnNote) => (<tr key={`return-note-${returnNote.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {returnNoteLabels.singular}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {returnNoteLabels.displayNumber(returnNote)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {returnNote.date
                ? format(parseISO(returnNote.date), 'dd MMMM, yyyy HH:mm', {
                    locale: fr
                })
                : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {returnNote.status ? tInvoicing(returnNote.status) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold" onClick={() => returnNote.id && onLinkedDocumentPreview?.('return-note', returnNote.id)} disabled={!onLinkedDocumentPreview}>
                          Voir le Document
                        </Button>
                      </td>
                    </tr>))}

                  {!linkedInvoices.length && !visibleReturnNotes.length && (<tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-600 italic">
                        Aucun document lié trouvé
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
