import React from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Eye,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  User2,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { DELIVERY_NOTE_STATUS, DeliveryNote, INVOICE_STATUS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import { DeliveryNoteDeleteDialog } from './dialogs/DeliveryNoteDeleteDialog';
import { DeliveryNoteDuplicateDialog } from './dialogs/DeliveryNoteDuplicateDialog';
import { DeliveryNoteDownloadDialog } from './dialogs/DeliveryNoteDownloadDialog';
import { DeliveryNoteInvoiceDialog } from './dialogs/DeliveryNoteInvoiceDialog';
import { DeliveryNoteActionDialog } from './dialogs/DeliveryNoteActionDialog';
import { DeliveryNoteStatusDialog } from './dialogs/DeliveryNoteStatusDialog';
import { DeliveryNoteDetailsDialog } from './dialogs/DeliveryNoteDetailsDialog';
import { DeliveryNoteEmailDialog } from './dialogs/DeliveryNoteEmailDialog';
import { DeliveryNoteWhatsAppDialog } from './dialogs/DeliveryNoteWhatsAppDialog';
import { DeliveryNoteAttachmentDialog } from './dialogs/DeliveryNoteAttachmentDialog';
import { DeliveryNoteBulkDeleteDialog } from './dialogs/DeliveryNoteBulkDeleteDialog';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { useDeliveryNoteManager } from './hooks/useDeliveryNoteManager';
import {
  useDocumentPortal,
  FilterDateField,
  panelClassName,
  fieldClassName,
  labelClassName,
  mutedTextClassName
} from '@/features/invoicing/shared/portal';
interface DeliveryNoteMainProps {
  className?: string;
  listPath?: string;
  newPath?: string;
  rootPath?: string;
  scope?: 'selling' | 'buying';
  detailPathPrefix?: string;
  linkedInvoicePathPrefix?: string;
  linkedReturnNotePathPrefix?: string;
}
const DELIVERY_NOTE_STATUS_OPTIONS: DELIVERY_NOTE_STATUS[] = [
  DELIVERY_NOTE_STATUS.Draft,
  DELIVERY_NOTE_STATUS.Created,
  DELIVERY_NOTE_STATUS.Delivered,
  DELIVERY_NOTE_STATUS.Cancelled
];
const getStatusBadgeClassName = (status?: DELIVERY_NOTE_STATUS) => {
  switch (status) {
    case DELIVERY_NOTE_STATUS.Draft:
      return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    case DELIVERY_NOTE_STATUS.Created:
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
    case DELIVERY_NOTE_STATUS.Delivered:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case DELIVERY_NOTE_STATUS.Cancelled:
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
    default:
      return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
  }
};
const formatDeliveryNoteAmount = (deliveryNote: DeliveryNote, localeCode: string) => {
  const digits = deliveryNote.currency?.digitAfterComma ?? 2;
  const amount = Number(deliveryNote.total ?? 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${amount} ${deliveryNote.currency?.symbol || ''}`.trim();
};
export const DeliveryNotePortal: React.FC<DeliveryNoteMainProps> = ({
  className,
  scope = 'buying',
  rootPath = '/buying',
  listPath = '/buying/bons-reception',
  newPath = '/buying/nouveau-bon-reception',
  detailPathPrefix = '/buying/bon-reception',
  linkedInvoicePathPrefix = '/buying/facture-achat',
  linkedReturnNotePathPrefix = '/buying/retour-fournisseur'
}) => {
  const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
  const returnNoteLabels = useScopedDocumentLabels('returnNote', scope);
  const invoiceLabels = useSellingInvoiceLabels({ enabled: false, scope });
  const portal = useDocumentPortal<DeliveryNote>({
    entityKey: 'deliveryNotes',
    translationKey: 'deliveryNote',
    apiModule: api.deliveryNote,
    scope,
    rootPath,
    listPath,
    newPath,
    detailPathPrefix,
    defaultRelations: [
      'firm',
      'interlocutor',
      'currency',
      'uploads',
      'invoices',
      'returnNotes',
      'customerOrder'
    ]
  });
  const {
    router,
    tCommon,
    tInvoicing,
    dateLocale,
    numberLocale,
    activityType,
    partnerLabel,
    partnerPlaceholder,
    allPartnersLabel,
    setIntro,
    clearIntro,
    setRoutes,
    clearRoutes,
    setFloating,
    clearFloating,
    page,
    setPage,
    size,
    setSize,
    totalPageCount,
    totalResultCount,
    searchTerm,
    filters,
    isAdvancedFiltersOpen,
    setIsAdvancedFiltersOpen,
    hasActiveFilters,
    handleFilterChange,
    handleSearchChange,
    handleResetFilters,
    selectedIds,
    setSelectedIds,
    pageIds,
    isAllPageSelected,
    isPartiallySelected,
    items: deliveryNotes,
    firms,
    error,
    refetchList: refetchDeliveryNotes,
    deleteDialog,
    setDeleteDialog,
    duplicateDialog,
    setDuplicateDialog,
    downloadDialog,
    setDownloadDialog,
    removeItem: removeDeliveryNote,
    duplicateItem: duplicateDeliveryNote,
    downloadItem: downloadDeliveryNote,
    isPending: basePending,
    isDeletePending,
    isDuplicationPending,
    isDownloadPending
  } = portal;
  const deliveryNoteManager = useDeliveryNoteManager();
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);
  const [returnNoteDialog, setReturnNoteDialog] = React.useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [statusDialog, setStatusDialog] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [detailsDialog, setDetailsDialog] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState(false);
  const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
  const [attachmentDialog, setAttachmentDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = React.useState('document-preview.pdf');
  const [selectedDeliveryNote, setSelectedDeliveryNote] = React.useState<DeliveryNote | null>(null);
  const handleBulkDownload = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    toast.info(tInvoicing('deliveryNote.bulk_download_start', { count: selectedIds.length }));
    try {
      for (const id of selectedIds) {
        await api.deliveryNote.download(id, 'template1');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success(tInvoicing('deliveryNote.bulk_download_success'));
    } catch (error) {
      toast.error(tInvoicing('deliveryNote.bulk_download_failure'));
    }
  }, [selectedIds, tInvoicing]);
  React.useEffect(() => {
    setIntro?.(deliveryNoteLabels.plural, deliveryNoteLabels.cardDescription);
    setRoutes?.([
      { title: tCommon('menu.buying'), href: rootPath },
      { title: deliveryNoteLabels.plural, href: listPath }
    ]);
    setFloating?.(
      <div className="flex flex-row items-center gap-2">
        {selectedIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-sm px-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm"
              >
                {tCommon('commands.more_actions')}
                <ChevronDown className="ml-2 h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={handleBulkDownload}
                disabled={selectedIds.length === 0}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                {tCommon('commands.download_selection', { count: selectedIds.length })}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => bulkTransformToInvoice(selectedIds)}
                disabled={selectedIds.length === 0}
                className="cursor-pointer"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => bulkTransformToReturnNote(selectedIds)}
                disabled={selectedIds.length === 0}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                {`${tCommon('commands.transform_to')} ${returnNoteLabels.singular}`}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setBulkDeleteDialog(true)}
                disabled={selectedIds.length === 0}
                className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon('commands.delete_selection')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          className="h-11 rounded-md bg-amber-500 px-5 font-medium text-zinc-950 shadow-sm hover:bg-amber-400"
          onClick={() => router.push(newPath)}
        >
          <Plus className="h-4 w-4" />
          {deliveryNoteLabels.addButtonLabel}
        </Button>
      </div>
    );
    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [
    handleBulkDownload,
    listPath,
    deliveryNoteLabels.addButtonLabel,
    deliveryNoteLabels.cardDescription,
    deliveryNoteLabels.plural,
    invoiceLabels.singular,
    newPath,
    returnNoteLabels.singular,
    rootPath,
    scope,
    selectedIds,
    tCommon
  ]);
  const setManagedDeliveryNote = React.useCallback(
    (deliveryNote: DeliveryNote) => {
      if (!deliveryNote.id) return false;
      deliveryNoteManager.set('id', deliveryNote.id);
      deliveryNoteManager.set('sequential', deliveryNoteLabels.displayNumber(deliveryNote));
      deliveryNoteManager.set('status', deliveryNote.status || DELIVERY_NOTE_STATUS.Draft);
      return true;
    },
    [deliveryNoteLabels, deliveryNoteManager]
  );
  const { mutate: invoiceDeliveryNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.deliveryNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('transformations.invoice.success'));
      refetchDeliveryNotes();
      router.push(`${linkedInvoicePathPrefix}/${data.invoices[data.invoices.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('transformations.invoice.failure')
      );
      toast.error(message);
    }
  });
  const { mutate: toReturnNote, isPending: isReturnNotePending } = useMutation({
    mutationFn: (id: number) => api.returnNote.saveFromDeliveryNote(id),
    onSuccess: (data) => {
      toast.success(tInvoicing('transformations.returnNote.success'));
      router.push(`${linkedReturnNotePathPrefix}/${data.id}`);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('transformations.returnNote.failure'))
      );
    }
  });
  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
    setPreviewFilename('document-preview.pdf');
  };
  const blurActiveElement = React.useCallback(() => {
    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }
  }, []);
  const runAfterOverlayClose = React.useCallback(
    (closeCurrent: () => void, callback: () => void) => {
      blurActiveElement();
      closeCurrent();
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(callback);
        });
        return;
      }
      callback();
    },
    [blurActiveElement]
  );
  const closeDeliveryNoteDetailsThen = React.useCallback(
    (callback: () => void) => runAfterOverlayClose(() => setDetailsDialog(false), callback),
    [runAfterOverlayClose]
  );
  const openPreviewDialog = React.useCallback((filename: string) => {
    setPreviewFilename(filename);
    setPreviewBlob(null);
    setPreviewDialog(true);
  }, []);
  const { mutate: loadDeliveryNotePreview, isPending: isDeliveryNotePreviewPending } = useMutation({
    mutationFn: (id: number) => api.deliveryNote.preview(id, 'template1'),
    onSuccess: (blob) => {
      setPreviewDialog(true);
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_preview_failure'))
      );
      closePreviewDialog();
    }
  });
  const { mutate: loadInvoicePreview, isPending: isInvoicePreviewPending } = useMutation({
    mutationFn: (id: number) => api.invoice.preview(id, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
      setPreviewDialog(true);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_preview_failure'))
      );
      closePreviewDialog();
    }
  });
  const { mutate: loadReturnNotePreview, isPending: isReturnNotePreviewPending } = useMutation({
    mutationFn: (id: number) => api.returnNote.preview(id, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
      setPreviewDialog(true);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_preview_failure'))
      );
      closePreviewDialog();
    }
  });
  const openDeliveryNotePreview = React.useCallback(
    (deliveryNote: DeliveryNote) => {
      if (!deliveryNote.id) return;
      setSelectedDeliveryNote(deliveryNote);
      openPreviewDialog(
        `${deliveryNoteLabels.displayNumber(deliveryNote) || `delivery-note-${deliveryNote.id}`}.pdf`
      );
      loadDeliveryNotePreview(deliveryNote.id);
    },
    [deliveryNoteLabels, loadDeliveryNotePreview, openPreviewDialog]
  );
  const openLinkedDocumentPreview = React.useCallback(
    (type: string, id: number) => {
      if (type === 'invoice') {
        const invoice = selectedDeliveryNote?.invoices?.find((document) => document.id === id);
        openPreviewDialog(`${invoice?.sequential || `invoice-${id}`}.pdf`);
        loadInvoicePreview(id);
        return;
      }
      if (type === 'return-note') {
        const returnNote = selectedDeliveryNote?.returnNotes?.find(
          (document) => document.id === id
        );
        openPreviewDialog(`${returnNote?.sequential || `return-note-${id}`}.pdf`);
        loadReturnNotePreview(id);
      }
    },
    [loadInvoicePreview, loadReturnNotePreview, openPreviewDialog, selectedDeliveryNote]
  );
  const handleDownloadWithAttachments = React.useCallback(
    async (deliveryNote: DeliveryNote) => {
      try {
        if (!deliveryNote.id) return;
        const fullDeliveryNote = await api.deliveryNote.findOne(deliveryNote.id);
        await downloadDeliveryNote({ id: deliveryNote.id, template: 'template1' });
        if (fullDeliveryNote.uploads?.length) {
          for (const upload of fullDeliveryNote.uploads) {
            if (upload.upload?.slug) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              await api.upload.downloadFile(upload.upload.slug, upload.upload.filename);
            }
          }
        }
        toast.success(tInvoicing('deliveryNote.action_download_success'));
      } catch (error) {
        toast.error(
          getErrorMessage(
            'invoicing',
            error as Error,
            tInvoicing('deliveryNote.action_download_failure')
          )
        );
      }
    },
    [downloadDeliveryNote, tInvoicing]
  );
  const { mutate: updateStatus, isPending: isUpdateStatusPending } = useMutation({
    mutationFn: (data: { id: number; status: DELIVERY_NOTE_STATUS }) =>
      api.deliveryNote.updateStatus(data.id, data.status),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_update_success'));
      setStatusDialog(false);
      refetchDeliveryNotes();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_update_failure'))
      );
    }
  });
  // --- Bulk Actions ---
  const { mutate: bulkTransformToInvoice, isPending: isBulkInvoicePending } = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await api.deliveryNote.invoice(id, true);
      }
    },
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_invoice_success'));
      refetchDeliveryNotes();
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_invoice_failure'))
      );
    }
  });
  const { mutate: bulkTransformToReturnNote, isPending: isBulkReturnNotePending } = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await api.returnNote.saveFromDeliveryNote(id);
      }
    },
    onSuccess: () => {
      toast.success(tInvoicing('transformations.returnNote.success'));
      refetchDeliveryNotes();
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('transformations.returnNote.failure'))
      );
    }
  });
  const handleBulkDelete = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    let successCount = 0;
    let failureCount = 0;
    try {
      for (const id of selectedIds) {
        try {
          await api.deliveryNote.remove(id);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }
      if (successCount > 0) {
        toast.success(tInvoicing('deliveryNote.bulk_remove_success', { count: successCount }));
        refetchDeliveryNotes();
        setSelectedIds([]);
      }
      if (failureCount > 0) {
        toast.error(tInvoicing('deliveryNote.bulk_remove_failure', { count: failureCount }));
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialog(false);
    }
  }, [refetchDeliveryNotes, selectedIds, setSelectedIds, tInvoicing]);
  const isPreviewPending =
    isDeliveryNotePreviewPending || isInvoicePreviewPending || isReturnNotePreviewPending;
  const isPending =
    basePending ||
    isInvoicingPending ||
    isReturnNotePending ||
    isUpdateStatusPending ||
    isBulkInvoicePending ||
    isBulkReturnNotePending;
  if (error) return 'An error has occurred: ' + error.message;
  return (
    <>
      <DeliveryNoteBulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteDialog}
        onDelete={handleBulkDelete}
        isPending={isBulkDeleting}
        onClose={() => setBulkDeleteDialog(false)}
      />
      <DeliveryNoteDeleteDialog
        id={deliveryNoteManager?.id}
        sequential={deliveryNoteManager?.sequential || ''}
        open={deleteDialog}
        deleteDeliveryNote={() => {
          deliveryNoteManager?.id && removeDeliveryNote(deliveryNoteManager?.id);
        }}
        isDeletionPending={isDeletePending}
        scope={scope}
        onClose={() => setDeleteDialog(false)}
      />
      <DeliveryNoteDuplicateDialog
        id={deliveryNoteManager?.id || 0}
        sequential={deliveryNoteManager?.sequential || ''}
        open={duplicateDialog}
        duplicateDeliveryNote={(includeFiles: boolean) => {
          deliveryNoteManager?.id &&
            duplicateDeliveryNote({
              id: deliveryNoteManager?.id,
              includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        scope={scope}
        onClose={() => setDuplicateDialog(false)}
      />
      <DeliveryNoteDownloadDialog
        id={deliveryNoteManager?.id || 0}
        open={downloadDialog}
        downloadDeliveryNote={(template: string) => {
          deliveryNoteManager?.id &&
            downloadDeliveryNote({ id: deliveryNoteManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <DeliveryNoteInvoiceDialog
        id={deliveryNoteManager?.id || 0}
        status={deliveryNoteManager?.status}
        sequential={deliveryNoteManager?.sequential}
        open={invoiceDialog}
        isInvoicePending={isInvoicingPending}
        invoice={(id: number, createInvoice: boolean) => {
          invoiceDeliveryNote({ id, createInvoice });
        }}
        scope={scope}
        onClose={() => setInvoiceDialog(false)}
      />
      <DeliveryNoteActionDialog
        id={deliveryNoteManager?.id}
        action={`${tCommon('commands.transform_to')} ${returnNoteLabels.singular}`}
        sequential={deliveryNoteManager?.sequential || ''}
        open={returnNoteDialog}
        callback={() => deliveryNoteManager?.id && toReturnNote(deliveryNoteManager.id)}
        isCallbackPending={isReturnNotePending}
        scope={scope}
        onClose={() => setReturnNoteDialog(false)}
      />
      <DeliveryNoteStatusDialog
        open={statusDialog}
        deliveryNote={selectedDeliveryNote}
        isPending={isUpdateStatusPending}
        scope={scope}
        callback={(status) => {
          if (selectedDeliveryNote?.id) {
            updateStatus({ id: selectedDeliveryNote.id, status });
          }
        }}
        onClose={() => setStatusDialog(false)}
      />
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={previewFilename}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <DeliveryNoteDetailsDialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        deliveryNote={selectedDeliveryNote}
        detailPathPrefix={detailPathPrefix}
        scope={scope}
        onPreview={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => openDeliveryNotePreview(selectedDeliveryNote));
        }}
        onDownload={() => {
          if (!selectedDeliveryNote || !setManagedDeliveryNote(selectedDeliveryNote)) return;
          closeDeliveryNoteDetailsThen(() => setDownloadDialog(true));
        }}
        onDownloadWithAttachments={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => handleDownloadWithAttachments(selectedDeliveryNote));
        }}
        onDuplicate={() => {
          if (!selectedDeliveryNote || !setManagedDeliveryNote(selectedDeliveryNote)) return;
          closeDeliveryNoteDetailsThen(() => setDuplicateDialog(true));
        }}
        onStatusChange={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => setStatusDialog(true));
        }}
        onDelete={() => {
          if (!selectedDeliveryNote || !setManagedDeliveryNote(selectedDeliveryNote)) return;
          closeDeliveryNoteDetailsThen(() => setDeleteDialog(true));
        }}
        onInvoice={() => {
          if (!selectedDeliveryNote || !setManagedDeliveryNote(selectedDeliveryNote)) return;
          closeDeliveryNoteDetailsThen(() => setInvoiceDialog(true));
        }}
        onReturnNote={() => {
          if (!selectedDeliveryNote || !setManagedDeliveryNote(selectedDeliveryNote)) return;
          closeDeliveryNoteDetailsThen(() => setReturnNoteDialog(true));
        }}
        onEmail={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => setEmailDialog(true));
        }}
        onWhatsApp={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => setWhatsAppDialog(true));
        }}
        onAttachment={() => {
          if (!selectedDeliveryNote) return;
          closeDeliveryNoteDetailsThen(() => setAttachmentDialog(true));
        }}
        onLinkedDocumentPreview={openLinkedDocumentPreview}
      />
      <DeliveryNoteEmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        deliveryNote={selectedDeliveryNote}
        scope={scope}
      />
      <DeliveryNoteWhatsAppDialog
        open={whatsAppDialog}
        onClose={() => setWhatsAppDialog(false)}
        deliveryNote={selectedDeliveryNote}
        scope={scope}
      />
      <DeliveryNoteAttachmentDialog
        open={attachmentDialog}
        onClose={() => setAttachmentDialog(false)}
        deliveryNote={selectedDeliveryNote}
        scope={scope}
      />

      <div className={cn('flex min-h-0 flex-1 flex-col gap-5 pb-5', className)}>
        <section className={cn(panelClassName, 'p-4')}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_180px_auto]">
            <div className="space-y-2">
              <p className={labelClassName}>{partnerLabel}</p>
              <Select
                value={filters.clientId}
                onValueChange={(value) => handleFilterChange('clientId', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={partnerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allPartnersLabel}</SelectItem>
                  {firms.map((firm) => (
                    <SelectItem key={firm.id} value={String(firm.id)}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FilterDateField
              label={tCommon('start_date')}
              locale={dateLocale}
              onChange={(value) => handleFilterChange('startDate', value)}
              placeholder={tCommon('filters.select_date')}
              value={filters.startDate}
            />

            <FilterDateField
              label={tCommon('end_date')}
              locale={dateLocale}
              onChange={(value) => handleFilterChange('endDate', value)}
              placeholder={tCommon('filters.select_date')}
              value={filters.endDate}
            />

            <div className="space-y-2">
              <p className={labelClassName}>{tInvoicing('deliveryNote.attributes.status')}</p>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {DELIVERY_NOTE_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {tInvoicing(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-end gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="h-10 rounded-sm px-4"
                  onClick={handleResetFilters}
                >
                  {tCommon('commands.reset')}
                </Button>
              )}
              <Button
                variant="outline"
                className="h-10 w-14 rounded-sm"
                onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
              >
                <Settings2 className="h-4 w-4" />
                {isAdvancedFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isAdvancedFiltersOpen && (
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.advanced_search')}</p>
                <div className="relative">
                  <Search
                    className={cn(
                      'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                      mutedTextClassName
                    )}
                  />
                  <Input
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder={tCommon('filters.search_documents')}
                    className={cn(fieldClassName, 'pl-10')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.min_amount')}</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minTotal}
                  onChange={(event) => handleFilterChange('minTotal', event.target.value)}
                  placeholder="0.00"
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.max_amount')}</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxTotal}
                  onChange={(event) => handleFilterChange('maxTotal', event.target.value)}
                  placeholder="0.00"
                  className={fieldClassName}
                />
              </div>
            </div>
          )}
        </section>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10">
            <div className="flex items-center gap-4 text-sm font-medium text-primary dark:text-primary-foreground">
              <p>{tCommon('table.items_selected', { count: selectedIds.length })}</p>
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => setSelectedIds(pageIds)}
              >
                {tCommon('table.select_all_search_results')}
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setSelectedIds([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <section className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col')}>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <th className="w-14 px-4 py-3.5">
                    <Checkbox
                      checked={isPartiallySelected ? 'indeterminate' : isAllPageSelected}
                      disabled={pageIds.length === 0}
                      className="border-zinc-400 dark:border-zinc-700"
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setSelectedIds(pageIds);
                          return;
                        }
                        setSelectedIds([]);
                      }}
                    />
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {deliveryNoteLabels.referenceFieldLabel}
                  </th>
                  <th className="px-4 py-3.5 font-medium">{partnerLabel}</th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('deliveryNote.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('deliveryNote.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && deliveryNotes.length > 0 ? (
                  deliveryNotes.map((deliveryNote) => {
                    const deliveryNoteId = deliveryNote.id || 0;
                    const isSelected = deliveryNoteId > 0 && selectedIds.includes(deliveryNoteId);
                    const linkedInvoices = deliveryNote.invoices || [];
                    const invoicedInvoices = linkedInvoices.filter(
                      (invoice) => invoice.status !== INVOICE_STATUS.Draft
                    );
                    const visibleReturnNotes = deliveryNote.returnNotes || [];
                    const isTransferred =
                      linkedInvoices.length > 0 || visibleReturnNotes.length > 0;
                    const hasUploads = (deliveryNote.uploads?.length ?? 0) > 0;
                    return (
                      <tr
                        key={deliveryNoteId || deliveryNote.sequential}
                        className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                      >
                        <td className="px-4 py-4 align-middle">
                          <Checkbox
                            checked={isSelected}
                            disabled={!deliveryNoteId}
                            className="border-zinc-400 dark:border-zinc-700"
                            onCheckedChange={(checked) => {
                              if (!deliveryNoteId) return;
                              setSelectedIds((current) => {
                                if (checked === true) {
                                  return current.includes(deliveryNoteId)
                                    ? current
                                    : [...current, deliveryNoteId];
                                }
                                return current.filter((id) => id !== deliveryNoteId);
                              });
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50 text-left"
                              onClick={() => router.push(`${detailPathPrefix}/${deliveryNote.id}`)}
                            >
                              {deliveryNoteLabels.displayNumber(deliveryNote)}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {deliveryNote.date
                                ? format(parseISO(deliveryNote.date), 'dd MMM yyyy - HH:mm', {
                                    locale: dateLocale
                                  })
                                : '-'}
                            </span>
                            {deliveryNote.dueDate && (
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('deliveryNote.attributes.due_date')}:{' '}
                                {format(parseISO(deliveryNote.dueDate), 'dd MMM yyyy - HH:mm', {
                                  locale: dateLocale
                                })}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <User2 className={cn('h-4 w-4 shrink-0', mutedTextClassName)} />
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {deliveryNote.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {deliveryNote.interlocutor
                                  ? `${deliveryNote.interlocutor.surname || ''} ${deliveryNote.interlocutor.name || ''}`.trim()
                                  : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                                getStatusBadgeClassName(deliveryNote.status)
                              )}
                            >
                              {deliveryNote.status ? tInvoicing(deliveryNote.status) : '-'}
                            </span>

                            {invoicedInvoices.length > 0 && (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                {tInvoicing('deliveryNote.status.invoiced', {
                                  defaultValue: 'Facturé'
                                })}
                              </span>
                            )}

                            {(deliveryNote.status === DELIVERY_NOTE_STATUS.Delivered ||
                              invoicedInvoices.length > 0) && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right align-middle font-medium text-zinc-950 dark:text-zinc-50">
                          {formatDeliveryNoteAmount(deliveryNote, numberLocale)}
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => openDeliveryNotePreview(deliveryNote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => router.push(`${detailPathPrefix}/${deliveryNote.id}`)}
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => {
                                setSelectedDeliveryNote(deliveryNote);
                                blurActiveElement();
                                setStatusDialog(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuItem
                                  onClick={() => openDeliveryNotePreview(deliveryNote)}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> {tCommon('commands.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDeliveryNote(deliveryNote);
                                    setDetailsDialog(true);
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" /> Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`${detailPathPrefix}/${deliveryNote.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" /> {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                <>
                                  {!isTransferred && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (!setManagedDeliveryNote(deliveryNote)) return;
                                        setInvoiceDialog(true);
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
                                    </DropdownMenuItem>
                                  )}
                                  {!isTransferred && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (!setManagedDeliveryNote(deliveryNote)) return;
                                        setReturnNoteDialog(true);
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      {`${tCommon('commands.transform_to')} ${returnNoteLabels.singular}`}
                                    </DropdownMenuItem>
                                  )}
                                  {linkedInvoices.map((invoice) => (
                                    <DropdownMenuItem
                                      key={`invoice-${invoice.id}`}
                                      onClick={() => {
                                        setSelectedDeliveryNote(deliveryNote);
                                        setDetailsDialog(true);
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      {`Voir la ${invoiceLabels.singular} créée`}
                                    </DropdownMenuItem>
                                  ))}
                                  {visibleReturnNotes.map((returnNote) => (
                                    <DropdownMenuItem
                                      key={`return-note-${returnNote.id}`}
                                      onClick={() => {
                                        setSelectedDeliveryNote(deliveryNote);
                                        setDetailsDialog(true);
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      {`Voir le ${returnNoteLabels.singular} créé`}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!setManagedDeliveryNote(deliveryNote)) return;
                                    setDownloadDialog(true);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" /> {tCommon('commands.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDeliveryNote(deliveryNote);
                                    setEmailDialog(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" /> Envoyer par email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDeliveryNote(deliveryNote);
                                    setWhatsAppDialog(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2 text-green-500" /> Envoyer
                                  par WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDeliveryNote(deliveryNote);
                                    blurActiveElement();
                                    setStatusDialog(true);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" /> {tCommon('actions.changeStatus')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!setManagedDeliveryNote(deliveryNote)) return;
                                    setDuplicateDialog(true);
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" /> Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDeliveryNote(deliveryNote);
                                    setAttachmentDialog(true);
                                  }}
                                >
                                  <Paperclip className="h-4 w-4 mr-2" /> {tCommon('actions.manageAttachments')}
                                </DropdownMenuItem>
                                {hasUploads && (
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadWithAttachments(deliveryNote)}
                                  >
                                    <Paperclip className="h-4 w-4 mr-2" />{' '}
                                    {tInvoicing('deliveryNote.action_download_with_attachments')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                                  onClick={() => {
                                    if (!setManagedDeliveryNote(deliveryNote)) return;
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2 text-rose-600" /> {tCommon('commands.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="h-90 px-4 py-10 text-center">
                      <div
                        className={cn(
                          'flex h-full flex-col items-center justify-center gap-3',
                          mutedTextClassName
                        )}
                      >
                        {isPending ? (
                          <>
                            <Spinner />
                            <p>{tCommon('table.loading')}</p>
                          </>
                        ) : (
                          <p className="text-base">{tCommon('table.no_results_found')}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {tCommon('table.lines')}
                </span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => {
                    setPage(1);
                    setSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-10 w-23 rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {tCommon('table.page_of', { page, total: totalPageCount })}
              </span>

              <span>
                {totalResultCount === 0
                  ? tCommon('table.no_results_found')
                  : tCommon('table.result_count', { count: totalResultCount })}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || totalPageCount === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPageCount || totalPageCount === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
