import React from 'react';
import { format, parseISO, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download, Eye, FileText, PencilLine, MoreHorizontal, Plus, Receipt, RefreshCw, Search, Settings2, Trash2, User2, ExternalLink, Edit, ShoppingCart, Truck, Mail, MessageCircle, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useDebounce } from '@/hooks/other/useDebounce';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import { QuotationDuplicateDialog } from './dialogs/QuotationDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { QuotationDeleteDialog } from './dialogs/QuotationDeleteDialog';
import { QuotationDownloadDialog } from './dialogs/QuotationDownloadDialog';
import { useQuotationManager } from './hooks/useQuotationManager';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { ACTIVITY_TYPE, DuplicateQuotationDto, QUOTATION_STATUS, Quotation, INVOICE_STATUS, DELIVERY_NOTE_STATUS, CUSTOMER_ORDER_STATUS } from '@/types';
import { QuotationInvoiceDialog } from './dialogs/QuotationInvoiceDialog';
import { QuotationActionDialog } from './dialogs/QuotationActionDialog';
import { QuotationStatusDialog } from './dialogs/QuotationStatusDialog';
import { QuotationDetailsDialog } from './dialogs/QuotationDetailsDialog';
import { QuotationEmailDialog } from './dialogs/QuotationEmailDialog';
import { QuotationWhatsAppDialog } from './dialogs/QuotationWhatsAppDialog';
import { QuotationAttachmentDialog } from './dialogs/QuotationAttachmentDialog';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';
interface QuotationMainProps {
    className?: string;
    listPath?: string;
    newPath?: string;
    rootPath?: string;
    scope?: 'selling' | 'buying';
    detailPathPrefix?: string;
    linkedInvoicePathPrefix?: string;
    linkedDeliveryNotePathPrefix?: string;
    linkedCustomerOrderPathPrefix?: string;
}
interface QuotationFilters {
    clientId: string;
    status: string;
    startDate: string;
    endDate: string;
    minTotal: string;
    maxTotal: string;
}
interface FilterDateFieldProps {
    label: string;
    locale: Locale;
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
}
const INITIAL_FILTERS: QuotationFilters = {
    clientId: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    minTotal: '',
    maxTotal: ''
};
const panelClassName = 'rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
const fieldClassName = 'h-10 rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const textClassName = 'text-zinc-700 dark:text-zinc-300';
const mutedTextClassName = 'text-zinc-500 dark:text-zinc-400';
const QUOTATION_STATUS_OPTIONS: QUOTATION_STATUS[] = [
    QUOTATION_STATUS.Draft,
    QUOTATION_STATUS.Created,
    QUOTATION_STATUS.Accepted,
    QUOTATION_STATUS.Rejected
];
function FilterDateField({ label, locale, onChange, placeholder, value }: FilterDateFieldProps) {
    const selectedDate = value ? parseISO(value) : undefined;
    return (<div className="space-y-2">
      <p className={labelClassName}>{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn('flex w-full items-center gap-3 px-3 text-left text-sm transition hover:border-zinc-300 dark:hover:border-zinc-700', fieldClassName, !value ? 'text-zinc-400 dark:text-zinc-500' : textClassName)}>
            <Calendar className={cn('h-4 w-4', mutedTextClassName)}/>
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker locale={locale} mode="single" selected={selectedDate} defaultMonth={selectedDate} onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : '');
        }} initialFocus/>
        </PopoverContent>
      </Popover>
    </div>);
}
const getStatusBadgeClassName = (status?: QUOTATION_STATUS) => {
    switch (status) {
        case QUOTATION_STATUS.Accepted:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case QUOTATION_STATUS.Validated:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case QUOTATION_STATUS.Sent:
            return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
        case QUOTATION_STATUS.Rejected:
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
        case QUOTATION_STATUS.Invoiced:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        case QUOTATION_STATUS.Expired:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
        default:
            return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
const formatQuotationAmount = (quotation: Quotation, localeCode: string) => {
    const digits = quotation.currency?.digitAfterComma ?? 2;
    const amount = Number(quotation.total ?? 0).toLocaleString(localeCode, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
    return `${amount} ${quotation.currency?.symbol || ''}`.trim();
};
export const QuotationPortal: React.FC<QuotationMainProps> = ({ className, scope = 'selling', rootPath = '/selling', listPath = '/selling/quotations', newPath = '/selling/new-quotation', detailPathPrefix = '/selling/quotation', linkedInvoicePathPrefix = '/selling/invoice', linkedDeliveryNotePathPrefix = '/selling/delivery-note', linkedCustomerOrderPathPrefix = '/selling/customer-order' }) => {
    const router = useRouter();
    const guardedNavigation = useGuardedNavigation();
    const { t: tCommon, ready: commonReady, i18n } = useTranslation('common');
    const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true });
    const quotationManager = useQuotationManager();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const activityType = ACTIVITY_TYPE.SELLING;
    const partnerLabel = tInvoicing('quotation.attributes.customer');
    const partnerPlaceholder = tCommon('filters.select_customer');
    const allPartnersLabel = tCommon('filters.all_customers');
    const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
    const { setRoutes, clearRoutes } = useBreadcrumb();
    const [page, setPage] = React.useState(1);
    const [size, setSize] = React.useState(20);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState<QuotationFilters>(INITIAL_FILTERS);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [deleteDialog, setDeleteDialog] = React.useState(false);
    const [duplicateDialog, setDuplicateDialog] = React.useState(false);
    const [downloadDialog, setDownloadDialog] = React.useState(false);
    const [invoiceDialog, setInvoiceDialog] = React.useState(false);
    const [deliveryNoteDialog, setDeliveryNoteDialog] = React.useState(false);
    const [goodsIssueNoteDialog, setGoodsIssueNoteDialog] = React.useState(false);
    const [customerOrderDialog, setCustomerOrderDialog] = React.useState(false);
    const [statusDialog, setStatusDialog] = React.useState(false);
    const [previewDialog, setPreviewDialog] = React.useState(false);
    const [detailsDialog, setDetailsDialog] = React.useState(false);
    const [emailDialog, setEmailDialog] = React.useState(false);
    const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
    const [attachmentDialog, setAttachmentDialog] = React.useState(false);
    const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
    const [selectedQuotation, setSelectedQuotation] = React.useState<Quotation | null>(null);
    const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 400);
    const { value: debouncedFilters, loading: filtering } = useDebounce<QuotationFilters>(filters, 400);
    React.useEffect(() => {
        setIntro?.(tInvoicing('quotation.plural'), tInvoicing('quotation.card_description'));
        setRoutes?.([
            { title: tCommon('menu.selling'), href: rootPath },
            { title: tInvoicing('quotation.plural'), href: listPath }
        ]);
        setFloating?.(<div className="flex flex-row items-center gap-2">
        {selectedIds.length > 0 && (<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-sm px-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm">
                Plus d&apos;actions <ChevronDown className="ml-2 h-4 w-4 text-zinc-500"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => bulkDownload(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4"/>
                Télécharger {selectedIds.length > 0 ? selectedIds.length : 1} document
                {selectedIds.length > 1 ? 's' : ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkTransformToInvoice(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer">
                <ArrowUpRight className="mr-2 h-4 w-4"/>
                {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkTransformToCustomerOrder(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer">
                <ArrowUpRight className="mr-2 h-4 w-4"/>
                Transformer en Commande Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkTransformToDeliveryNote(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer">
                <ArrowUpRight className="mr-2 h-4 w-4"/>
                Transformer en Bon de Livraison
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkRemoveQuotation(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                <Trash2 className="mr-2 h-4 w-4"/>
                {tCommon('commands.delete')} {selectedIds.length > 0 ? selectedIds.length : 1} document
                {selectedIds.length > 1 ? 's' : ''}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>)}

        <Button className="h-11 rounded-md bg-amber-500 px-5 font-medium text-zinc-950 shadow-sm hover:bg-amber-400" onClick={() => guardedNavigation.push(newPath)}>
          <Plus className="h-4 w-4"/>
          {tInvoicing('quotation.add_button_label')}
        </Button>
      </div>);
        return () => {
            clearIntro?.();
            clearRoutes?.();
            clearFloating?.();
        };
    }, [guardedNavigation, listPath, router.locale, newPath, rootPath, scope, selectedIds, tInvoicing, tCommon]);
    const { isPending: isFetchPending, error, data: quotationsResp, refetch: refetchQuotations } = useQuery({
        queryKey: [
            'quotations',
            page,
            size,
            debouncedSearchTerm,
            debouncedFilters.clientId,
            debouncedFilters.status,
            debouncedFilters.startDate,
            debouncedFilters.endDate,
            debouncedFilters.minTotal,
            debouncedFilters.maxTotal,
            activityType
        ],
        queryFn: () => api.quotation.findPaginated(page, size, 'DESC', 'createdAt', {
            search: debouncedSearchTerm,
            activityType,
            relations: [
                'firm',
                'interlocutor',
                'currency',
                'invoices',
                'deliveryNotes',
                'customerOrders',
                'uploads',
                'uploads.upload'
            ],
            firmId: debouncedFilters.clientId === 'all' ? undefined : Number(debouncedFilters.clientId),
            status: debouncedFilters.status === 'all'
                ? undefined
                : (debouncedFilters.status as QUOTATION_STATUS),
            startDate: debouncedFilters.startDate || undefined,
            endDate: debouncedFilters.endDate || undefined,
            minTotal: debouncedFilters.minTotal === '' ? undefined : Number(debouncedFilters.minTotal),
            maxTotal: debouncedFilters.maxTotal === '' ? undefined : Number(debouncedFilters.maxTotal)
        })
    });
    const { data: firms = [], isPending: isFetchFirmsPending } = useQuery({
        queryKey: ['quotation-firm-choices', activityType],
        queryFn: () => api.firm.findChoices([], 'clients'),
        staleTime: 60000
    });
    const quotations = React.useMemo(() => quotationsResp?.data || [], [quotationsResp]);
    const totalPageCount = quotationsResp?.meta.pageCount || 0;
    const totalResultCount = quotationsResp?.meta.itemCount || 0;
    React.useEffect(() => {
        setSelectedIds((current) => current.filter((id) => quotations.some((quotation) => quotation.id === id)));
    }, [quotations]);
    React.useEffect(() => {
        if (totalPageCount > 0 && page > totalPageCount) {
            setPage(totalPageCount);
        }
    }, [page, totalPageCount]);
    const hasActiveFilters = searchTerm.trim() !== '' ||
        filters.clientId !== 'all' ||
        filters.status !== 'all' ||
        filters.startDate !== '' ||
        filters.endDate !== '' ||
        filters.minTotal !== '' ||
        filters.maxTotal !== '';
    const handleFilterChange = <K extends keyof QuotationFilters>(key: K, value: QuotationFilters[K]) => {
        setPage(1);
        setFilters((current) => ({
            ...current,
            [key]: value
        }));
    };
    const handleSearchChange = (value: string) => {
        setPage(1);
        setSearchTerm(value);
    };
    const handleResetFilters = () => {
        setPage(1);
        setSearchTerm('');
        setFilters(INITIAL_FILTERS);
    };
    const setManagedQuotation = React.useCallback((quotation: Quotation) => {
        if (!quotation.id)
            return false;
        quotationManager.set('id', quotation.id);
        quotationManager.set('sequential', quotation.sequential || '');
        quotationManager.set('status', quotation.status || QUOTATION_STATUS.Nonexistent);
        return true;
    }, [quotationManager]);
    const { mutate: removeQuotation, isPending: isDeletePending } = useMutation({
        mutationFn: (id: number) => api.quotation.remove(id),
        onSuccess: () => {
            if (quotations.length === 1 && page > 1)
                setPage(page - 1);
            toast.success(tInvoicing('quotation.action_remove_success'));
            refetchQuotations();
            setDeleteDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_remove_failure')));
        }
    });
    const { mutate: duplicateQuotation, isPending: isDuplicationPending } = useMutation({
        mutationFn: (duplicateQuotationDto: DuplicateQuotationDto) => api.quotation.duplicate(duplicateQuotationDto),
        onSuccess: async (data) => {
            toast.success(tInvoicing('quotation.action_duplicate_success'));
            await guardedNavigation.push(`${detailPathPrefix}/${data.id}`);
            setDuplicateDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_duplicate_failure')));
        }
    });
    const { mutate: downloadQuotation, isPending: isDownloadPending } = useMutation({
        mutationFn: (data: {
            id: number;
            template: string;
        }) => api.quotation.download(data.id, data.template),
        onSuccess: () => {
            toast.success(tInvoicing('quotation.action_download_success'));
            setDownloadDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_download_failure')));
        }
    });
    const closePreviewDialog = () => {
        setPreviewDialog(false);
        setPreviewBlob(null);
    };
    const { mutate: loadQuotationPreview, isPending: isPreviewPending } = useMutation({
        mutationFn: (id: number) => api.quotation.preview(id, 'template1'),
        onSuccess: (blob) => {
            setPreviewBlob(blob);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_preview_failure')));
            closePreviewDialog();
        }
    });
    const { mutate: loadLinkedDocumentPreview, isPending: isLinkedPreviewPending } = useMutation({
        mutationFn: (data: {
            type: string;
            id: number;
        }) => {
            switch (data.type) {
                case 'invoice':
                    return api.invoice.preview(data.id, 'template1');
                case 'delivery-note':
                    return api.deliveryNote.preview(data.id, 'template1');
                case 'customer-order':
                    return api.customerOrder.preview(data.id, 'template1');
                default:
                    return api.quotation.preview(data.id, 'template1');
            }
        },
        onSuccess: (blob) => {
            setPreviewBlob(blob);
            setPreviewDialog(true);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_preview_failure')));
        }
    });
    const handleDownloadWithAttachments = async (quotation: Quotation) => {
        try {
            if (!quotation.id)
                return;
            // Download Quotation PDF
            await api.quotation.download(quotation.id, 'template1');
            // Download all attachments
            if (quotation.uploads && quotation.uploads.length > 0) {
                for (const u of quotation.uploads) {
                    if (u.upload?.slug) {
                        // Small delay to ensure browser handles multiple downloads
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        await api.upload.downloadFile(u.upload.slug, u.upload.filename);
                    }
                }
            }
            toast.success(tInvoicing('quotation.action_download_success'));
        }
        catch (error: any) {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_download_failure')));
        }
    };
    const { mutate: updateStatus, isPending: isUpdateStatusPending } = useMutation({
        mutationFn: (data: {
            id: number;
            status: QUOTATION_STATUS;
        }) => api.quotation.updateStatus(data.id, data.status),
        onSuccess: () => {
            toast.success(tInvoicing('quotation.action_update_success'));
            setStatusDialog(false);
            refetchQuotations();
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_update_failure')));
        }
    });
    const { mutate: invoiceQuotation, isPending: isInvoicingPending } = useMutation({
        mutationFn: (data: {
            id?: number;
            createInvoice: boolean;
        }) => api.quotation.invoice(data.id, data.createInvoice),
        onSuccess: (data) => {
            toast.success(invoiceLabels.t('action_create_success'));
            refetchQuotations();
            router.push(`${linkedInvoicePathPrefix}/${data.invoices[data.invoices.length - 1].id}`);
        },
        onError: (error) => {
            const message = getErrorMessage('invoicing', error, invoiceLabels.t('action_create_failure'));
            toast.error(message);
        }
    });
    const { mutate: toDeliveryNote, isPending: isDeliveryNotePending } = useMutation({
        mutationFn: (id: number) => api.deliveryNote.saveFromQuotation(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.deliveryNote.success'));
            router.push(`/selling/delivery-note/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.deliveryNote.failure')));
        }
    });
    const { mutate: toCustomerOrder, isPending: isCustomerOrderPending } = useMutation({
        mutationFn: (id: number) => api.customerOrder.saveFromQuotation(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.customerOrder.success'));
            router.push(`/selling/customer-order/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.customerOrder.failure')));
        }
    });
    const { mutate: toGoodsIssueNote, isPending: isGoodsIssueNotePending } = useMutation({
        mutationFn: (id: number) => api.goodsIssueNote.saveFromQuotation(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.goodsIssueNote.success'));
            router.push(`/selling/goods-issue-note/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.goodsIssueNote.failure')));
        }
    });
    // --- Bulk Actions ---
    const { mutate: bulkRemoveQuotation, isPending: isBulkRemovePending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.quotation.remove(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('quotation.action_remove_success'));
            refetchQuotations();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('quotation.action_remove_failure')));
        }
    });
    const { mutate: bulkTransformToInvoice, isPending: isBulkInvoicePending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.quotation.invoice(id, true);
            }
        },
        onSuccess: () => {
            toast.success(invoiceLabels.t('action_create_success'));
            refetchQuotations();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, invoiceLabels.t('action_create_failure')));
        }
    });
    const { mutate: bulkTransformToCustomerOrder, isPending: isBulkCOPending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.customerOrder.saveFromQuotation(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_create_success'));
            refetchQuotations();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_create_failure')));
        }
    });
    const { mutate: bulkTransformToDeliveryNote, isPending: isBulkDNPending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.deliveryNote.saveFromQuotation(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('deliveryNote.action_create_success'));
            refetchQuotations();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_create_failure')));
        }
    });
    const { mutate: bulkDownload, isPending: isBulkDownloadPending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.quotation.download(id, 'template1');
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('quotation.action_download_success'));
        }
    });
    const isPending = isBulkRemovePending ||
        isBulkInvoicePending ||
        isBulkCOPending ||
        isBulkDNPending ||
        isBulkDownloadPending ||
        isFetchPending ||
        isFetchFirmsPending ||
        isDeletePending ||
        isDuplicationPending ||
        isDownloadPending ||
        isInvoicingPending ||
        isDeliveryNotePending ||
        isCustomerOrderPending ||
        isGoodsIssueNotePending ||
        searching ||
        filtering ||
        !commonReady ||
        !invoicingReady;
    const pageIds = quotations
        .map((quotation) => quotation.id)
        .filter((id): id is number => typeof id === 'number');
    const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const isPartiallySelected = pageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;
    if (error)
        return 'An error has occurred: ' + error.message;
    return (<>
      <QuotationDeleteDialog id={quotationManager?.id} sequential={quotationManager?.sequential || ''} open={deleteDialog} deleteQuotation={() => {
            quotationManager?.id && removeQuotation(quotationManager?.id);
        }} isDeletionPending={isDeletePending} onClose={() => setDeleteDialog(false)}/>
      <QuotationStatusDialog open={statusDialog} quotation={selectedQuotation} isPending={isUpdateStatusPending} callback={(status) => {
            if (selectedQuotation?.id) {
                updateStatus({ id: selectedQuotation.id, status });
            }
        }} onClose={() => setStatusDialog(false)}/>
      <DocumentPreviewDialog open={previewDialog} loading={isPreviewPending} previewBlob={previewBlob} filename={`${selectedQuotation?.sequential || `quotation-${selectedQuotation?.id || 'preview'}`}.pdf`} title={tCommon('commands.preview')} onClose={closePreviewDialog}/>
      <QuotationDetailsDialog open={detailsDialog} onClose={() => setDetailsDialog(false)} quotation={selectedQuotation} detailPathPrefix={detailPathPrefix} scope={scope} onPreview={() => {
            if (!selectedQuotation)
                return;
            setPreviewBlob(null);
            setPreviewDialog(true);
            loadQuotationPreview(selectedQuotation.id!);
        }} onDownload={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setDownloadDialog(true);
        }} onDuplicate={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setDuplicateDialog(true);
        }} onStatusChange={() => {
            if (!selectedQuotation)
                return;
            setStatusDialog(true);
        }} onDelete={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setDeleteDialog(true);
        }} onInvoice={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setInvoiceDialog(true);
        }} onCustomerOrder={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setCustomerOrderDialog(true);
        }} onDeliveryNote={() => {
            if (!selectedQuotation || !setManagedQuotation(selectedQuotation))
                return;
            setDeliveryNoteDialog(true);
        }} onEmail={() => {
            if (!selectedQuotation)
                return;
            setEmailDialog(true);
        }} onWhatsApp={() => {
            if (!selectedQuotation)
                return;
            setWhatsAppDialog(true);
        }} onAttachment={() => {
            if (!selectedQuotation)
                return;
            setAttachmentDialog(true);
        }} onLinkedDocumentPreview={(type, id) => loadLinkedDocumentPreview({ type, id })}/>
      <QuotationEmailDialog open={emailDialog} onClose={() => setEmailDialog(false)} quotation={selectedQuotation}/>
      <QuotationWhatsAppDialog open={whatsAppDialog} onClose={() => setWhatsAppDialog(false)} quotation={selectedQuotation}/>
      <QuotationAttachmentDialog open={attachmentDialog} onClose={() => setAttachmentDialog(false)} quotation={selectedQuotation}/>
      <QuotationDuplicateDialog id={quotationManager?.id || 0} sequential={quotationManager?.sequential || ''} open={duplicateDialog} duplicateQuotation={(includeFiles: boolean) => {
            quotationManager?.id &&
                duplicateQuotation({
                    id: quotationManager?.id,
                    includeFiles
                });
        }} isDuplicationPending={isDuplicationPending} onClose={() => setDuplicateDialog(false)}/>
      <QuotationDownloadDialog id={quotationManager?.id || 0} open={downloadDialog} downloadQuotation={(template: string) => {
            quotationManager?.id && downloadQuotation({ id: quotationManager?.id, template });
        }} isDownloadPending={isDownloadPending} onClose={() => setDownloadDialog(false)}/>
      {<QuotationInvoiceDialog id={quotationManager?.id || 0} status={quotationManager?.status} sequential={quotationManager?.sequential} open={invoiceDialog} isInvoicePending={isInvoicingPending} invoice={(id: number, createInvoice: boolean) => {
                invoiceQuotation({ id, createInvoice });
            }} onClose={() => setInvoiceDialog(false)}/>}
      <QuotationActionDialog id={quotationManager?.id} action={`${tCommon('commands.transform_to')} ${tInvoicing('deliveryNote.singular')}`} sequential={quotationManager?.sequential || ''} open={deliveryNoteDialog} callback={() => quotationManager?.id && toDeliveryNote(quotationManager.id)} isCallbackPending={isDeliveryNotePending} onClose={() => setDeliveryNoteDialog(false)}/>
      <QuotationActionDialog id={quotationManager?.id} action={`${tCommon('commands.transform_to')} ${tInvoicing('customerOrder.singular')}`} sequential={quotationManager?.sequential || ''} open={customerOrderDialog} callback={() => quotationManager?.id && toCustomerOrder(quotationManager.id)} isCallbackPending={isCustomerOrderPending} onClose={() => setCustomerOrderDialog(false)}/>
      <QuotationActionDialog id={quotationManager?.id} action={`${tCommon('commands.transform_to')} ${tInvoicing('goodsIssueNote.singular')}`} sequential={quotationManager?.sequential || ''} open={goodsIssueNoteDialog} callback={() => quotationManager?.id && toGoodsIssueNote(quotationManager.id)} isCallbackPending={isGoodsIssueNotePending} onClose={() => setGoodsIssueNoteDialog(false)}/>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-5 pb-5', className)}>
        <section className={cn(panelClassName, 'p-4')}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_180px_auto]">
            <div className="space-y-2">
              <p className={labelClassName}>{partnerLabel}</p>
              <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)}>
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
              <p className={labelClassName}>{tInvoicing('quotation.attributes.status')}</p>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {QUOTATION_STATUS_OPTIONS.map((status) => (<SelectItem key={status} value={status}>
                      {tInvoicing(status)}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-end gap-2">
              {hasActiveFilters && (<Button variant="outline" className="h-10 rounded-sm px-4" onClick={handleResetFilters}>
                  {tCommon('commands.reset')}
                </Button>)}
              <Button variant="outline" className="h-10 w-14 rounded-sm" onClick={() => setIsAdvancedFiltersOpen((current) => !current)}>
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

        <section className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col')}>
          {selectedIds.length > 0 && (<div className="flex shrink-0 items-center justify-between bg-blue-50/50 dark:bg-blue-950/30 px-4 py-2 text-sm border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {selectedIds.length} élément{selectedIds.length > 1 ? 's' : ''} sélectionné
                  {selectedIds.length > 1 ? 's' : ''}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button type="button" onClick={() => setSelectedIds(pageIds)} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Sélectionner tous les éléments de la recherche
                </button>
              </div>
              <button type="button" onClick={() => setSelectedIds([])} className="p-1 rounded-sm text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors" aria-label="Effacer la sélection">
                <X className="h-4 w-4"/>
              </button>
            </div>)}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <th className="w-14 px-4 py-3.5">
                    <Checkbox checked={isPartiallySelected ? 'indeterminate' : isAllPageSelected} disabled={pageIds.length === 0} className="border-zinc-400 dark:border-zinc-700" onCheckedChange={(checked) => {
            if (checked === true) {
                setSelectedIds(pageIds);
                return;
            }
            setSelectedIds([]);
        }}/>
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('quotation.attributes.number')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('quotation.attributes.customer')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('quotation.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('quotation.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && quotations.length > 0 ? (quotations.map((quotation) => {
            const quotationId = quotation.id || 0;
            const isSelected = quotationId > 0 && selectedIds.includes(quotationId);
            return (<tr key={quotationId || quotation.sequential} className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60">
                        <td className="px-4 py-4 align-middle">
                          <Checkbox checked={isSelected} disabled={!quotationId} className="border-zinc-400 dark:border-zinc-700" onCheckedChange={(checked) => {
                    if (!quotationId)
                        return;
                    setSelectedIds((current) => {
                        if (checked === true) {
                            return current.includes(quotationId)
                                ? current
                                : [...current, quotationId];
                        }
                        return current.filter((id) => id !== quotationId);
                    });
                }}/>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <button type="button" className="font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50 text-left" onClick={() => guardedNavigation.push(`${detailPathPrefix}/${quotation.id}`)}>
                              {quotation.sequential || '-'}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {quotation.date
                    ? format(parseISO(quotation.date), 'dd MMM yyyy - HH:mm', {
                        locale: dateLocale
                    })
                    : '-'}
                            </span>
                            {quotation.dueDate && (<span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('quotation.attributes.due_date')}:{' '}
                                {format(parseISO(quotation.dueDate), 'dd MMM yyyy - HH:mm', {
                        locale: dateLocale
                    })}
                              </span>)}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <User2 className={cn('h-4 w-4 shrink-0', mutedTextClassName)}/>
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {quotation.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {quotation.interlocutor
                    ? `${quotation.interlocutor.surname || ''} ${quotation.interlocutor.name || ''}`.trim()
                    : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', getStatusBadgeClassName(quotation.status))}>
                              {quotation.status ? tInvoicing(quotation.status) : '-'}
                            </span>

                            {/* Linked Document Badges */}
                            {quotation.invoices?.some((inv) => inv.status !== INVOICE_STATUS.Draft) && (<span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                {invoiceLabels.plural}
                              </span>)}
                            {quotation.deliveryNotes?.some((dn) => dn.status !== DELIVERY_NOTE_STATUS.Draft) && (<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                                {tInvoicing('quotation.status.delivered')}
                              </span>)}
                            {quotation.customerOrders?.some((co) => co.status !== CUSTOMER_ORDER_STATUS.Draft) && (<span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {tInvoicing('quotation.status.ordered')}
                              </span>)}

                            {/* Validated Indicator (Checkmark) */}
                            {(quotation.status === QUOTATION_STATUS.Accepted ||
                    quotation.status === QUOTATION_STATUS.Invoiced ||
                    quotation.status === QUOTATION_STATUS.Delivered ||
                    quotation.status === QUOTATION_STATUS.Ordered ||
                    quotation.invoices?.some((inv) => inv.status !== INVOICE_STATUS.Draft) ||
                    quotation.deliveryNotes?.some((dn) => dn.status !== DELIVERY_NOTE_STATUS.Draft) ||
                    quotation.customerOrders?.some((co) => co.status !== CUSTOMER_ORDER_STATUS.Draft)) && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/>}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right align-middle font-medium text-zinc-950 dark:text-zinc-50">
                          {formatQuotationAmount(quotation, numberLocale)}
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => {
                    setSelectedQuotation(quotation);
                    setPreviewBlob(null);
                    setPreviewDialog(true);
                    loadQuotationPreview(quotation.id!);
                }}>
                              <Eye className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => guardedNavigation.push(`${detailPathPrefix}/${quotation.id}`)}>
                              <PencilLine className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => {
                    setSelectedQuotation(quotation);
                    setStatusDialog(true);
                }}>
                              <RefreshCw className="h-4 w-4"/>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
                                  <MoreHorizontal className="h-4 w-4"/>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setPreviewBlob(null);
                    setPreviewDialog(true);
                    loadQuotationPreview(quotation.id!);
                }}>
                                  <Eye className="h-4 w-4 mr-2"/> {tCommon('commands.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setDetailsDialog(true);
                }}>
                                  <ExternalLink className="h-4 w-4 mr-2"/> Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => guardedNavigation.push(`${detailPathPrefix}/${quotation.id}`)}>
                                  <Edit className="h-4 w-4 mr-2"/> {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                {<>
                                    {/* If ANY linked document exists, we only show "Voir..." for those that exist and hide the "Transformer..." options */}
                                    {(quotation.invoices?.length || 0) +
                        (quotation.customerOrders?.length || 0) +
                        (quotation.deliveryNotes?.length || 0) >
                        0 ? (<>
                                        {quotation.invoices && quotation.invoices.length > 0 && (<DropdownMenuItem onClick={() => {
                                setSelectedQuotation(quotation);
                                setDetailsDialog(true);
                            }}>
                                            <ExternalLink className="h-4 w-4 mr-2"/>
                                            {`${tCommon('commands.view')} ${invoiceLabels.singular}`}
                                          </DropdownMenuItem>)}

                                        {quotation.customerOrders &&
                            quotation.customerOrders.length > 0 && (<DropdownMenuItem onClick={() => {
                                setSelectedQuotation(quotation);
                                setDetailsDialog(true);
                            }}>
                                              <ExternalLink className="h-4 w-4 mr-2"/>
                                              {tInvoicing('quotation.view_created_customer_order')}
                                            </DropdownMenuItem>)}

                                        {quotation.deliveryNotes &&
                            quotation.deliveryNotes.length > 0 && (<DropdownMenuItem onClick={() => {
                                setSelectedQuotation(quotation);
                                setDetailsDialog(true);
                            }}>
                                              <ExternalLink className="h-4 w-4 mr-2"/>
                                              {tInvoicing('quotation.view_created_delivery_note')}
                                            </DropdownMenuItem>)}
                                      </>) : (
                    /* If NO linked document exists, show all transformation options */
                    <>
                                        <DropdownMenuItem onClick={() => {
                            if (!setManagedQuotation(quotation))
                                return;
                            setInvoiceDialog(true);
                        }}>
                                          <FileText className="h-4 w-4 mr-2"/>
                                          {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                            if (!setManagedQuotation(quotation))
                                return;
                            setCustomerOrderDialog(true);
                        }}>
                                          <ShoppingCart className="h-4 w-4 mr-2"/> Transformer en
                                          Commande Client
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                            if (!setManagedQuotation(quotation))
                                return;
                            setDeliveryNoteDialog(true);
                        }}>
                                          <Truck className="h-4 w-4 mr-2"/> Transformer en Bon de
                                          Livraison
                                        </DropdownMenuItem>
                                      </>)}
                                  </>}
                                <DropdownMenuItem onClick={() => {
                    if (!setManagedQuotation(quotation))
                        return;
                    setDownloadDialog(true);
                }}>
                                  <Download className="h-4 w-4 mr-2"/> {tCommon('commands.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setEmailDialog(true);
                }}>
                                  <Mail className="h-4 w-4 mr-2"/> Envoyer par email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setWhatsAppDialog(true);
                }}>
                                  <MessageCircle className="h-4 w-4 mr-2 text-green-500"/> Envoyer
                                  par WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setStatusDialog(true);
                }}>
                                  <RefreshCw className="h-4 w-4 mr-2"/> {tCommon('actions.changeStatus')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    if (!setManagedQuotation(quotation))
                        return;
                    setDuplicateDialog(true);
                }}>
                                  <Copy className="h-4 w-4 mr-2"/> Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedQuotation(quotation);
                    setAttachmentDialog(true);
                }}>
                                  <Paperclip className="h-4 w-4 mr-2"/> {tCommon('actions.manageAttachments')}
                                </DropdownMenuItem>
                                {quotation.uploads && quotation.uploads.length > 0 && (<DropdownMenuItem onClick={() => handleDownloadWithAttachments(quotation)}>
                                    <Paperclip className="h-4 w-4 mr-2"/> {tCommon('commands.download_with_attachments')}
                                    jointes
                                  </DropdownMenuItem>)}
                                <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50" onClick={() => {
                    if (!setManagedQuotation(quotation))
                        return;
                    setDeleteDialog(true);
                }}>
                                  <Trash2 className="h-4 w-4 mr-2 text-rose-600"/> {tCommon('commands.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>);
        })) : (<tr>
                    <td colSpan={6} className="h-[360px] px-4 py-10 text-center">
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
                  <SelectTrigger className="h-10 w-[92px] rounded-md border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
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
