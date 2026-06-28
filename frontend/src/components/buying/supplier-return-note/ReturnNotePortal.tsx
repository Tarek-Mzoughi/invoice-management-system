import React from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Plus,
  Search,
  Settings2,
  Trash2,
  User2,
  X
} from 'lucide-react';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { RETURN_NOTE_STATUS, ReturnNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Spinner } from '@/components/shared/Spinner';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { useReturnNoteManager } from './hooks/useReturnNoteManager';
import { cn } from '@/lib/utils';
import { ReturnNoteDeleteDialog } from './dialogs/ReturnNoteDeleteDialog';
import { ReturnNoteDownloadDialog } from './dialogs/ReturnNoteDownloadDialog';
import { ReturnNoteDuplicateDialog } from './dialogs/ReturnNoteDuplicateDialog';
import { ReturnNoteInvoiceDialog } from './dialogs/ReturnNoteInvoiceDialog';
import { ReturnNoteBulkDeleteDialog } from './dialogs/ReturnNoteBulkDeleteDialog';
import { ReturnNoteDetailsDialog } from './dialogs/ReturnNoteDetailsDialog';
import { ReturnNoteEmailDialog } from './dialogs/ReturnNoteEmailDialog';
import { ReturnNoteWhatsAppDialog } from './dialogs/ReturnNoteWhatsAppDialog';
import { ReturnNoteAttachmentDialog } from './dialogs/ReturnNoteAttachmentDialog';
import {
  useDocumentPortal,
  FilterDateField,
  panelClassName,
  fieldClassName,
  labelClassName,
  mutedTextClassName
} from '@/features/invoicing/shared/portal';
import { exportReturnNotesToExcel, exportReturnNotesToPdf } from './returnNoteExport';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface ReturnNoteMainProps {
  className?: string;
  scope?: 'selling' | 'buying';
  rootPath?: string;
  listPath?: string;
  newPath?: string;
  detailPathPrefix?: string;
  linkedInvoicePathPrefix?: string;
}
const RETURN_NOTE_STATUS_OPTIONS: RETURN_NOTE_STATUS[] = [
  RETURN_NOTE_STATUS.Draft,
  RETURN_NOTE_STATUS.Validated,
  RETURN_NOTE_STATUS.Cancelled
];
const getStatusBadgeClassName = (status?: RETURN_NOTE_STATUS) => {
  switch (status) {
    case RETURN_NOTE_STATUS.Accepted:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case RETURN_NOTE_STATUS.Validated:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case RETURN_NOTE_STATUS.Sent:
      return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    case RETURN_NOTE_STATUS.Rejected:
    case RETURN_NOTE_STATUS.Cancelled:
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
    case RETURN_NOTE_STATUS.Invoiced:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
    case RETURN_NOTE_STATUS.Expired:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
    default:
      return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
  }
};
const formatReturnNoteAmount = (returnNote: ReturnNote, localeCode: string) => {
  const digits = returnNote.currency?.digitAfterComma ?? 2;
  const amount = Number(returnNote.total ?? 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${amount} ${returnNote.currency?.symbol || ''}`.trim();
};
export const ReturnNotePortal: React.FC<ReturnNoteMainProps> = ({
  className,
  scope = 'buying',
  rootPath = '/buying',
  listPath = '/buying/retours-fournisseurs',
  newPath = '/buying/nouveau-retour-fournisseur',
  detailPathPrefix = '/buying/retour-fournisseur',
  linkedInvoicePathPrefix = '/buying/facture-achat'
}) => {
  const returnNoteLabels = useScopedDocumentLabels('returnNote', scope);
  const invoiceLabels = useSellingInvoiceLabels({ enabled: false, scope });
  const portal = useDocumentPortal<ReturnNote>({
    entityKey: 'returnNotes',
    translationKey: 'returnNote',
    apiModule: api.returnNote,
    scope,
    rootPath,
    listPath,
    newPath,
    detailPathPrefix,
    defaultRelations: ['firm', 'interlocutor', 'currency', 'invoices', 'uploads']
  });
  const {
    router,
    tCommon,
    tInvoicing,
    i18n,
    dateLocale,
    numberLocale,
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
    items: returnNotes,
    firms,
    error,
    refetchList: refetchReturnNotes,
    deleteDialog,
    setDeleteDialog,
    duplicateDialog,
    setDuplicateDialog,
    downloadDialog,
    setDownloadDialog,
    previewDialog,
    previewBlob,
    closePreviewDialog,
    removeItem: removeReturnNote,
    duplicateItem: duplicateReturnNote,
    downloadItem: downloadReturnNote,
    loadPreview,
    isPending: basePending,
    isDeletePending,
    isDuplicationPending,
    isDownloadPending,
    isPreviewPending
  } = portal;
  const returnNoteManager = useReturnNoteManager();
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [detailsDialog, setDetailsDialog] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState(false);
  const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
  const [attachmentDialog, setAttachmentDialog] = React.useState(false);
  const [selectedReturnNote, setSelectedReturnNote] = React.useState<ReturnNote | null>(null);
  const [linkedPreviewDialog, setLinkedPreviewDialog] = React.useState(false);
  const [linkedPreviewBlob, setLinkedPreviewBlob] = React.useState<Blob | null>(null);
  const [linkedPreviewFilename, setLinkedPreviewFilename] = React.useState('document-preview.pdf');
  const setManagedReturnNote = React.useCallback(
    (returnNote: ReturnNote) => {
      if (!returnNote.id) return false;
      returnNoteManager.set('id', returnNote.id);
      returnNoteManager.set('sequential', returnNoteLabels.displayNumber(returnNote));
      returnNoteManager.set('status', returnNote.status || RETURN_NOTE_STATUS.Nonexistent);
      return true;
    },
    [returnNoteLabels.displayNumber, returnNoteManager]
  );
  const selectedReturnNotes = React.useMemo(
    () =>
      returnNotes.filter((returnNote) =>
        returnNote.id ? selectedIds.includes(returnNote.id) : false
      ),
    [returnNotes, selectedIds]
  );
  const buildExportRows = React.useCallback(
    (notes: ReturnNote[]) =>
      notes.map((returnNote) => ({
        reference: returnNote.sequential || '-',
        client: returnNote.firm?.name || '-',
        status: returnNote.status ? tInvoicing(returnNote.status) : '-',
        amount: formatReturnNoteAmount(returnNote, numberLocale),
        date: returnNote.date
          ? format(parseISO(returnNote.date), 'dd/MM/yyyy', { locale: dateLocale })
          : '-'
      })),
    [dateLocale, numberLocale, tInvoicing]
  );
  const openReturnNoteDetails = React.useCallback((returnNote: ReturnNote) => {
    setSelectedReturnNote(returnNote);
    setDetailsDialog(true);
  }, []);
  const openReturnNotePreview = React.useCallback(
    (returnNote: ReturnNote) => {
      if (!returnNote.id || !setManagedReturnNote(returnNote)) return;
      loadPreview(returnNote.id);
    },
    [loadPreview, setManagedReturnNote]
  );
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
  const closeReturnNoteDetailsThen = React.useCallback(
    (callback: () => void) => runAfterOverlayClose(() => setDetailsDialog(false), callback),
    [runAfterOverlayClose]
  );
  const buildExportFileName = React.useCallback(
    (extension: 'pdf' | 'xlsx') =>
      `supplier-returns-${new Date().toISOString().slice(0, 10)}.${extension}`,
    []
  );
  const buildGeneratedAtLabel = React.useCallback(
    () =>
      new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date()),
    [i18n.language]
  );
  const handleBulkExportPdf = React.useCallback(async () => {
    if (selectedReturnNotes.length === 0) return;
    try {
      await exportReturnNotesToPdf({
        rows: buildExportRows(selectedReturnNotes),
        labels: {
          reference: returnNoteLabels.referenceFieldLabel,
          client: tInvoicing('returnNote.attributes.supplier'),
          status: tInvoicing('returnNote.attributes.status'),
          amount: tInvoicing('returnNote.attributes.total'),
          date: tInvoicing('returnNote.attributes.date')
        },
        title: returnNoteLabels.plural,
        generatedAt: buildGeneratedAtLabel(),
        fileName: buildExportFileName('pdf')
      });
      toast.success(tInvoicing('returnNote.export_pdf_success'));
    } catch (error) {
      toast.error(tInvoicing('returnNote.export_pdf_failure'));
    }
  }, [
    buildExportFileName,
    buildExportRows,
    buildGeneratedAtLabel,
    returnNoteLabels.plural,
    returnNoteLabels.referenceFieldLabel,
    scope,
    selectedReturnNotes,
    tInvoicing
  ]);
  const handleBulkExportExcel = React.useCallback(async () => {
    if (selectedReturnNotes.length === 0) return;
    try {
      await exportReturnNotesToExcel({
        rows: buildExportRows(selectedReturnNotes),
        labels: {
          reference: returnNoteLabels.referenceFieldLabel,
          client: tInvoicing('returnNote.attributes.supplier'),
          status: tInvoicing('returnNote.attributes.status'),
          amount: tInvoicing('returnNote.attributes.total'),
          date: tInvoicing('returnNote.attributes.date')
        },
        title: returnNoteLabels.plural,
        generatedAt: buildGeneratedAtLabel(),
        fileName: buildExportFileName('xlsx')
      });
      toast.success(tInvoicing('returnNote.export_excel_success'));
    } catch (error) {
      toast.error(tInvoicing('returnNote.export_excel_failure'));
    }
  }, [
    buildExportFileName,
    buildExportRows,
    buildGeneratedAtLabel,
    returnNoteLabels.plural,
    returnNoteLabels.referenceFieldLabel,
    scope,
    selectedReturnNotes,
    tInvoicing
  ]);
  const handleBulkDownload = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    toast.info(tInvoicing('returnNote.bulk_download_start', { count: selectedIds.length }));
    try {
      for (const id of selectedIds) {
        await api.returnNote.download(id, 'template1');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success(tInvoicing('returnNote.bulk_download_success'));
    } catch (error) {
      toast.error(tInvoicing('returnNote.bulk_download_failure'));
    }
  }, [selectedIds, tInvoicing]);
  const handleDownloadWithAttachments = React.useCallback(
    async (returnNote: ReturnNote) => {
      try {
        if (!returnNote.id) return;
        const fullReturnNote = await api.returnNote.findOne(returnNote.id);
        await api.returnNote.download(returnNote.id, 'template1');
        if (fullReturnNote.uploads?.length) {
          for (const upload of fullReturnNote.uploads) {
            if (upload.upload?.slug) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              await api.upload.downloadFile(upload.upload.slug, upload.upload.filename);
            }
          }
        }
        toast.success(tInvoicing('returnNote.action_download_success'));
      } catch (error) {
        toast.error(
          getErrorMessage(
            'invoicing',
            error as Error,
            tInvoicing('returnNote.action_download_failure')
          )
        );
      }
    },
    [tInvoicing]
  );
  const handleBulkDelete = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    let successCount = 0;
    let failureCount = 0;
    try {
      for (const id of selectedIds) {
        try {
          await api.returnNote.remove(id);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }
      if (successCount > 0) {
        toast.success(tInvoicing('returnNote.bulk_remove_success', { count: successCount }));
        refetchReturnNotes();
        setSelectedIds([]);
      }
      if (failureCount > 0) {
        toast.error(tInvoicing('returnNote.bulk_remove_failure', { count: failureCount }));
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialog(false);
    }
  }, [refetchReturnNotes, selectedIds, setSelectedIds, tInvoicing]);
  React.useEffect(() => {
    setIntro?.(returnNoteLabels.plural, returnNoteLabels.cardDescription);
    setRoutes?.([
      { title: tCommon('menu.buying'), href: rootPath },
      { title: returnNoteLabels.plural, href: listPath }
    ]);
    setFloating?.(
      <div className="flex items-center gap-2">
        {selectedIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-md border-zinc-200 px-5 dark:border-zinc-800"
              >
                {tCommon('commands.more_actions')}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={handleBulkExportPdf} className="gap-2">
                <FileText className="h-4 w-4" />
                {tInvoicing('returnNote.export_pdf')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {tInvoicing('returnNote.export_excel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkDownload} className="gap-2">
                <Download className="h-4 w-4" />
                {tCommon('commands.download_selection', { count: selectedIds.length })}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setBulkDeleteDialog(true)}
                className="gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50"
              >
                <Trash2 className="h-4 w-4" />
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
          {returnNoteLabels.addButtonLabel}
        </Button>
      </div>
    );
    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [
    clearFloating,
    clearIntro,
    clearRoutes,
    handleBulkDownload,
    handleBulkExportExcel,
    handleBulkExportPdf,
    listPath,
    newPath,
    rootPath,
    router,
    scope,
    selectedIds.length,
    returnNoteLabels.addButtonLabel,
    returnNoteLabels.cardDescription,
    returnNoteLabels.plural,
    setFloating,
    setIntro,
    setRoutes,
    tCommon,
    tInvoicing
  ]);
  const { mutate: invoiceReturnNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.returnNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('transformations.invoice.success'));
      refetchReturnNotes();
      router.push(`${linkedInvoicePathPrefix}/${data.invoices[data.invoices.length - 1].id}`);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('transformations.invoice.failure'))
      );
    }
  });
  const { mutate: loadLinkedPreview, isPending: isLinkedPreviewPending } = useMutation({
    mutationFn: async ({ type, id, filename }: { type: string; id: number; filename: string }) => {
      if (type === 'invoice') {
        const blob = await api.invoice.preview(id, 'template1');
        return { blob, filename };
      }
      throw new Error(`Unsupported linked preview type: ${type}`);
    },
    onSuccess: ({ blob, filename }) => {
      setLinkedPreviewBlob(blob);
      setLinkedPreviewFilename(filename);
      setLinkedPreviewDialog(true);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tCommon('errors.unexpected')));
    }
  });
  const openLinkedDocument = React.useCallback(
    (type: string, id: number) => {
      if (type === 'invoice') {
        const invoice = selectedReturnNote?.invoices?.find((document) => document.id === id);
        loadLinkedPreview({
          type,
          id,
          filename: `${invoiceLabels.displayNumber(invoice) || `invoice-${id}`}.pdf`
        });
      }
    },
    [invoiceLabels, loadLinkedPreview, selectedReturnNote]
  );
  const isPending = basePending || isInvoicingPending;
  if (error) return 'An error has occurred: ' + error.message;
  return (
    <>
      <ReturnNoteBulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteDialog}
        onDelete={handleBulkDelete}
        isPending={isBulkDeleting}
        onClose={() => setBulkDeleteDialog(false)}
      />

      <ReturnNoteDeleteDialog
        id={returnNoteManager?.id}
        sequential={returnNoteManager?.sequential || ''}
        scope={scope}
        open={deleteDialog}
        deleteReturnNote={() => {
          returnNoteManager?.id && removeReturnNote(returnNoteManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />

      <ReturnNoteDuplicateDialog
        id={returnNoteManager?.id || 0}
        sequential={returnNoteManager?.sequential || ''}
        scope={scope}
        open={duplicateDialog}
        duplicateReturnNote={(includeFiles: boolean) => {
          returnNoteManager?.id &&
            duplicateReturnNote({
              id: returnNoteManager?.id,
              includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />

      <ReturnNoteDownloadDialog
        id={returnNoteManager?.id || 0}
        open={downloadDialog}
        downloadReturnNote={(template: string) => {
          returnNoteManager?.id && downloadReturnNote({ id: returnNoteManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />

      {false}

      <ReturnNoteDetailsDialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        returnNote={selectedReturnNote}
        detailPathPrefix={detailPathPrefix}
        scope={scope}
        onPreview={() => {
          if (!selectedReturnNote) return;
          closeReturnNoteDetailsThen(() => openReturnNotePreview(selectedReturnNote));
        }}
        onDownload={() => {
          if (!selectedReturnNote || !setManagedReturnNote(selectedReturnNote)) return;
          closeReturnNoteDetailsThen(() => setDownloadDialog(true));
        }}
        onDownloadWithAttachments={
          selectedReturnNote?.uploads?.length
            ? () => {
                if (!selectedReturnNote) return;
                closeReturnNoteDetailsThen(() => handleDownloadWithAttachments(selectedReturnNote));
              }
            : undefined
        }
        onDuplicate={() => {
          if (!selectedReturnNote || !setManagedReturnNote(selectedReturnNote)) return;
          closeReturnNoteDetailsThen(() => setDuplicateDialog(true));
        }}
        onDelete={() => {
          if (!selectedReturnNote || !setManagedReturnNote(selectedReturnNote)) return;
          closeReturnNoteDetailsThen(() => setDeleteDialog(true));
        }}
        onInvoice={undefined}
        onEmail={() => {
          if (!selectedReturnNote) return;
          closeReturnNoteDetailsThen(() => setEmailDialog(true));
        }}
        onWhatsApp={() => {
          if (!selectedReturnNote) return;
          closeReturnNoteDetailsThen(() => setWhatsAppDialog(true));
        }}
        onAttachment={() => {
          if (!selectedReturnNote) return;
          closeReturnNoteDetailsThen(() => setAttachmentDialog(true));
        }}
        onLinkedDocumentOpen={openLinkedDocument}
      />

      <ReturnNoteEmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        returnNote={selectedReturnNote}
        scope={scope}
      />

      <ReturnNoteWhatsAppDialog
        open={whatsAppDialog}
        onClose={() => setWhatsAppDialog(false)}
        returnNote={selectedReturnNote}
        scope={scope}
      />

      <ReturnNoteAttachmentDialog
        open={attachmentDialog}
        onClose={() => setAttachmentDialog(false)}
        returnNote={selectedReturnNote}
        scope={scope}
        onSaved={async () => {
          await refetchReturnNotes();
          if (selectedReturnNote?.id) {
            try {
              const freshReturnNote = await api.returnNote.findOne(selectedReturnNote.id);
              setSelectedReturnNote(freshReturnNote);
            } catch (_error) {}
          }
        }}
      />

      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${returnNoteManager.sequential || `return-note-${returnNoteManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />

      <DocumentPreviewDialog
        open={linkedPreviewDialog}
        loading={isLinkedPreviewPending}
        previewBlob={linkedPreviewBlob}
        filename={linkedPreviewFilename}
        title={tCommon('commands.preview')}
        onClose={() => {
          setLinkedPreviewDialog(false);
          setLinkedPreviewBlob(null);
        }}
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
              <p className={labelClassName}>{tInvoicing('returnNote.attributes.status')}</p>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {RETURN_NOTE_STATUS_OPTIONS.map((status) => (
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
                    {returnNoteLabels.referenceFieldLabel}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('returnNote.attributes.supplier')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('returnNote.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('returnNote.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && returnNotes.length > 0 ? (
                  returnNotes.map((returnNote) => {
                    const returnNoteId = returnNote.id || 0;
                    const isSelected = returnNoteId > 0 && selectedIds.includes(returnNoteId);
                    const hasUploads = (returnNote.uploads?.length ?? 0) > 0;
                    return (
                      <tr
                        key={returnNoteId || returnNote.sequential}
                        className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                      >
                        <td className="px-4 py-4 align-middle">
                          <Checkbox
                            checked={isSelected}
                            disabled={!returnNoteId}
                            className="border-zinc-400 dark:border-zinc-700"
                            onCheckedChange={(checked) => {
                              if (!returnNoteId) return;
                              setSelectedIds((current) => {
                                if (checked === true) {
                                  return current.includes(returnNoteId)
                                    ? current
                                    : [...current, returnNoteId];
                                }
                                return current.filter((id) => id !== returnNoteId);
                              });
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="text-left font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50"
                              onClick={() => router.push(`${detailPathPrefix}/${returnNote.id}`)}
                            >
                              {returnNoteLabels.displayNumber(returnNote)}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {returnNote.date
                                ? format(parseISO(returnNote.date), 'dd MMM yyyy - HH:mm', {
                                    locale: dateLocale
                                  })
                                : '-'}
                            </span>
                            {returnNote.dueDate && (
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('returnNote.attributes.due_date')}:{' '}
                                {format(parseISO(returnNote.dueDate), 'dd MMM yyyy - HH:mm', {
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
                                {returnNote.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {returnNote.interlocutor
                                  ? `${returnNote.interlocutor.surname || ''} ${returnNote.interlocutor.name || ''}`.trim()
                                  : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              getStatusBadgeClassName(returnNote.status)
                            )}
                          >
                            {returnNote.status ? tInvoicing(returnNote.status) : '-'}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right align-middle font-medium text-zinc-950 dark:text-zinc-50">
                          {formatReturnNoteAmount(returnNote, numberLocale)}
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => openReturnNotePreview(returnNote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => router.push(`${detailPathPrefix}/${returnNote.id}`)}
                            >
                              <PencilLine className="h-4 w-4" />
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
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => openReturnNotePreview(returnNote)}
                                >
                                  <Eye className="h-4 w-4" />
                                  {tCommon('commands.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => openReturnNoteDetails(returnNote)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {tCommon('commands.details')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() =>
                                    router.push(`${detailPathPrefix}/${returnNote.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                  {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    if (!setManagedReturnNote(returnNote)) return;
                                    setDownloadDialog(true);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  {tInvoicing('returnNote.details.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedReturnNote(returnNote);
                                    setEmailDialog(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                  {tInvoicing('returnNote.details.send_email')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedReturnNote(returnNote);
                                    setWhatsAppDialog(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 text-green-500" />
                                  {tInvoicing('returnNote.details.send_whatsapp')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedReturnNote(returnNote);
                                    setAttachmentDialog(true);
                                  }}
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {tInvoicing('returnNote.details.manage_attachments')}
                                </DropdownMenuItem>
                                {hasUploads && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2 px-3 py-2"
                                    onClick={() => handleDownloadWithAttachments(returnNote)}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    {tInvoicing('returnNote.action_download_with_attachments')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50"
                                  onClick={() => {
                                    if (!setManagedReturnNote(returnNote)) return;
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {tCommon('commands.delete')}
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
