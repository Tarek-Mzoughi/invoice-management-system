import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  ExternalLink,
  Edit,
  FileText,
  ShoppingCart,
  Truck,
  Download,
  Mail,
  MessageCircle,
  RefreshCw,
  Copy,
  Paperclip,
  Trash2,
  LayoutDashboard,
  ChevronDown,
  Package
} from 'lucide-react';
import {
  CUSTOMER_ORDER_STATUS,
  CustomerOrder,
  DELIVERY_NOTE_STATUS,
  INVOICE_STATUS
} from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
const EFFECTIVE_DELIVERY_NOTE_STATUSES = new Set<string>([
  DELIVERY_NOTE_STATUS.Created,
  DELIVERY_NOTE_STATUS.Delivered,
  'deliveryNote.status.sent',
  'deliveryNote.status.validated',
  'created',
  'delivered',
  'sent',
  'validated'
]);
const hasEffectiveCustomerOrderDeliveryStatus = (status?: DELIVERY_NOTE_STATUS | string | null) => {
  return status ? EFFECTIVE_DELIVERY_NOTE_STATUSES.has(status) : false;
};
interface CustomerOrderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  customerOrder: CustomerOrder | null;
  detailPathPrefix?: string;
  scope?: 'selling' | 'buying';
  // Handlers for actions
  onPreview: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onStatusChange: () => void;
  onDelete: () => void;
  onInvoice: () => void;
  onCustomerOrder: () => void;
  onDeliveryNote: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onAttachment: () => void;
  onLinkedDocumentPreview: (type: string, id: number) => void;
}
export const CustomerOrderDetailsDialog: React.FC<CustomerOrderDetailsDialogProps> = ({
  open,
  onClose,
  customerOrder,
  detailPathPrefix,
  scope,
  onPreview,
  onDownload,
  onDuplicate,
  onStatusChange,
  onDelete,
  onInvoice,
  onCustomerOrder,
  onDeliveryNote,
  onEmail,
  onWhatsApp,
  onAttachment,
  onLinkedDocumentPreview
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useGuardedRouter();
  const documentLabels = useScopedDocumentLabels('customerOrder', scope);
  const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
  const invoiceLabels = useSellingInvoiceLabels({ enabled: false, scope });
  if (!customerOrder) return null;
  const hasEffectiveInvoice = customerOrder.invoices?.some(
    (invoice) => invoice.status !== INVOICE_STATUS.Draft
  );
  const hasEffectiveDelivery = customerOrder.deliveryNotes?.some((deliveryNote) =>
    hasEffectiveCustomerOrderDeliveryStatus(deliveryNote.status)
  );
  const isEffectivelyValidated =
    customerOrder.status === CUSTOMER_ORDER_STATUS.Validated ||
    hasEffectiveInvoice ||
    hasEffectiveDelivery;
  const displayStatus = isEffectivelyValidated
    ? CUSTOMER_ORDER_STATUS.Validated
    : customerOrder.status;
  const getStatusBadgeVariant = (status?: CUSTOMER_ORDER_STATUS) => {
    switch (status) {
      case CUSTOMER_ORDER_STATUS.Validated:
        return 'success';
      case CUSTOMER_ORDER_STATUS.Cancelled:
        return 'destructive';
      case CUSTOMER_ORDER_STATUS.Draft:
        return 'secondary';
      case CUSTOMER_ORDER_STATUS.Created:
        return 'default';
      default:
        return 'outline';
    }
  };
  const getStatusBadgeClassName = (status?: CUSTOMER_ORDER_STATUS) => {
    switch (status) {
      case CUSTOMER_ORDER_STATUS.Validated:
        return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case CUSTOMER_ORDER_STATUS.Created:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case CUSTOMER_ORDER_STATUS.Draft:
        return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case CUSTOMER_ORDER_STATUS.Cancelled:
        return 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default:
        return '';
    }
  };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        hideClose
        className="sm:max-w-[680px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Voir le Document
          </SheetTitle>
          <SheetDescription className="sr-only">
            {documentLabels.detailDescription}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-9 gap-2 px-3 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                )}
              >
                Actions <ChevronDown className="h-4 w-4 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1">
                <DropdownMenuItem onClick={onPreview} className="gap-2 px-3 py-2 cursor-pointer">
                  <Eye className="h-4 w-4" /> {tCommon('commands.view')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`${detailPathPrefix}/${customerOrder.id}`)}
                  className="gap-2 px-3 py-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" /> {tCommon('commands.details')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`${detailPathPrefix}/${customerOrder.id}`)}
                  className="gap-2 px-3 py-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4" /> {tCommon('commands.edit')}
                </DropdownMenuItem>

                {/* Simplified Transformation Logic */}
                {(customerOrder.invoices?.length || 0) +
                  (customerOrder.deliveryNotes?.length || 0) ===
                0 ? (
                  <>
                    <DropdownMenuItem
                      onClick={onInvoice}
                      className="gap-2 px-3 py-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />{' '}
                      {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={onDeliveryNote}
                      className="gap-2 px-3 py-2 cursor-pointer"
                    >
                      <Truck className="h-4 w-4" />{' '}
                      {`${tCommon('commands.transform_to')} ${deliveryNoteLabels.singular}`}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {customerOrder.invoices && customerOrder.invoices.length > 0 && (
                      <DropdownMenuItem
                        onClick={() =>
                          onLinkedDocumentPreview('invoice', customerOrder.invoices![0].id!)
                        }
                        className="gap-2 px-3 py-2 cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-amber-500" />{' '}
                        {`Voir la ${invoiceLabels.singular} créée`}
                      </DropdownMenuItem>
                    )}
                    {false}
                    {customerOrder.deliveryNotes && customerOrder.deliveryNotes.length > 0 && (
                      <DropdownMenuItem
                        onClick={() =>
                          onLinkedDocumentPreview(
                            'delivery-note',
                            customerOrder.deliveryNotes![0].id!
                          )
                        }
                        className="gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Truck className="h-4 w-4 text-blue-500" />{' '}
                        {`Voir le ${deliveryNoteLabels.singular} créé`}
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                <DropdownMenuItem onClick={onDownload} className="gap-2 px-3 py-2 cursor-pointer">
                  <Download className="h-4 w-4" /> Télécharger PDF
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onEmail} className="gap-2 px-3 py-2 cursor-pointer">
                  <Mail className="h-4 w-4" /> Envoyer par email
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onWhatsApp} className="gap-2 px-3 py-2 cursor-pointer">
                  <MessageCircle className="h-4 w-4 text-green-500" /> Envoyer par WhatsApp
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onStatusChange}
                  className="gap-2 px-3 py-2 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" /> Changer le statut
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onDuplicate} className="gap-2 px-3 py-2 cursor-pointer">
                  <Copy className="h-4 w-4" /> {tCommon('commands.duplicate')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onAttachment} className="gap-2 px-3 py-2 cursor-pointer">
                  <Paperclip className="h-4 w-4" /> Gérer les pièces jointes
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                >
                  <Trash2 className="h-4 w-4" /> {tCommon('commands.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Fermer
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          {/* Document Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {documentLabels.document}
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {documentLabels.displayNumber(customerOrder)}
              </span>
              <Badge
                variant={getStatusBadgeVariant(displayStatus) as any}
                className={cn(
                  'px-2.5 py-0.5 text-xs font-semibold',
                  getStatusBadgeClassName(displayStatus)
                )}
              >
                {displayStatus ? tInvoicing(displayStatus) : '-'}
              </Badge>

              {hasEffectiveInvoice && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  {tInvoicing('customerOrder.status.invoiced')}
                </Badge>
              )}
              {hasEffectiveDelivery && (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                  {tInvoicing('customerOrder.status.delivered')}
                </Badge>
              )}
              {false}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {customerOrder.date
                  ? format(parseISO(customerOrder.date), 'dd MMMM, yyyy HH:mm', { locale: fr })
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
              <button
                onClick={() =>
                  customerOrder.firmId && router.push(`/contacts/firm/${customerOrder.firmId}`)
                }
                className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors text-left"
              >
                {customerOrder.firm?.name || documentLabels.partnerFallback}
              </button>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={onDownload}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <Download className="h-4 w-4 text-zinc-500" /> Télécharger le Document
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Graphique bientôt disponible...')}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-500" /> Voir le Graphique
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => toast.info('Stock bientôt disponible...')}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <Package className="h-4 w-4 text-zinc-500" /> Voir l&apos;effet sur le stock
            </Button>
          </div>

          {/* Linked Documents Table */}
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
                  {/* Invoices */}
                  {customerOrder.invoices?.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold"
                          onClick={() => onLinkedDocumentPreview('invoice', invoice.id!)}
                        >
                          Voir le Document
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {/* Delivery Notes */}
                  {customerOrder.deliveryNotes?.map((dn) => (
                    <tr
                      key={dn.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {deliveryNoteLabels.singular}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {deliveryNoteLabels.displayNumber(dn)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {dn.date
                          ? format(parseISO(dn.date), 'dd MMMM, yyyy HH:mm', { locale: fr })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {dn.status ? tInvoicing(dn.status) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold"
                          onClick={() => onLinkedDocumentPreview('delivery-note', dn.id!)}
                        >
                          Voir le Document
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {/* Customer Orders */}
                  {false}

                  {!customerOrder.invoices?.length &&
                    !customerOrder.deliveryNotes?.length &&
                    true && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-600 italic"
                        >
                          Aucun document lié trouvé
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
