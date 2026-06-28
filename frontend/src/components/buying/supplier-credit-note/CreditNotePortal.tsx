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
  PencilLine,
  Paperclip,
  Plus,
  Search,
  Settings2,
  Trash2,
  User2,
  X,
  Copy
} from 'lucide-react';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { CREDIT_NOTE_STATUS, CreditNote } from '@/types';
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
import { cn } from '@/lib/utils';
import { CreditNoteDeleteDialog } from './dialogs/CreditNoteDeleteDialog';
import { CreditNoteDownloadDialog } from './dialogs/CreditNoteDownloadDialog';
import { CreditNoteDuplicateDialog } from './dialogs/CreditNoteDuplicateDialog';
import { CreditNoteBulkDeleteDialog } from './dialogs/CreditNoteBulkDeleteDialog';
import { CreditNoteDetailsDialog } from './dialogs/CreditNoteDetailsDialog';
import { CreditNoteEmailDialog } from './dialogs/CreditNoteEmailDialog';
import { CreditNoteWhatsAppDialog } from './dialogs/CreditNoteWhatsAppDialog';
import { CreditNoteAttachmentDialog } from './dialogs/CreditNoteAttachmentDialog';
import { useCreditNoteManager } from './hooks/useCreditNoteManager';
import {
  useDocumentPortal,
  FilterDateField,
  panelClassName,
  fieldClassName,
  labelClassName,
  mutedTextClassName
} from '@/features/invoicing/shared/portal';
import { exportCreditNotesToExcel, exportCreditNotesToPdf } from './creditNoteExport';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
interface CreditNotePortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  listPath?: string;
  newPath?: string;
  rootPath?: string;
  scope?: 'selling' | 'buying';
  detailPathPrefix?: string;
}
const CREDIT_NOTE_STATUS_OPTIONS: CREDIT_NOTE_STATUS[] = [
  CREDIT_NOTE_STATUS.Draft,
  CREDIT_NOTE_STATUS.Unpaid,
  CREDIT_NOTE_STATUS.PartiallyPaid,
  CREDIT_NOTE_STATUS.Paid,
  CREDIT_NOTE_STATUS.Expired
];
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
const formatCreditNoteAmount = (creditNote: CreditNote, localeCode: string) => {
  const digits = creditNote.currency?.digitAfterComma ?? 2;
  const amount = Number(creditNote.total ?? 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${amount} ${creditNote.currency?.symbol || ''}`.trim();
};
export const CreditNotePortal: React.FC<CreditNotePortalProps> = ({
  className,
  firmId,
  interlocutorId,
  scope = 'buying',
  rootPath = '/buying',
  listPath = '/buying/avoirs-fournisseurs',
  newPath = '/buying/nouvel-avoir-fournisseur',
  detailPathPrefix = '/buying/avoir-fournisseur'
}) => {
  const creditNoteLabels = useScopedDocumentLabels('creditNote', scope);
  const portal = useDocumentPortal<CreditNote>({
    entityKey: 'creditNotes',
    translationKey: 'creditNote',
    apiModule: api.creditNote,
    scope,
    rootPath,
    listPath,
    newPath,
    detailPathPrefix,
    defaultRelations: [
      'firm',
      'interlocutor',
      'currency',
      'payments',
      'payments.payment',
      'uploads',
      'uploads.upload',
      'sourceInvoice',
      'sourceReturnNote',
      'quotation',
      'deliveryNote',
      'goodsIssueNote'
    ],
    firmId,
    interlocutorId
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
    items: creditNotes,
    firms,
    error,
    refetchList: refetchCreditNotes,
    deleteDialog,
    setDeleteDialog,
    duplicateDialog,
    setDuplicateDialog,
    downloadDialog,
    setDownloadDialog,
    previewDialog,
    previewBlob,
    closePreviewDialog,
    removeItem: removeCreditNote,
    duplicateItem: duplicateCreditNote,
    downloadItem: downloadCreditNote,
    loadPreview,
    isPending: basePending,
    isDeletePending,
    isDuplicationPending,
    isDownloadPending,
    isPreviewPending
  } = portal;
  const creditNoteManager = useCreditNoteManager();
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [detailsDialog, setDetailsDialog] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState(false);
  const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
  const [attachmentDialog, setAttachmentDialog] = React.useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = React.useState<CreditNote | null>(null);
  const [linkedPreviewDialog, setLinkedPreviewDialog] = React.useState(false);
  const [linkedPreviewBlob, setLinkedPreviewBlob] = React.useState<Blob | null>(null);
  const [linkedPreviewFilename, setLinkedPreviewFilename] = React.useState('document-preview.pdf');
  const setManagedCreditNote = React.useCallback(
    (creditNote: CreditNote) => {
      if (!creditNote.id) return false;
      creditNoteManager.set('id', creditNote.id);
      creditNoteManager.set('sequential', creditNote.reference || creditNote.sequential || '');
      creditNoteManager.set('status', creditNote.status || CREDIT_NOTE_STATUS.Nonexistent);
      return true;
    },
    [creditNoteManager, scope]
  );
  const selectedCreditNotes = React.useMemo(
    () =>
      creditNotes.filter((creditNote) =>
        creditNote.id ? selectedIds.includes(creditNote.id) : false
      ),
    [creditNotes, selectedIds]
  );
  const buildExportRows = React.useCallback(
    (notes: CreditNote[]) =>
      notes.map((creditNote) => ({
        reference: creditNote.reference || creditNote.sequential || '-',
        client: creditNote.firm?.name || '-',
        status: creditNote.status ? tInvoicing(creditNote.status) : '-',
        amount: formatCreditNoteAmount(creditNote, numberLocale),
        date: creditNote.date
          ? format(parseISO(creditNote.date), 'dd/MM/yyyy', { locale: dateLocale })
          : '-'
      })),
    [dateLocale, numberLocale, scope, tInvoicing]
  );
  const openCreditNoteDetails = React.useCallback((creditNote: CreditNote) => {
    setSelectedCreditNote(creditNote);
    setDetailsDialog(true);
    if (creditNote.id) {
      void api.creditNote
        .findOne(creditNote.id)
        .then((freshCreditNote) => {
          setSelectedCreditNote((current) =>
            current?.id === freshCreditNote.id ? freshCreditNote : current
          );
        })
        .catch(() => {});
    }
  }, []);
  const openCreditNotePreview = React.useCallback(
    (creditNote: CreditNote) => {
      if (!creditNote.id || !setManagedCreditNote(creditNote)) return;
      loadPreview(creditNote.id);
    },
    [loadPreview, setManagedCreditNote]
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
  const closeCreditNoteDetailsThen = React.useCallback(
    (callback: () => void) => runAfterOverlayClose(() => setDetailsDialog(false), callback),
    [runAfterOverlayClose]
  );
  const buildExportFileName = React.useCallback(
    (extension: 'pdf' | 'xlsx') =>
      `supplier-credit-notes-${new Date().toISOString().slice(0, 10)}.${extension}`,
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
    if (selectedCreditNotes.length === 0) return;
    try {
      await exportCreditNotesToPdf({
        rows: buildExportRows(selectedCreditNotes),
        labels: {
          reference: creditNoteLabels.referenceFieldLabel,
          client: tInvoicing('creditNote.attributes.supplier'),
          status: tInvoicing('creditNote.attributes.status'),
          amount: tInvoicing('creditNote.attributes.total'),
          date: tInvoicing('creditNote.attributes.date')
        },
        title: creditNoteLabels.plural,
        generatedAt: buildGeneratedAtLabel(),
        fileName: buildExportFileName('pdf')
      });
      toast.success(tInvoicing('creditNote.export_pdf_success'));
    } catch (_error) {
      toast.error(tInvoicing('creditNote.export_pdf_failure'));
    }
  }, [
    buildExportFileName,
    buildExportRows,
    creditNoteLabels.plural,
    creditNoteLabels.referenceFieldLabel,
    buildGeneratedAtLabel,
    scope,
    selectedCreditNotes,
    tInvoicing
  ]);
  const handleBulkExportExcel = React.useCallback(async () => {
    if (selectedCreditNotes.length === 0) return;
    try {
      await exportCreditNotesToExcel({
        rows: buildExportRows(selectedCreditNotes),
        labels: {
          reference: creditNoteLabels.referenceFieldLabel,
          client: tInvoicing('creditNote.attributes.supplier'),
          status: tInvoicing('creditNote.attributes.status'),
          amount: tInvoicing('creditNote.attributes.total'),
          date: tInvoicing('creditNote.attributes.date')
        },
        title: creditNoteLabels.plural,
        generatedAt: buildGeneratedAtLabel(),
        fileName: buildExportFileName('xlsx')
      });
      toast.success(tInvoicing('creditNote.export_excel_success'));
    } catch (_error) {
      toast.error(tInvoicing('creditNote.export_excel_failure'));
    }
  }, [
    buildExportFileName,
    buildExportRows,
    creditNoteLabels.plural,
    creditNoteLabels.referenceFieldLabel,
    buildGeneratedAtLabel,
    scope,
    selectedCreditNotes,
    tInvoicing
  ]);
  const handleBulkDownload = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    toast.info(tInvoicing('creditNote.bulk_download_start', { count: selectedIds.length }));
    try {
      for (const id of selectedIds) {
        await api.creditNote.download(id, 'template1');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success(tInvoicing('creditNote.bulk_download_success'));
    } catch (_error) {
      toast.error(tInvoicing('creditNote.bulk_download_failure'));
    }
  }, [selectedIds, tInvoicing]);
  const handleDownloadWithAttachments = React.useCallback(
    async (creditNote: CreditNote) => {
      try {
        if (!creditNote.id) return;
        const fullCreditNote = await api.creditNote.findOne(creditNote.id);
        await api.creditNote.download(creditNote.id, 'template1');
        if (fullCreditNote.uploads?.length) {
          for (const upload of fullCreditNote.uploads) {
            if (upload.upload?.slug) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              await api.upload.downloadFile(upload.upload.slug, upload.upload.filename);
            }
          }
        }
        toast.success(tInvoicing('creditNote.action_download_success'));
      } catch (error) {
        toast.error(
          getErrorMessage(
            'invoicing',
            error as Error,
            tInvoicing('creditNote.action_download_failure')
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
          await api.creditNote.remove(id);
          successCount++;
        } catch (_error) {
          failureCount++;
        }
      }
      if (successCount > 0) {
        toast.success(tInvoicing('creditNote.bulk_remove_success', { count: successCount }));
        refetchCreditNotes();
        setSelectedIds([]);
      }
      if (failureCount > 0) {
        toast.error(tInvoicing('creditNote.bulk_remove_failure', { count: failureCount }));
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialog(false);
    }
  }, [refetchCreditNotes, selectedIds, setSelectedIds, tInvoicing]);
  React.useEffect(() => {
    setIntro?.(creditNoteLabels.plural, creditNoteLabels.cardDescription);
    setRoutes?.([
      { title: tCommon('menu.buying'), href: rootPath },
      { title: creditNoteLabels.plural, href: listPath }
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
                {tInvoicing('creditNote.export_pdf')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {tInvoicing('creditNote.export_excel')}
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

        <Button className="h-11 rounded-md px-5" onClick={() => router.push(newPath)}>
          <Plus className="h-4 w-4" />
          {creditNoteLabels.addButtonLabel}
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
    creditNoteLabels.addButtonLabel,
    creditNoteLabels.cardDescription,
    creditNoteLabels.plural,
    handleBulkDownload,
    handleBulkExportExcel,
    handleBulkExportPdf,
    listPath,
    newPath,
    rootPath,
    router,
    scope,
    selectedIds.length,
    setFloating,
    setIntro,
    setRoutes,
    tCommon,
    tInvoicing
  ]);
  const { mutate: loadLinkedPreview, isPending: isLinkedPreviewPending } = useMutation({
    mutationFn: async ({ type, id, filename }: { type: string; id: number; filename: string }) => {
      if (type === 'invoice') {
        const blob = await api.invoice.preview(id, 'template1');
        return { blob, filename };
      }
      if (type === 'return-note') {
        const blob = await api.returnNote.preview(id, 'template1');
        return { blob, filename };
      }
      if (type === 'quotation') {
        const blob = await api.quotation.preview(id, 'template1');
        return { blob, filename };
      }
      if (type === 'delivery-note') {
        const blob = await api.deliveryNote.preview(id, 'template1');
        return { blob, filename };
      }
      if (type === 'goods-issue-note') {
        const blob = await api.goodsIssueNote.preview(id, 'template1');
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
      if (!selectedCreditNote) return;
      const documentByType: Record<
        string,
        | {
            sequential?: string;
            reference?: string;
          }
        | null
        | undefined
      > = {
        invoice: selectedCreditNote.sourceInvoice,
        'return-note': selectedCreditNote.sourceReturnNote,
        quotation: selectedCreditNote.quotation,
        'delivery-note': selectedCreditNote.deliveryNote,
        'goods-issue-note': selectedCreditNote.goodsIssueNote
      };
      const document = documentByType[type];
      loadLinkedPreview({
        type,
        id,
        filename: `${document?.sequential || document?.reference || `${type}-${id}`}.pdf`
      });
    },
    [loadLinkedPreview, selectedCreditNote]
  );
  const isPending = basePending || isLinkedPreviewPending;
  if (error) return 'An error has occurred: ' + error.message;
  return (
    <>
      <CreditNoteBulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteDialog}
        onDelete={handleBulkDelete}
        isPending={isBulkDeleting}
        onClose={() => setBulkDeleteDialog(false)}
      />

      <CreditNoteDeleteDialog
        id={creditNoteManager?.id}
        sequential={creditNoteManager?.sequential || ''}
        scope={scope}
        open={deleteDialog}
        deleteCreditNote={() => {
          creditNoteManager?.id && removeCreditNote(creditNoteManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />

      <CreditNoteDuplicateDialog
        id={creditNoteManager?.id || 0}
        sequential={creditNoteManager?.sequential || ''}
        scope={scope}
        open={duplicateDialog}
        duplicateCreditNote={(includeFiles: boolean) => {
          creditNoteManager?.id &&
            duplicateCreditNote({
              id: creditNoteManager?.id,
              includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />

      <CreditNoteDownloadDialog
        id={creditNoteManager?.id || 0}
        open={downloadDialog}
        downloadCreditNote={(template: string) => {
          creditNoteManager?.id && downloadCreditNote({ id: creditNoteManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />

      <CreditNoteDetailsDialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        creditNote={selectedCreditNote}
        detailPathPrefix={detailPathPrefix}
        scope={scope}
        onPreview={() => {
          if (!selectedCreditNote) return;
          closeCreditNoteDetailsThen(() => openCreditNotePreview(selectedCreditNote));
        }}
        onDownload={() => {
          if (!selectedCreditNote || !setManagedCreditNote(selectedCreditNote)) return;
          closeCreditNoteDetailsThen(() => setDownloadDialog(true));
        }}
        onDownloadWithAttachments={
          selectedCreditNote?.uploads?.length
            ? () => {
                if (!selectedCreditNote) return;
                closeCreditNoteDetailsThen(() => handleDownloadWithAttachments(selectedCreditNote));
              }
            : undefined
        }
        onDuplicate={() => {
          if (!selectedCreditNote || !setManagedCreditNote(selectedCreditNote)) return;
          closeCreditNoteDetailsThen(() => setDuplicateDialog(true));
        }}
        onDelete={() => {
          if (!selectedCreditNote || !setManagedCreditNote(selectedCreditNote)) return;
          closeCreditNoteDetailsThen(() => setDeleteDialog(true));
        }}
        onEmail={() => {
          if (!selectedCreditNote) return;
          closeCreditNoteDetailsThen(() => setEmailDialog(true));
        }}
        onWhatsApp={() => {
          if (!selectedCreditNote) return;
          closeCreditNoteDetailsThen(() => setWhatsAppDialog(true));
        }}
        onAttachment={() => {
          if (!selectedCreditNote) return;
          closeCreditNoteDetailsThen(() => setAttachmentDialog(true));
        }}
        onLinkedDocumentOpen={openLinkedDocument}
      />

      <CreditNoteEmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        creditNote={selectedCreditNote}
        scope={scope}
      />

      <CreditNoteWhatsAppDialog
        open={whatsAppDialog}
        onClose={() => setWhatsAppDialog(false)}
        creditNote={selectedCreditNote}
        scope={scope}
      />

      <CreditNoteAttachmentDialog
        open={attachmentDialog}
        onClose={() => setAttachmentDialog(false)}
        creditNote={selectedCreditNote}
        scope={scope}
        onSaved={async () => {
          await refetchCreditNotes();
          if (selectedCreditNote?.id) {
            try {
              const freshCreditNote = await api.creditNote.findOne(selectedCreditNote.id);
              setSelectedCreditNote(freshCreditNote);
            } catch (_error) {}
          }
        }}
      />

      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${creditNoteManager.sequential || `credit-note-${creditNoteManager.id || 'preview'}`}.pdf`}
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
                disabled={!!firmId}
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
              <p className={labelClassName}>{tInvoicing('creditNote.attributes.status')}</p>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {CREDIT_NOTE_STATUS_OPTIONS.map((status) => (
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
                    {creditNoteLabels.referenceFieldLabel}
                  </th>
                  <th className="px-4 py-3.5 font-medium">{partnerLabel}</th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('creditNote.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('creditNote.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && creditNotes.length > 0 ? (
                  creditNotes.map((creditNote) => {
                    const creditNoteId = creditNote.id || 0;
                    const isSelected = creditNoteId > 0 && selectedIds.includes(creditNoteId);
                    const hasUploads = (creditNote.uploads?.length ?? 0) > 0;
                    return (
                      <tr
                        key={creditNoteId || creditNote.sequential}
                        className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                      >
                        <td className="px-4 py-4 align-middle">
                          <Checkbox
                            checked={isSelected}
                            disabled={!creditNoteId}
                            className="border-zinc-400 dark:border-zinc-700"
                            onCheckedChange={(checked) => {
                              if (!creditNoteId) return;
                              setSelectedIds((current) => {
                                if (checked === true) {
                                  return current.includes(creditNoteId)
                                    ? current
                                    : [...current, creditNoteId];
                                }
                                return current.filter((id) => id !== creditNoteId);
                              });
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="text-left font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50"
                              onClick={() => openCreditNoteDetails(creditNote)}
                            >
                              {creditNote.reference || creditNote.sequential || '-'}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {creditNote.date
                                ? format(parseISO(creditNote.date), 'dd MMM yyyy - HH:mm', {
                                    locale: dateLocale
                                  })
                                : '-'}
                            </span>
                            {creditNote.dueDate && (
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('creditNote.attributes.due_date')}:{' '}
                                {format(parseISO(creditNote.dueDate), 'dd MMM yyyy - HH:mm', {
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
                                {creditNote.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {creditNote.interlocutor
                                  ? `${creditNote.interlocutor.surname || ''} ${creditNote.interlocutor.name || ''}`.trim()
                                  : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              getStatusBadgeClassName(creditNote.status)
                            )}
                          >
                            {creditNote.status ? tInvoicing(creditNote.status) : '-'}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right align-middle">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-zinc-950 dark:text-zinc-50">
                              {formatCreditNoteAmount(creditNote, numberLocale)}
                            </span>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {tInvoicing('creditNote.attributes.amount_paid')}:{' '}
                              {Number(creditNote.amountPaid || 0).toLocaleString(numberLocale, {
                                minimumFractionDigits: creditNote.currency?.digitAfterComma ?? 2,
                                maximumFractionDigits: creditNote.currency?.digitAfterComma ?? 2
                              })}{' '}
                              {creditNote.currency?.symbol || ''}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => openCreditNotePreview(creditNote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => {
                                if (!creditNote.id) return;
                                router.push(`${detailPathPrefix}/${creditNote.id}`);
                              }}
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
                                  onClick={() => openCreditNotePreview(creditNote)}
                                >
                                  <Eye className="h-4 w-4" />
                                  {tCommon('commands.preview')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => openCreditNoteDetails(creditNote)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {tInvoicing('creditNote.details.details')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    if (!creditNote.id) return;
                                    router.push(`${detailPathPrefix}/${creditNote.id}`);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    if (!setManagedCreditNote(creditNote)) return;
                                    setDownloadDialog(true);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  {tInvoicing('creditNote.details.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedCreditNote(creditNote);
                                    setEmailDialog(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                  {tInvoicing('creditNote.details.send_email')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedCreditNote(creditNote);
                                    setWhatsAppDialog(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 text-green-500" />
                                  {tInvoicing('creditNote.details.send_whatsapp')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    if (!setManagedCreditNote(creditNote)) return;
                                    setDuplicateDialog(true);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                  {tCommon('commands.duplicate')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2"
                                  onClick={() => {
                                    setSelectedCreditNote(creditNote);
                                    setAttachmentDialog(true);
                                  }}
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {tInvoicing('creditNote.details.manage_attachments')}
                                </DropdownMenuItem>
                                {hasUploads && (
                                  <DropdownMenuItem
                                    className="cursor-pointer gap-2 px-3 py-2"
                                    onClick={() => handleDownloadWithAttachments(creditNote)}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    {tInvoicing('creditNote.action_download_with_attachments')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 px-3 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/50"
                                  onClick={() => {
                                    if (!setManagedCreditNote(creditNote)) return;
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
