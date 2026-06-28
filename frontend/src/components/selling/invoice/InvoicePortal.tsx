import React from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download, FileText, ExternalLink, Mail, MessageCircle, Paperclip, MoreHorizontal, Plus, Search, Settings2, Trash2, Eye, Pencil, PencilLine, User2, X, Trash } from 'lucide-react';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { InvoiceBulkDeleteDialog } from './dialogs/InvoiceBulkDeleteDialog';
import { InvoiceDetailsDialog } from './dialogs/InvoiceDetailsDialog';
import { InvoiceEmailDialog } from './dialogs/InvoiceEmailDialog';
import { InvoiceWhatsAppDialog } from './dialogs/InvoiceWhatsAppDialog';
import { InvoiceAttachmentDialog } from './dialogs/InvoiceAttachmentDialog';
import { api } from '@/api';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { getErrorMessage } from '@/utils/errors';
import { INVOICE_STATUS, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';
import { InvoiceDeleteDialog } from './dialogs/InvoiceDeleteDialog';
import { InvoiceDuplicateDialog } from './dialogs/InvoiceDuplicateDialog';
import { InvoiceDownloadDialog } from './dialogs/InvoiceDownloadDialog';
import { InvoiceActionDialog } from './dialogs/InvoiceActionDialog';
import { useInvoiceManager } from './hooks/useInvoiceManager';
import { useDocumentPortal, FilterDateField, panelClassName, fieldClassName, labelClassName, mutedTextClassName } from '@/features/invoicing/shared/portal';
import { DocumentTemplateSelectionDialog } from '@/features/invoicing/templates/components/DocumentTemplateSelectionDialog';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE, DocumentTemplate } from '@/types/document-template';
interface InvoicePortalProps {
    className?: string;
    firmId?: number;
    interlocutorId?: number;
    scope?: 'selling' | 'buying';
    rootPath?: string;
    listPath?: string;
    newPath?: string;
    detailPathPrefix?: string;
}
const INVOICE_STATUS_OPTIONS: INVOICE_STATUS[] = [
    INVOICE_STATUS.Draft,
    INVOICE_STATUS.Unpaid,
    INVOICE_STATUS.PartiallyPaid,
    INVOICE_STATUS.PartiallySettled,
    INVOICE_STATUS.Settled,
    INVOICE_STATUS.Paid
];
const getStatusBadgeClassName = (status?: INVOICE_STATUS) => {
    switch (status) {
        case INVOICE_STATUS.Paid:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case INVOICE_STATUS.PartiallyPaid:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case INVOICE_STATUS.PartiallySettled:
            return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300';
        case INVOICE_STATUS.Settled:
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
        case INVOICE_STATUS.Unpaid:
            return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300';
        case INVOICE_STATUS.Sent:
        case INVOICE_STATUS.Validated:
        case INVOICE_STATUS.Expired:
            return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300';
        default:
            return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
const formatInvoiceAmount = (amount: number | undefined, digitAfterComma: number | undefined, symbol: string | undefined, localeCode: string) => {
    const digits = digitAfterComma ?? 2;
    const formatted = Number(amount ?? 0).toLocaleString(localeCode, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
    return `${formatted} ${symbol || ''}`.trim();
};
export const InvoicePortal: React.FC<InvoicePortalProps> = ({ className, firmId, interlocutorId, scope = 'selling', rootPath = '/selling', listPath = '/selling/invoices', newPath = '/selling/new-invoice', detailPathPrefix = '/selling/invoice' }) => {
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
    const creditNoteLabels = useScopedDocumentLabels('creditNote', scope);
    const returnNoteLabels = useScopedDocumentLabels('returnNote', scope);
    const tInvoice = invoiceLabels.t;
    const portal = useDocumentPortal<Invoice>({
        entityKey: 'invoices',
        translationKey: invoiceLabels.translationKey,
        apiModule: api.invoice,
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
            'uploads',
            'creditNotes',
            'customerOrder',
            'deliveryNote'
        ],
        firmId,
        interlocutorId
    });
    const { router, tCommon, tInvoicing, dateLocale, numberLocale, activityType, partnerLabel, partnerPlaceholder, allPartnersLabel, setIntro, clearIntro, setRoutes, clearRoutes, setFloating, clearFloating, page, setPage, size, setSize, totalPageCount, totalResultCount, searchTerm, filters, isAdvancedFiltersOpen, setIsAdvancedFiltersOpen, hasActiveFilters, handleFilterChange, handleSearchChange, handleResetFilters, selectedIds, setSelectedIds, pageIds, isAllPageSelected, isPartiallySelected, items: invoices, firms, error, deleteDialog, setDeleteDialog, duplicateDialog, setDuplicateDialog, downloadDialog, setDownloadDialog, removeItem: removeInvoice, duplicateItem: duplicateInvoice, downloadItem: downloadInvoice, previewDialog, previewBlob, loadPreview, closePreviewDialog, isPending: basePending, isDeletePending, isDuplicationPending, isDownloadPending, isPreviewPending, refetchList } = portal;
    const invoiceManager = useInvoiceManager();
    const [deliveryNoteDialog, setDeliveryNoteDialog] = React.useState(false);
    const [creditNoteDialog, setCreditNoteDialog] = React.useState(false);
    const [returnNoteDialog, setReturnNoteDialog] = React.useState(false);
    const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
    const [detailsDialog, setDetailsDialog] = React.useState(false);
    const [detailsInitialTab, setDetailsInitialTab] = React.useState<'payments' | 'linked-documents'>('payments');
    const [emailDialog, setEmailDialog] = React.useState(false);
    const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
    const [attachmentDialog, setAttachmentDialog] = React.useState(false);
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
    const [templateSelectionDialog, setTemplateSelectionDialog] = React.useState(false);
    const [templateTargetInvoice, setTemplateTargetInvoice] = React.useState<Invoice | null>(null);
    const [isResolvingTemplateAction, setIsResolvingTemplateAction] = React.useState(false);
    const [linkedPreviewDialog, setLinkedPreviewDialog] = React.useState(false);
    const [linkedPreviewBlob, setLinkedPreviewBlob] = React.useState<Blob | null>(null);
    const [linkedPreviewFilename, setLinkedPreviewFilename] = React.useState('document-preview.pdf');
    const isSellingInvoiceEditable = React.useCallback((invoice: Invoice) => [INVOICE_STATUS.Draft, INVOICE_STATUS.Unpaid].includes(invoice.status as INVOICE_STATUS), []);
    const hasLinkedCreditNotes = React.useCallback((invoice: Invoice) => !!invoice.creditNotes?.some((creditNote) => creditNote.status !== 'creditNote.status.draft'), []);
    const canTransformToCreditNote = React.useCallback((invoice: Invoice) => invoice.status !== INVOICE_STATUS.Draft && !hasLinkedCreditNotes(invoice), [hasLinkedCreditNotes]);
    const openInvoiceDetails = React.useCallback((invoice: Invoice, initialTab: 'payments' | 'linked-documents' = 'payments') => {
        setSelectedInvoice(invoice);
        setDetailsInitialTab(initialTab);
        setDetailsDialog(true);
    }, []);
    const handleDownloadWithAttachments = React.useCallback(async (invoice: Invoice) => {
        try {
            if (!invoice.id)
                return;
            // Fetch full invoice with all connections and upload data
            const fullInvoice = await api.invoice.findOne(invoice.id);
            // Download Invoice PDF
            await downloadInvoice({ id: invoice.id, template: 'template1' });
            // Small delay and check for attachments
            if (fullInvoice.uploads && fullInvoice.uploads.length > 0) {
                for (const u of fullInvoice.uploads) {
                    if (u.upload?.slug) {
                        // Wait slightly between downloads to avoid browser blocking
                        await new Promise((resolve) => setTimeout(resolve, 800));
                        await api.upload.downloadFile(u.upload.slug, u.upload.filename);
                    }
                }
            }
            toast.success(tInvoice('action_download_success'));
        }
        catch (error: any) {
            toast.error(getErrorMessage('invoicing', error, tInvoice('action_download_failure')));
        }
    }, [downloadInvoice, tInvoice]);
    const handleBulkDownload = React.useCallback(async () => {
        if (selectedIds.length === 0)
            return;
        toast.info(tInvoice('bulk_download_start', { count: selectedIds.length }));
        try {
            // Small delay between downloads to avoid browser blocking
            for (const id of selectedIds) {
                await downloadInvoice({ id, template: 'template1' });
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            toast.success(tInvoice('bulk_download_success'));
        }
        catch (err) {
            toast.error(tInvoice('bulk_download_failure'));
        }
    }, [selectedIds, downloadInvoice, tInvoice]);
    const handleBulkDelete = React.useCallback(async () => {
        if (selectedIds.length === 0)
            return;
        setIsBulkDeleting(true);
        let successCount = 0;
        let failureCount = 0;
        try {
            for (const id of selectedIds) {
                try {
                    await api.invoice.remove(id);
                    successCount++;
                }
                catch (err) {
                    failureCount++;
                }
            }
            if (successCount > 0) {
                toast.success(tInvoice('bulk_remove_success', { count: successCount }));
                refetchList();
                setSelectedIds([]);
            }
            if (failureCount > 0) {
                toast.error(tInvoice('bulk_remove_failure', { count: failureCount }));
            }
        }
        finally {
            setIsBulkDeleting(false);
            setBulkDeleteDialog(false);
        }
    }, [selectedIds, tInvoice, refetchList, setSelectedIds]);
    const { mutate: bulkTransformToCreditNote, isPending: isBulkCreditNotePending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.creditNote.saveFromInvoice(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('transformations.creditNote.success'));
            refetchList();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.creditNote.failure')));
        }
    });
    const { mutate: loadLinkedPreview, isPending: isLinkedPreviewPending } = useMutation({
        mutationFn: async ({ type, id, filename }: {
            type: string;
            id: number;
            filename: string;
        }) => {
            if (type === 'credit-note') {
                const blob = await api.creditNote.preview(id, 'template1');
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
    React.useEffect(() => {
        setIntro?.(invoiceLabels.plural, tInvoice('card_description'));
        setRoutes?.([
            { title: tCommon('menu.selling'), href: rootPath },
            { title: invoiceLabels.plural, href: listPath }
        ]);
        const actions = (<div className="flex items-center gap-2">
        {selectedIds.length > 0 && (<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-md px-5 border-zinc-200 dark:border-zinc-800">
                {tCommon('commands.more_actions')}
                <ChevronDown className="ml-2 h-4 w-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleBulkDownload} className="gap-2">
                <Download className="h-4 w-4"/>
                {tCommon('commands.download_selection', { count: selectedIds.length })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkTransformToCreditNote(selectedIds)} className="gap-2">
                <FileText className="h-4 w-4"/>
                {tInvoice('action_transform_to_credit_note')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkDeleteDialog(true)} className="gap-2 text-rose-600 focus:text-rose-600">
                <Trash className="h-4 w-4"/>
                {tCommon('commands.delete_selection')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>)}
        <Button className="h-11 rounded-md px-5" onClick={() => router.push(newPath)}>
          <Plus className="h-4 w-4"/>
          {tInvoice('add_button_label')}
        </Button>
      </div>);
        setFloating?.(actions);
        return () => {
            clearIntro?.();
            clearRoutes?.();
            clearFloating?.();
        };
    }, [
        listPath,
        router.locale,
        newPath,
        rootPath,
        scope,
        selectedIds.length,
        handleBulkDownload,
        tCommon,
        tInvoice,
        invoiceLabels.plural,
        router
    ]);
    const setManagedInvoice = React.useCallback((invoice: Invoice) => {
        if (!invoice.id)
            return false;
        invoiceManager.set('id', invoice.id);
        invoiceManager.set('sequential', invoiceLabels.displayNumber(invoice));
        invoiceManager.set('status', invoice.status || INVOICE_STATUS.Nonexistent);
        return true;
    }, [invoiceLabels, invoiceManager]);
    const getInvoicePdfFilename = React.useCallback((invoice?: Invoice | null) => {
        if (!invoice?.id)
            return 'invoice.pdf';
        const label = invoiceLabels.displayNumber(invoice) || invoice.sequential || `invoice-${invoice.id}`;
        return `${String(label).replace(/[^a-zA-Z0-9_-]+/g, '-')}.pdf`;
    }, [invoiceLabels]);
    const { mutate: previewInvoiceWithTemplate, isPending: isTemplatePreviewPending } = useMutation({
        mutationFn: async ({ invoice, template }: {
            invoice: Invoice;
            template: DocumentTemplate;
        }) => {
            if (!invoice.id)
                throw new Error('Invoice id is missing');
            const blob = await api.documentTemplate.previewDocumentWithTemplate({
                documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE,
                documentId: invoice.id,
                templateId: template.id
            });
            return { blob, filename: getInvoicePdfFilename(invoice) };
        },
        onSuccess: ({ blob, filename }) => {
            setLinkedPreviewBlob(blob);
            setLinkedPreviewFilename(filename);
            setLinkedPreviewDialog(true);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, 'Unable to preview with this template'));
        }
    });
    const { mutate: downloadInvoiceWithTemplate, isPending: isTemplateDownloadPending } = useMutation({
        mutationFn: async ({ invoice, template }: {
            invoice: Invoice;
            template: DocumentTemplate;
        }) => {
            if (!invoice.id)
                throw new Error('Invoice id is missing');
            await api.documentTemplate.generateDocumentWithTemplate({
                documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE,
                documentId: invoice.id,
                templateId: template.id,
                storeGeneratedDocument: false
            }, getInvoicePdfFilename(invoice));
        },
        onSuccess: () => {
            toast.success(tInvoice('action_download_success'));
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, 'Unable to download with this template'));
        }
    });
    const handleTemplateAction = React.useCallback(async (invoice: Invoice, mode: 'preview' | 'download') => {
        if (!invoice.id)
            return;
        setManagedInvoice(invoice);
        setSelectedInvoice(invoice);
        setIsResolvingTemplateAction(true);
        try {
            const templates = await api.documentTemplate.getAvailableTemplates(DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE);
            if (templates.length === 0) {
                toast.info('No published custom template found. Using the system PDF template.');
                if (mode === 'preview') {
                    loadPreview(invoice.id);
                }
                else {
                    setDownloadDialog(true);
                }
                return;
            }
            if (templates.length === 1) {
                const template = templates[0];
                if (mode === 'preview') {
                    previewInvoiceWithTemplate({ invoice, template });
                }
                else {
                    downloadInvoiceWithTemplate({ invoice, template });
                }
                return;
            }
            setTemplateTargetInvoice(invoice);
            setTemplateSelectionDialog(true);
        }
        catch (error) {
            toast.error(getErrorMessage('invoicing', error as Error, 'Unable to load document templates'));
        }
        finally {
            setIsResolvingTemplateAction(false);
        }
    }, [
        downloadInvoiceWithTemplate,
        loadPreview,
        previewInvoiceWithTemplate,
        setDownloadDialog,
        setManagedInvoice
    ]);
    const { mutate: toDeliveryNote, isPending: isDeliveryNotePending } = useMutation({
        mutationFn: (id: number) => api.deliveryNote.saveFromInvoice(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.deliveryNote.success'));
            router.push(`${rootPath}/delivery-note/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.deliveryNote.failure')));
        }
    });
    const { mutate: toCreditNote, isPending: isCreditNotePending } = useMutation({
        mutationFn: (id: number) => api.creditNote.saveFromInvoice(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.creditNote.success'));
            router.push(`${rootPath}/credit-note/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.creditNote.failure')));
        }
    });
    const { mutate: toReturnNote, isPending: isReturnNotePending } = useMutation({
        mutationFn: (id: number) => api.returnNote.saveFromInvoice(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.returnNote.success'));
            router.push(`${rootPath}/return-note/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.returnNote.failure')));
        }
    });
    const isPending = basePending ||
        isDeliveryNotePending ||
        isCreditNotePending ||
        isReturnNotePending ||
        isBulkCreditNotePending ||
        isResolvingTemplateAction ||
        isTemplatePreviewPending ||
        isTemplateDownloadPending;
    if (error)
        return 'An error has occurred: ' + error.message;
    return (<>
      <InvoiceDeleteDialog id={invoiceManager?.id} sequential={invoiceManager?.sequential || ''} open={deleteDialog} deleteInvoice={() => {
            invoiceManager?.id && removeInvoice(invoiceManager?.id);
        }} isDeletionPending={isDeletePending} onClose={() => setDeleteDialog(false)}/>
      <InvoiceDuplicateDialog id={invoiceManager?.id || 0} sequential={invoiceManager?.sequential || ''} open={duplicateDialog} duplicateInvoice={(includeFiles: boolean) => {
            invoiceManager?.id &&
                duplicateInvoice({
                    id: invoiceManager?.id,
                    includeFiles
                });
        }} isDuplicationPending={isDuplicationPending} onClose={() => setDuplicateDialog(false)}/>
      <InvoiceDownloadDialog id={invoiceManager?.id || 0} open={downloadDialog} downloadInvoice={(template: string) => {
            invoiceManager?.id && downloadInvoice({ id: invoiceManager?.id, template });
        }} isDownloadPending={isDownloadPending} onClose={() => setDownloadDialog(false)}/>

      {templateTargetInvoice?.id ? (<DocumentTemplateSelectionDialog documentType={DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE} documentId={templateTargetInvoice.id} filename={getInvoicePdfFilename(templateTargetInvoice)} open={templateSelectionDialog} onOpenChange={(open) => {
            setTemplateSelectionDialog(open);
            if (!open)
                setTemplateTargetInvoice(null);
        }} onPreviewReady={(blob, filename) => {
            setLinkedPreviewBlob(blob);
            setLinkedPreviewFilename(filename);
            setLinkedPreviewDialog(true);
        }} onUseSystemPreview={() => {
            templateTargetInvoice.id && loadPreview(templateTargetInvoice.id);
        }} onUseSystemDownload={() => {
            if (!templateTargetInvoice || !setManagedInvoice(templateTargetInvoice))
                return;
            setDownloadDialog(true);
        }}/>) : null}

      <InvoiceActionDialog id={invoiceManager?.id} action={`${tCommon('commands.transform_to')} ${deliveryNoteLabels.singular}`} sequential={invoiceManager?.sequential || ''} open={deliveryNoteDialog} callback={() => invoiceManager?.id && toDeliveryNote(invoiceManager.id)} isCallbackPending={isDeliveryNotePending} onClose={() => setDeliveryNoteDialog(false)}/>
      <InvoiceActionDialog id={invoiceManager?.id} action={`${tCommon('commands.transform_to')} ${creditNoteLabels.singular}`} sequential={invoiceManager?.sequential || ''} open={creditNoteDialog} callback={() => invoiceManager?.id && toCreditNote(invoiceManager.id)} isCallbackPending={isCreditNotePending} onClose={() => setCreditNoteDialog(false)}/>
      <InvoiceActionDialog id={invoiceManager?.id} action={`${tCommon('commands.transform_to')} ${returnNoteLabels.singular}`} sequential={invoiceManager?.sequential || ''} open={returnNoteDialog} callback={() => invoiceManager?.id && toReturnNote(invoiceManager.id)} isCallbackPending={isReturnNotePending} onClose={() => setReturnNoteDialog(false)}/>

      <InvoiceBulkDeleteDialog count={selectedIds.length} open={bulkDeleteDialog} onDelete={handleBulkDelete} isPending={isBulkDeleting} onClose={() => setBulkDeleteDialog(false)}/>

      <InvoiceDetailsDialog open={detailsDialog} onClose={() => setDetailsDialog(false)} invoice={selectedInvoice} detailPathPrefix={detailPathPrefix} scope={scope} initialTab={detailsInitialTab} onPreview={() => {
            if (!selectedInvoice)
                return;
            handleTemplateAction(selectedInvoice, 'preview');
        }} onDownload={() => {
            if (!selectedInvoice)
                return;
            handleTemplateAction(selectedInvoice, 'download');
        }} onDuplicate={() => {
            if (!selectedInvoice || !setManagedInvoice(selectedInvoice))
                return;
            setDuplicateDialog(true);
        }} onStatusChange={() => {
            // Implement if needed
        }} onDelete={() => {
            if (!selectedInvoice || !setManagedInvoice(selectedInvoice))
                return;
            setDeleteDialog(true);
        }} onCreditNote={() => {
            if (!selectedInvoice || !setManagedInvoice(selectedInvoice))
                return;
            setCreditNoteDialog(true);
        }} onReturnNote={() => {
            if (!selectedInvoice || !setManagedInvoice(selectedInvoice))
                return;
            setReturnNoteDialog(true);
        }} onEmail={() => {
            if (!selectedInvoice)
                return;
            setEmailDialog(true);
        }} onWhatsApp={() => {
            if (!selectedInvoice)
                return;
            setWhatsAppDialog(true);
        }} onAttachment={() => {
            if (!selectedInvoice)
                return;
            setAttachmentDialog(true);
        }} onDownloadWithAttachments={() => {
            if (!selectedInvoice)
                return;
            handleDownloadWithAttachments(selectedInvoice);
        }} onLinkedDocumentPreview={(type, id) => {
            switch (type) {
                case 'credit-note': {
                    const creditNote = selectedInvoice?.creditNotes?.find((document) => document.id === id);
                    loadLinkedPreview({
                        type,
                        id,
                        filename: `${creditNote?.sequential || `credit-note-${id}`}.pdf`
                    });
                    break;
                }
                case 'quotation':
                    router.push(`${rootPath}/quotation/${id}`);
                    break;
                case 'customer-order':
                    router.push(`${rootPath}/customer-order/${id}`);
                    break;
                case 'delivery-note':
                    router.push(`${rootPath}/delivery-note/${id}`);
                    break;
                case 'invoice':
                    router.push(`${rootPath}/invoice/${id}`);
                    break;
                default:
                    toast.info(`Navigation vers ${type} #${id}`);
            }
        }}/>

      <InvoiceEmailDialog open={emailDialog} onClose={() => setEmailDialog(false)} invoice={selectedInvoice} scope={scope}/>

      <InvoiceWhatsAppDialog open={whatsAppDialog} onClose={() => setWhatsAppDialog(false)} invoice={selectedInvoice} scope={scope}/>

      <InvoiceAttachmentDialog open={attachmentDialog} onClose={() => setAttachmentDialog(false)} invoice={selectedInvoice} scope={scope}/>

      <DocumentPreviewDialog open={previewDialog} loading={isPreviewPending} previewBlob={previewBlob} filename={`${invoiceManager.sequential || `invoice-${invoiceManager.id || 'preview'}`}.pdf`} title={tCommon('commands.preview')} onClose={closePreviewDialog}/>

      <DocumentPreviewDialog open={linkedPreviewDialog} loading={isLinkedPreviewPending} previewBlob={linkedPreviewBlob} filename={linkedPreviewFilename} title={tCommon('commands.preview')} onClose={() => {
            setLinkedPreviewDialog(false);
            setLinkedPreviewBlob(null);
        }}/>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-6 pb-6', className)}>
        <section className={cn(panelClassName, 'p-4')}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_180px_auto]">
            <div className="space-y-2">
              <p className={labelClassName}>{partnerLabel}</p>
              <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)} disabled={!!firmId}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={partnerPlaceholder}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allPartnersLabel}</SelectItem>
                  {firms.map((firm) => (<SelectItem key={firm.id} value={String(firm.id)}>
                      {firm.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <FilterDateField label={tCommon('start_date')} locale={dateLocale} onChange={(value) => handleFilterChange('startDate', value)} placeholder={tCommon('filters.select_date')} value={filters.startDate}/>

            <FilterDateField label={tCommon('end_date')} locale={dateLocale} onChange={(value) => handleFilterChange('endDate', value)} placeholder={tCommon('filters.select_date')} value={filters.endDate}/>

            <div className="space-y-2">
              <p className={labelClassName}>{tInvoice('attributes.status')}</p>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {INVOICE_STATUS_OPTIONS.map((status) => (<SelectItem key={status} value={status}>
                      {tInvoicing(status)}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-end gap-2">
              {hasActiveFilters && (<Button variant="outline" className="h-11 rounded-md px-4" onClick={handleResetFilters}>
                  {tCommon('commands.reset')}
                </Button>)}
              <Button variant="outline" className="h-11 w-14 rounded-md" onClick={() => setIsAdvancedFiltersOpen((current) => !current)}>
                <Settings2 className="h-4 w-4"/>
                {isAdvancedFiltersOpen ? (<ChevronUp className="h-4 w-4"/>) : (<ChevronDown className="h-4 w-4"/>)}
              </Button>
            </div>
          </div>

          {isAdvancedFiltersOpen && (<div className="mt-4 grid gap-4 xl:grid-cols-3">
              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.advanced_search')}</p>
                <div className="relative">
                  <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', mutedTextClassName)}/>
                  <Input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder={tCommon('filters.search_documents')} className={cn(fieldClassName, 'pl-10')}/>
                </div>
              </div>

              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.min_amount')}</p>
                <Input type="number" min="0" step="0.01" value={filters.minTotal} onChange={(event) => handleFilterChange('minTotal', event.target.value)} placeholder="0.00" className={fieldClassName}/>
              </div>

              <div className="space-y-2">
                <p className={labelClassName}>{tCommon('filters.max_amount')}</p>
                <Input type="number" min="0" step="0.01" value={filters.maxTotal} onChange={(event) => handleFilterChange('maxTotal', event.target.value)} placeholder="0.00" className={fieldClassName}/>
              </div>
            </div>)}
        </section>

        {selectedIds.length > 0 && (<div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10">
            <div className="flex items-center gap-4 text-sm font-medium text-primary dark:text-primary-foreground">
              <p>{tCommon('table.items_selected', { count: selectedIds.length })}</p>
              <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setSelectedIds(pageIds)}>
                {tCommon('table.select_all_search_results')}
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedIds([])}>
              <X className="h-4 w-4"/>
            </Button>
          </div>)}

        <section className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col')}>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-200 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  <th className="w-14 px-4 py-3">
                    <Checkbox checked={isPartiallySelected ? 'indeterminate' : isAllPageSelected} disabled={pageIds.length === 0} className="border-zinc-400 dark:border-zinc-700" onCheckedChange={(checked) => {
            if (checked === true) {
                setSelectedIds(pageIds);
                return;
            }
            setSelectedIds([]);
        }}/>
                  </th>
                  <th className="px-4 py-3 font-medium">{tInvoice('attributes.number')}</th>
                  <th className="px-4 py-3 font-medium">{tInvoice('attributes.customer')}</th>
                  <th className="px-4 py-3 font-medium">{tInvoice('attributes.status')}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {tInvoice('attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && invoices.length > 0 ? (invoices.map((invoice) => {
            const invoiceId = invoice.id || 0;
            const isSelected = invoiceId > 0 && selectedIds.includes(invoiceId);
            const digits = invoice.currency?.digitAfterComma;
            const symbol = invoice.currency?.symbol;
            return (<tr key={invoiceId || invoice.sequential} className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-200/40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/80">
                        <td className="px-4 py-3 align-middle">
                          <Checkbox checked={isSelected} disabled={!invoiceId} className="border-zinc-400 dark:border-zinc-700" onCheckedChange={(checked) => {
                    if (!invoiceId)
                        return;
                    setSelectedIds((current) => {
                        if (checked === true) {
                            return current.includes(invoiceId)
                                ? current
                                : [...current, invoiceId];
                        }
                        return current.filter((id) => id !== invoiceId);
                    });
                }}/>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <button type="button" className="font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50 text-left" onClick={() => router.push(`${detailPathPrefix}/${invoice.id}`)}>
                              {invoiceLabels.displayNumber(invoice)}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {invoice.date
                    ? format(parseISO(invoice.date), 'dd MMM yyyy - HH:mm', {
                        locale: dateLocale
                    })
                    : '-'}
                            </span>
                            {invoice.dueDate && (<span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoice('attributes.due_date')}:{' '}
                                {format(parseISO(invoice.dueDate), 'dd MMM yyyy - HH:mm', {
                        locale: dateLocale
                    })}
                              </span>)}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <User2 className={cn('h-4 w-4 shrink-0', mutedTextClassName)}/>
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {invoice.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {invoice.interlocutor
                    ? `${invoice.interlocutor.surname || ''} ${invoice.interlocutor.name || ''}`.trim()
                    : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', getStatusBadgeClassName(invoice.status))}>
                              {invoice.status ? tInvoicing(invoice.status) : '-'}
                            </span>
                            {hasLinkedCreditNotes(invoice) && (<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500"/>)}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right align-middle">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-zinc-950 dark:text-zinc-50">
                              {formatInvoiceAmount(invoice.total, digits, symbol, numberLocale)}
                            </span>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {tInvoice('attributes.amount_paid')}:{' '}
                              {formatInvoiceAmount(invoice.amountPaid, digits, symbol, numberLocale)}
                            </span>
                            {(invoice.amountSettled || 0) > 0 && (<span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoice('attributes.amount_settled')}:{' '}
                                {formatInvoiceAmount(invoice.amountSettled, digits, symbol, numberLocale)}
                              </span>)}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(isSellingInvoiceEditable(invoice)) && (<>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => {
                        if (!setManagedInvoice(invoice))
                            return;
                        invoice.id && loadPreview(invoice.id);
                    }}>
                                  <Eye className="h-4 w-4"/>
                                </Button>
                                {isSellingInvoiceEditable(invoice) && (<Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => router.push(`${detailPathPrefix}/${invoice.id}`)}>
                                    <PencilLine className="h-4 w-4"/>
                                  </Button>)}
                              </>)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
                                  <MoreHorizontal className="h-4 w-4"/>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 p-1">
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    if (!setManagedInvoice(invoice))
                        return;
                    invoice.id && loadPreview(invoice.id);
                }}>
                                  <Eye className="h-4 w-4"/> {tCommon('commands.preview')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    openInvoiceDetails(invoice, 'payments');
                }}>
                                  <ExternalLink className="h-4 w-4"/> {tInvoice('details.details')}
                                </DropdownMenuItem>
                                {isSellingInvoiceEditable(invoice) && (<DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => router.push(`${detailPathPrefix}/${invoice.id}`)}>
                                    <Pencil className="h-4 w-4"/> {tCommon('commands.edit')}
                                  </DropdownMenuItem>)}
                                {canTransformToCreditNote(invoice) && (<DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                        if (!setManagedInvoice(invoice))
                            return;
                        setCreditNoteDialog(true);
                    }}>
                                    <FileText className="h-4 w-4"/>{' '}
                                    {tInvoice('action_transform_to_credit_note')}
                                  </DropdownMenuItem>)}
                                {hasLinkedCreditNotes(invoice) && (<DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => openInvoiceDetails(invoice, 'linked-documents')}>
                                    <ExternalLink className="h-4 w-4"/>{' '}
                                    {tInvoice('action_view_credit_note') || "Voir l'Avoir"}
                                  </DropdownMenuItem>)}
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    if (!setManagedInvoice(invoice))
                        return;
                    setDownloadDialog(true);
                }}>
                                  <Download className="h-4 w-4"/>{' '}
                                  {tInvoice('attributes.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    setSelectedInvoice(invoice);
                    setEmailDialog(true);
                }}>
                                  <Mail className="h-4 w-4"/> {tInvoice('action_email')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    setSelectedInvoice(invoice);
                    setWhatsAppDialog(true);
                }}>
                                  <MessageCircle className="h-4 w-4 text-green-500"/>{' '}
                                  {tInvoice('action_whatsapp')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    if (!setManagedInvoice(invoice))
                        return;
                    setDuplicateDialog(true);
                }}>
                                  <Copy className="h-4 w-4"/> {tCommon('commands.duplicate')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    setSelectedInvoice(invoice);
                    setAttachmentDialog(true);
                }}>
                                  <Paperclip className="h-4 w-4"/> {tInvoice('action_attachments')}
                                </DropdownMenuItem>
                                {invoice.uploads && invoice.uploads.length > 0 && (<DropdownMenuItem onClick={() => handleDownloadWithAttachments(invoice)} className="gap-2 px-3 py-2 cursor-pointer">
                                    <Paperclip className="h-4 w-4"/>
                                    {tInvoice('action_download_with_attachments')}
                                  </DropdownMenuItem>)}
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50" onClick={() => {
                    if (!setManagedInvoice(invoice))
                        return;
                    setDeleteDialog(true);
                }}>
                                  <Trash2 className="h-4 w-4"/> {tCommon('commands.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>);
        })) : (<tr>
                    <td colSpan={6} className="h-105 px-4 py-10 text-center">
                      <div className={cn('flex h-full flex-col items-center justify-center gap-3', mutedTextClassName)}>
                        {isPending ? (<>
                            <Spinner />
                            <p>{tCommon('table.loading')}</p>
                          </>) : (<p className="text-base">{tCommon('table.no_results_found')}</p>)}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {tCommon('table.lines')}
                </span>
                <Select value={String(size)} onValueChange={(value) => {
            setPage(1);
            setSize(Number(value));
        }}>
                  <SelectTrigger className="h-10 w-23 rounded-md border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((option) => (<SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>))}
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
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-md" onClick={() => setPage(page - 1)} disabled={page <= 1 || totalPageCount === 0}>
                <ChevronLeft className="h-4 w-4"/>
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-md" onClick={() => setPage(page + 1)} disabled={page >= totalPageCount || totalPageCount === 0}>
                <ChevronRight className="h-4 w-4"/>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>);
};
