import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronDown,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Package,
  Paperclip,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ACTIVITY_TYPE, GOODS_ISSUE_NOTE_STATUS, GoodsIssueNote } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface GoodsIssueNoteDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  goodsIssueNote: GoodsIssueNote | null;
  detailPathPrefix?: string;
  onPreview?: () => void;
  onDownload?: () => void;
  onDownloadWithAttachments?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: () => void;
  onDelete?: () => void;
  onEmail?: () => void;
  onWhatsApp?: () => void;
  onAttachment?: () => void;
  onLinkedDocumentPreview?: (type: string, id: number) => void;
}
const getStatusBadgeClassName = (status?: GOODS_ISSUE_NOTE_STATUS) => {
  switch (status) {
    case GOODS_ISSUE_NOTE_STATUS.Issued:
      return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case GOODS_ISSUE_NOTE_STATUS.Created:
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case GOODS_ISSUE_NOTE_STATUS.Draft:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    case GOODS_ISSUE_NOTE_STATUS.Cancelled:
      return 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
};
export const GoodsIssueNoteDetailsDialog: React.FC<GoodsIssueNoteDetailsDialogProps> = ({
  open,
  onClose,
  goodsIssueNote,
  detailPathPrefix = '/selling/goods-issue-note',
  onPreview,
  onDownload,
  onDownloadWithAttachments,
  onDuplicate,
  onStatusChange,
  onDelete,
  onEmail,
  onWhatsApp,
  onAttachment,
  onLinkedDocumentPreview
}) => {
  const router = useGuardedRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const locale = router.locale === 'fr' ? fr : enUS;
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const runMenuAction = React.useCallback((action?: () => void) => {
    if (!action) return;
    setIsActionsOpen(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        action();
      });
      return;
    }
    action();
  }, []);
  if (!goodsIssueNote) {
    return null;
  }
  const hasUploads = (goodsIssueNote.uploads?.length ?? 0) > 0;
  const partnerName =
    goodsIssueNote.firm?.name ||
    tInvoicing('goodsIssueNote.details.walk_in_customer', {
      defaultValue: 'Client passager'
    });
  const linkedInvoices = goodsIssueNote.invoices || [];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        hideClose
        className="sm:max-w-[680px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {tInvoicing('goodsIssueNote.details.view_document', {
              defaultValue: 'Voir le document'
            })}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {tInvoicing('goodsIssueNote.details.description', {
              defaultValue: 'Détails du bon de sortie'
            })}
          </SheetDescription>
          <div className="flex items-center gap-2">
            <DropdownMenu modal={false} open={isActionsOpen} onOpenChange={setIsActionsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 px-3 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon('commands.actions', { defaultValue: 'Actions' })}{' '}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="z-[70] w-64 p-1">
                {onPreview && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onPreview);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    {tCommon('commands.view')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    runMenuAction(() => {
                      if (goodsIssueNote.id) {
                        router.push(`${detailPathPrefix}/${goodsIssueNote.id}`);
                      }
                    });
                  }}
                  className="gap-2 px-3 py-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {tCommon('commands.details')}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    runMenuAction(() => {
                      if (goodsIssueNote.id) {
                        router.push(`${detailPathPrefix}/${goodsIssueNote.id}`);
                      }
                    });
                  }}
                  className="gap-2 px-3 py-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  {tCommon('commands.edit')}
                </DropdownMenuItem>

                {onDownload && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onDownload);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.download_pdf', {
                      defaultValue: 'Télécharger PDF'
                    })}
                  </DropdownMenuItem>
                )}

                {hasUploads && onDownloadWithAttachments && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onDownloadWithAttachments);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.download_with_attachments', {
                      defaultValue: 'Télécharger avec pièces jointes'
                    })}
                  </DropdownMenuItem>
                )}

                {onEmail && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onEmail);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.send_email', {
                      defaultValue: 'Envoyer par email'
                    })}
                  </DropdownMenuItem>
                )}

                {onWhatsApp && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onWhatsApp);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    {tInvoicing('goodsIssueNote.details.send_whatsapp', {
                      defaultValue: 'Envoyer par WhatsApp'
                    })}
                  </DropdownMenuItem>
                )}

                {onStatusChange && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onStatusChange);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.change_status', {
                      defaultValue: 'Changer le statut'
                    })}
                  </DropdownMenuItem>
                )}

                {onDuplicate && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onDuplicate);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    {tCommon('commands.duplicate')}
                  </DropdownMenuItem>
                )}

                {onAttachment && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onAttachment);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.manage_attachments', {
                      defaultValue: 'Gérer les pièces jointes'
                    })}
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      runMenuAction(onDelete);
                    }}
                    className="gap-2 px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {tCommon('commands.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={onClose}
            >
              {tCommon('commands.close')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {tInvoicing('goodsIssueNote.document', { defaultValue: 'BON DE SORTIE' })}
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {goodsIssueNote.sequential || '-'}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'px-2.5 py-0.5 text-xs font-semibold',
                  getStatusBadgeClassName(goodsIssueNote.status)
                )}
              >
                {goodsIssueNote.status ? tInvoicing(goodsIssueNote.status) : '-'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {goodsIssueNote.date
                  ? format(parseISO(goodsIssueNote.date), 'dd MMMM, yyyy HH:mm', { locale })
                  : '-'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                {goodsIssueNote.object ||
                  tInvoicing('goodsIssueNote.singular', { defaultValue: 'Bon de sortie' })}
              </p>
            </div>

            <div className="pt-2">
              {goodsIssueNote.firmId ? (
                <button
                  type="button"
                  onClick={() =>
                    goodsIssueNote.firmId &&
                    router.push(`/selling/contacts/firms/${goodsIssueNote.firmId}`)
                  }
                  className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors text-left"
                >
                  {partnerName}
                </button>
              ) : (
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{partnerName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={onDownload}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <Download className="h-4 w-4 text-zinc-500" />
              {tInvoicing('goodsIssueNote.details.download_document', {
                defaultValue: 'Télécharger le Document'
              })}
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Graphique bientôt disponible...')}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-500" />
              Voir le Graphique
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => toast.info('Stock bientôt disponible...')}
              className="gap-2 h-10 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 shadow-sm dark:hover:bg-zinc-900"
            >
              <Package className="h-4 w-4 text-zinc-500" />
              Voir l&apos;effet sur le stock
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
                    <th className="px-4 py-3 text-right">{tCommon('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {linkedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {tInvoicing('invoice.singular')}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.sequential}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {invoice.date
                          ? format(parseISO(invoice.date), 'dd MMMM, yyyy HH:mm', { locale })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold"
                          onClick={() =>
                            invoice.id && onLinkedDocumentPreview?.('invoice', invoice.id)
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Voir le Document
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {linkedInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
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
