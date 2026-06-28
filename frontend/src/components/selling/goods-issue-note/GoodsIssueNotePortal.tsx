import React from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
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
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { GOODS_ISSUE_NOTE_STATUS, GoodsIssueNote } from '@/types';
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
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { cn } from '@/lib/utils';
import { GoodsIssueNoteDeleteDialog } from './dialogs/GoodsIssueNoteDeleteDialog';
import { GoodsIssueNoteDuplicateDialog } from './dialogs/GoodsIssueNoteDuplicateDialog';
import { GoodsIssueNoteDownloadDialog } from './dialogs/GoodsIssueNoteDownloadDialog';
import { GoodsIssueNoteBulkDeleteDialog } from './dialogs/GoodsIssueNoteBulkDeleteDialog';
import { GoodsIssueNoteStatusDialog } from './dialogs/GoodsIssueNoteStatusDialog';
import { GoodsIssueNoteDetailsDialog } from './dialogs/GoodsIssueNoteDetailsDialog';
import { GoodsIssueNoteEmailDialog } from './dialogs/GoodsIssueNoteEmailDialog';
import { GoodsIssueNoteWhatsAppDialog } from './dialogs/GoodsIssueNoteWhatsAppDialog';
import { GoodsIssueNoteAttachmentDialog } from './dialogs/GoodsIssueNoteAttachmentDialog';
import { useGoodsIssueNoteManager } from './hooks/useGoodsIssueNoteManager';
import {
  useDocumentPortal,
  FilterDateField,
  panelClassName,
  fieldClassName,
  labelClassName,
  mutedTextClassName
} from '@/features/invoicing/shared/portal';
interface GoodsIssueNotePortalProps {
  className?: string;
  listPath?: string;
  newPath?: string;
  rootPath?: string;
  scope?: 'selling' | 'buying';
  detailPathPrefix?: string;
}
const GOODS_ISSUE_NOTE_STATUS_OPTIONS: GOODS_ISSUE_NOTE_STATUS[] = [
  GOODS_ISSUE_NOTE_STATUS.Draft,
  GOODS_ISSUE_NOTE_STATUS.Created,
  GOODS_ISSUE_NOTE_STATUS.Issued,
  GOODS_ISSUE_NOTE_STATUS.Cancelled
];
const getStatusBadgeClassName = (status?: GOODS_ISSUE_NOTE_STATUS) => {
  switch (status) {
    case GOODS_ISSUE_NOTE_STATUS.Issued:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case GOODS_ISSUE_NOTE_STATUS.Created:
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
    case GOODS_ISSUE_NOTE_STATUS.Cancelled:
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
    case GOODS_ISSUE_NOTE_STATUS.Draft:
    default:
      return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
  }
};
const formatGoodsIssueNoteAmount = (goodsIssueNote: GoodsIssueNote, localeCode: string) => {
  const digits = goodsIssueNote.currency?.digitAfterComma ?? 2;
  const amount = Number(goodsIssueNote.total ?? 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${amount} ${goodsIssueNote.currency?.symbol || ''}`.trim();
};
export const GoodsIssueNotePortal: React.FC<GoodsIssueNotePortalProps> = ({
  className,
  scope = 'selling',
  rootPath = '/selling',
  listPath = '/selling/goods-issue-notes',
  newPath = '/selling/new-goods-issue-note',
  detailPathPrefix = '/selling/goods-issue-note'
}) => {
  const portal = useDocumentPortal<GoodsIssueNote>({
    entityKey: 'goodsIssueNotes',
    translationKey: 'goodsIssueNote',
    apiModule: api.goodsIssueNote,
    scope,
    rootPath,
    listPath,
    newPath,
    detailPathPrefix,
    defaultRelations: [
      'firm',
      'interlocutor',
      'currency',
      'goodsIssueNoteMetaData',
      'uploads',
      'uploads.upload'
    ]
  });
  const {
    router,
    tCommon,
    tInvoicing,
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
    items: goodsIssueNotes,
    firms,
    error,
    refetchList: refetchGoodsIssueNotes,
    deleteDialog,
    setDeleteDialog,
    duplicateDialog,
    setDuplicateDialog,
    downloadDialog,
    setDownloadDialog,
    previewDialog,
    previewBlob,
    closePreviewDialog,
    removeItem: removeGoodsIssueNoteItem,
    duplicateItem: duplicateGoodsIssueNoteItem,
    downloadItem: downloadGoodsIssueNoteItem,
    loadPreview,
    isPending: basePending,
    isDeletePending,
    isDuplicationPending,
    isDownloadPending,
    isPreviewPending
  } = portal;
  const goodsIssueNoteManager = useGoodsIssueNoteManager();
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [statusDialog, setStatusDialog] = React.useState(false);
  const [detailsDialog, setDetailsDialog] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState(false);
  const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
  const [attachmentDialog, setAttachmentDialog] = React.useState(false);
  const [selectedGoodsIssueNote, setSelectedGoodsIssueNote] = React.useState<GoodsIssueNote | null>(
    null
  );
  const [previewFilename, setPreviewFilename] = React.useState('document-preview.pdf');
  const [linkedPreviewDialog, setLinkedPreviewDialog] = React.useState(false);
  const [linkedPreviewBlob, setLinkedPreviewBlob] = React.useState<Blob | null>(null);
  const setManagedGoodsIssueNote = React.useCallback(
    (goodsIssueNote: GoodsIssueNote) => {
      if (!goodsIssueNote.id) return false;
      goodsIssueNoteManager.set('id', goodsIssueNote.id);
      goodsIssueNoteManager.set('sequential', goodsIssueNote.sequential || '');
      goodsIssueNoteManager.set(
        'status',
        goodsIssueNote.status || GOODS_ISSUE_NOTE_STATUS.Nonexistent
      );
      return true;
    },
    [goodsIssueNoteManager]
  );
  const openGoodsIssueNoteDetails = React.useCallback((goodsIssueNote: GoodsIssueNote) => {
    setSelectedGoodsIssueNote(goodsIssueNote);
    setDetailsDialog(true);
    if (goodsIssueNote.id) {
      void api.goodsIssueNote
        .findOne(goodsIssueNote.id)
        .then((freshGoodsIssueNote) => {
          setSelectedGoodsIssueNote((current) =>
            current?.id === freshGoodsIssueNote.id ? freshGoodsIssueNote : current
          );
        })
        .catch(() => {});
    }
  }, []);
  const openGoodsIssueNotePreview = React.useCallback(
    (goodsIssueNote: GoodsIssueNote) => {
      if (!goodsIssueNote.id || !setManagedGoodsIssueNote(goodsIssueNote)) return;
      setSelectedGoodsIssueNote(goodsIssueNote);
      setPreviewFilename(
        `${goodsIssueNote.sequential || `goods-issue-note-${goodsIssueNote.id}`}.pdf`
      );
      setLinkedPreviewDialog(false);
      setLinkedPreviewBlob(null);
      loadPreview(goodsIssueNote.id);
    },
    [loadPreview, setManagedGoodsIssueNote]
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
  const closeGoodsIssueNoteDetailsThen = React.useCallback(
    (callback: () => void) => runAfterOverlayClose(() => setDetailsDialog(false), callback),
    [runAfterOverlayClose]
  );
  const closeDocumentPreviewDialog = React.useCallback(() => {
    closePreviewDialog();
    setLinkedPreviewDialog(false);
    setLinkedPreviewBlob(null);
  }, [closePreviewDialog]);
  const { mutate: loadInvoicePreview, isPending: isInvoicePreviewPending } = useMutation({
    mutationFn: (id: number) => api.invoice.preview(id, 'template1'),
    onSuccess: (blob) => {
      setLinkedPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_preview_failure'))
      );
      closeDocumentPreviewDialog();
    }
  });
  const openLinkedDocumentPreview = React.useCallback(
    (type: string, id: number) => {
      if (type !== 'invoice') return;
      const invoice = selectedGoodsIssueNote?.invoices?.find((document) => document.id === id);
      setPreviewFilename(`${invoice?.sequential || `invoice-${id}`}.pdf`);
      closePreviewDialog();
      setLinkedPreviewBlob(null);
      setLinkedPreviewDialog(true);
      loadInvoicePreview(id);
    },
    [closePreviewDialog, loadInvoicePreview, selectedGoodsIssueNote]
  );
  const handleBulkDownload = React.useCallback(async () => {
    if (selectedIds.length === 0) return;
    toast.info(tInvoicing('goodsIssueNote.bulk_download_start', { count: selectedIds.length }));
    try {
      for (const id of selectedIds) {
        await api.goodsIssueNote.download(id, 'template1');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success(tInvoicing('goodsIssueNote.bulk_download_success'));
    } catch (_error) {
      toast.error(tInvoicing('goodsIssueNote.bulk_download_failure'));
    }
  }, [selectedIds, tInvoicing]);
  const handleDownloadWithAttachments = React.useCallback(
    async (goodsIssueNote: GoodsIssueNote) => {
      try {
        if (!goodsIssueNote.id) return;
        const fullGoodsIssueNote = await api.goodsIssueNote.findOne(goodsIssueNote.id);
        await api.goodsIssueNote.download(goodsIssueNote.id, 'template1');
        if (fullGoodsIssueNote.uploads?.length) {
          for (const upload of fullGoodsIssueNote.uploads) {
            if (upload.upload?.slug) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              await api.upload.downloadFile(upload.upload.slug, upload.upload.filename);
            }
          }
        }
        toast.success(tInvoicing('goodsIssueNote.action_download_success'));
      } catch (error) {
        toast.error(
          getErrorMessage(
            'invoicing',
            error as Error,
            tInvoicing('goodsIssueNote.action_download_failure')
          )
        );
      }
    },
    [tInvoicing]
  );
  const { mutate: updateStatus, isPending: isUpdateStatusPending } = useMutation({
    mutationFn: (data: { id: number; status: GOODS_ISSUE_NOTE_STATUS }) =>
      api.goodsIssueNote.updateStatus(data.id, data.status),
    onSuccess: async (data) => {
      toast.success(tInvoicing('goodsIssueNote.action_update_success'));
      setStatusDialog(false);
      setSelectedGoodsIssueNote((current) => (current?.id === data.id ? data : current));
      goodsIssueNoteManager.set('status', data.status || GOODS_ISSUE_NOTE_STATUS.Nonexistent);
      await refetchGoodsIssueNotes();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage(
          'invoicing',
          mutationError,
          tInvoicing('goodsIssueNote.action_update_failure')
        )
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
          await api.goodsIssueNote.remove(id);
          successCount++;
        } catch (_error) {
          failureCount++;
        }
      }
      if (successCount > 0) {
        toast.success(tInvoicing('goodsIssueNote.bulk_remove_success', { count: successCount }));
        await refetchGoodsIssueNotes();
        setSelectedIds([]);
      }
      if (failureCount > 0) {
        toast.error(tInvoicing('goodsIssueNote.bulk_remove_failure', { count: failureCount }));
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialog(false);
    }
  }, [refetchGoodsIssueNotes, selectedIds, setSelectedIds, tInvoicing]);
  React.useEffect(() => {
    setIntro?.(tInvoicing('goodsIssueNote.plural'), tInvoicing('goodsIssueNote.card_description'));
    setRoutes?.([
      { title: tCommon('menu.selling'), href: rootPath },
      { title: tInvoicing('goodsIssueNote.plural'), href: listPath }
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
          {tInvoicing('goodsIssueNote.add_button_label')}
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
  const isPending = basePending || isUpdateStatusPending;
  if (error) return 'An error has occurred: ' + error.message;
  return (
    <>
      <GoodsIssueNoteBulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteDialog}
        onDelete={handleBulkDelete}
        isPending={isBulkDeleting}
        onClose={() => setBulkDeleteDialog(false)}
      />

      <GoodsIssueNoteDeleteDialog
        id={goodsIssueNoteManager?.id}
        sequential={goodsIssueNoteManager?.sequential || ''}
        open={deleteDialog}
        deleteGoodsIssueNote={() => {
          goodsIssueNoteManager?.id && removeGoodsIssueNoteItem(goodsIssueNoteManager.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />

      <GoodsIssueNoteDuplicateDialog
        id={goodsIssueNoteManager?.id || 0}
        sequential={goodsIssueNoteManager?.sequential || ''}
        open={duplicateDialog}
        duplicateGoodsIssueNote={(includeFiles: boolean) => {
          goodsIssueNoteManager?.id &&
            duplicateGoodsIssueNoteItem({
              id: goodsIssueNoteManager.id,
              includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />

      <GoodsIssueNoteDownloadDialog
        id={goodsIssueNoteManager?.id || 0}
        open={downloadDialog}
        downloadGoodsIssueNote={(template: string) => {
          goodsIssueNoteManager?.id &&
            downloadGoodsIssueNoteItem({ id: goodsIssueNoteManager.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />

      <GoodsIssueNoteStatusDialog
        open={statusDialog}
        goodsIssueNote={selectedGoodsIssueNote}
        isPending={isUpdateStatusPending}
        callback={(status) => {
          if (selectedGoodsIssueNote?.id) {
            updateStatus({ id: selectedGoodsIssueNote.id, status });
          }
        }}
        onClose={() => setStatusDialog(false)}
      />

      <GoodsIssueNoteDetailsDialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        goodsIssueNote={selectedGoodsIssueNote}
        detailPathPrefix={detailPathPrefix}
        onPreview={() => {
          if (!selectedGoodsIssueNote) return;
          closeGoodsIssueNoteDetailsThen(() => openGoodsIssueNotePreview(selectedGoodsIssueNote));
        }}
        onDownload={() => {
          if (!selectedGoodsIssueNote || !setManagedGoodsIssueNote(selectedGoodsIssueNote)) return;
          closeGoodsIssueNoteDetailsThen(() => setDownloadDialog(true));
        }}
        onDownloadWithAttachments={
          selectedGoodsIssueNote?.uploads?.length
            ? () => {
                if (!selectedGoodsIssueNote) return;
                closeGoodsIssueNoteDetailsThen(() =>
                  handleDownloadWithAttachments(selectedGoodsIssueNote)
                );
              }
            : undefined
        }
        onDuplicate={() => {
          if (!selectedGoodsIssueNote || !setManagedGoodsIssueNote(selectedGoodsIssueNote)) return;
          closeGoodsIssueNoteDetailsThen(() => setDuplicateDialog(true));
        }}
        onStatusChange={() => {
          if (!selectedGoodsIssueNote) return;
          closeGoodsIssueNoteDetailsThen(() => setStatusDialog(true));
        }}
        onDelete={() => {
          if (!selectedGoodsIssueNote || !setManagedGoodsIssueNote(selectedGoodsIssueNote)) return;
          closeGoodsIssueNoteDetailsThen(() => setDeleteDialog(true));
        }}
        onEmail={() => {
          if (!selectedGoodsIssueNote) return;
          closeGoodsIssueNoteDetailsThen(() => setEmailDialog(true));
        }}
        onWhatsApp={() => {
          if (!selectedGoodsIssueNote) return;
          closeGoodsIssueNoteDetailsThen(() => setWhatsAppDialog(true));
        }}
        onAttachment={() => {
          if (!selectedGoodsIssueNote) return;
          closeGoodsIssueNoteDetailsThen(() => setAttachmentDialog(true));
        }}
        onLinkedDocumentPreview={openLinkedDocumentPreview}
      />

      <GoodsIssueNoteEmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        goodsIssueNote={selectedGoodsIssueNote}
      />

      <GoodsIssueNoteWhatsAppDialog
        open={whatsAppDialog}
        onClose={() => setWhatsAppDialog(false)}
        goodsIssueNote={selectedGoodsIssueNote}
      />

      <GoodsIssueNoteAttachmentDialog
        open={attachmentDialog}
        onClose={() => setAttachmentDialog(false)}
        goodsIssueNote={selectedGoodsIssueNote}
        onSaved={async () => {
          await refetchGoodsIssueNotes();
          if (selectedGoodsIssueNote?.id) {
            try {
              const freshGoodsIssueNote = await api.goodsIssueNote.findOne(
                selectedGoodsIssueNote.id
              );
              setSelectedGoodsIssueNote(freshGoodsIssueNote);
            } catch (_error) {}
          }
        }}
      />

      <DocumentPreviewDialog
        open={previewDialog || linkedPreviewDialog}
        loading={linkedPreviewDialog ? isInvoicePreviewPending : isPreviewPending}
        previewBlob={linkedPreviewDialog ? linkedPreviewBlob : previewBlob}
        filename={previewFilename}
        title={tCommon('commands.preview')}
        onClose={closeDocumentPreviewDialog}
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
              <p className={labelClassName}>{tInvoicing('goodsIssueNote.attributes.status')}</p>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {GOODS_ISSUE_NOTE_STATUS_OPTIONS.map((status) => (
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
                    {tInvoicing('goodsIssueNote.attributes.number')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">{partnerLabel}</th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('goodsIssueNote.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('goodsIssueNote.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && goodsIssueNotes.length > 0 ? (
                  goodsIssueNotes.map((goodsIssueNote) => {
                    const goodsIssueNoteId = goodsIssueNote.id || 0;
                    const isSelected =
                      goodsIssueNoteId > 0 && selectedIds.includes(goodsIssueNoteId);
                    const hasUploads = (goodsIssueNote.uploads?.length ?? 0) > 0;
                    const arePricesHidden =
                      goodsIssueNote.goodsIssueNoteMetaData?.showPrices === false;
                    return (
                      <tr
                        key={goodsIssueNoteId || goodsIssueNote.sequential}
                        className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                      >
                        <td className="px-4 py-4 align-middle">
                          <Checkbox
                            checked={isSelected}
                            disabled={!goodsIssueNoteId}
                            className="border-zinc-400 dark:border-zinc-700"
                            onCheckedChange={(checked) => {
                              if (!goodsIssueNoteId) return;
                              if (checked === true) {
                                setSelectedIds((current) =>
                                  current.includes(goodsIssueNoteId)
                                    ? current
                                    : [...current, goodsIssueNoteId]
                                );
                                return;
                              }
                              setSelectedIds((current) =>
                                current.filter((id) => id !== goodsIssueNoteId)
                              );
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {goodsIssueNote.sequential || '-'}
                            </span>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {goodsIssueNote.date
                                ? format(parseISO(goodsIssueNote.date), 'dd MMM. yyyy - HH:mm', {
                                    locale: dateLocale
                                  })
                                : tInvoicing('goodsIssueNote.attributes.no_date')}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <User2 className={cn('h-4 w-4 shrink-0', mutedTextClassName)} />
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {goodsIssueNote.firm?.name ||
                                  tInvoicing('goodsIssueNote.details.walk_in_customer', {
                                    defaultValue: 'Client passager'
                                  })}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {goodsIssueNote.interlocutor
                                  ? `${goodsIssueNote.interlocutor.surname || ''} ${goodsIssueNote.interlocutor.name || ''}`.trim()
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
                                getStatusBadgeClassName(goodsIssueNote.status)
                              )}
                            >
                              {goodsIssueNote.status ? tInvoicing(goodsIssueNote.status) : '-'}
                            </span>

                            {goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.Issued && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right align-middle font-medium text-zinc-950 dark:text-zinc-50">
                          {arePricesHidden ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                              <EyeOff className="h-3.5 w-3.5" />
                              {tInvoicing('goodsIssueNote.prices_hidden', {
                                defaultValue: 'Prix masqués'
                              })}
                            </span>
                          ) : (
                            formatGoodsIssueNoteAmount(goodsIssueNote, numberLocale)
                          )}
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => openGoodsIssueNotePreview(goodsIssueNote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => {
                                if (goodsIssueNote.id) {
                                  router.push(`${detailPathPrefix}/${goodsIssueNote.id}`);
                                }
                              }}
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                              onClick={() => {
                                setSelectedGoodsIssueNote(goodsIssueNote);
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
                                  onClick={() => openGoodsIssueNotePreview(goodsIssueNote)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {tCommon('commands.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openGoodsIssueNoteDetails(goodsIssueNote)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (goodsIssueNote.id) {
                                      router.push(`${detailPathPrefix}/${goodsIssueNote.id}`);
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!setManagedGoodsIssueNote(goodsIssueNote)) return;
                                    setDownloadDialog(true);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {tCommon('commands.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoodsIssueNote(goodsIssueNote);
                                    setEmailDialog(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  {tInvoicing('goodsIssueNote.details.send_email', {
                                    defaultValue: 'Envoyer par email'
                                  })}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoodsIssueNote(goodsIssueNote);
                                    setWhatsAppDialog(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                                  {tInvoicing('goodsIssueNote.details.send_whatsapp', {
                                    defaultValue: 'Envoyer par WhatsApp'
                                  })}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoodsIssueNote(goodsIssueNote);
                                    blurActiveElement();
                                    setStatusDialog(true);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {tCommon('actions.changeStatus')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!setManagedGoodsIssueNote(goodsIssueNote)) return;
                                    setDuplicateDialog(true);
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  {tCommon('commands.duplicate')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoodsIssueNote(goodsIssueNote);
                                    setAttachmentDialog(true);
                                  }}
                                >
                                  <Paperclip className="h-4 w-4 mr-2" />
                                  {tCommon('actions.manageAttachments')}
                                </DropdownMenuItem>
                                {hasUploads && (
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadWithAttachments(goodsIssueNote)}
                                  >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    {tCommon('commands.download_with_attachments')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                                  onClick={() => {
                                    if (!setManagedGoodsIssueNote(goodsIssueNote)) return;
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2 text-rose-600" />
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
