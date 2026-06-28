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
import { CustomerOrderDuplicateDialog } from './dialogs/CustomerOrderDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { CustomerOrderDeleteDialog } from './dialogs/CustomerOrderDeleteDialog';
import { CustomerOrderDownloadDialog } from './dialogs/CustomerOrderDownloadDialog';
import { useCustomerOrderManager } from './hooks/useCustomerOrderManager';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { ACTIVITY_TYPE, DuplicateCustomerOrderDto, CUSTOMER_ORDER_STATUS, CustomerOrder, INVOICE_STATUS, DELIVERY_NOTE_STATUS } from '@/types';
import { CustomerOrderInvoiceDialog } from './dialogs/CustomerOrderInvoiceDialog';
import { CustomerOrderActionDialog } from './dialogs/CustomerOrderActionDialog';
import { CustomerOrderStatusDialog } from './dialogs/CustomerOrderStatusDialog';
import { CustomerOrderDetailsDialog } from './dialogs/CustomerOrderDetailsDialog';
import { CustomerOrderEmailDialog } from './dialogs/CustomerOrderEmailDialog';
import { CustomerOrderWhatsAppDialog } from './dialogs/CustomerOrderWhatsAppDialog';
import { CustomerOrderAttachmentDialog } from './dialogs/CustomerOrderAttachmentDialog';
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
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface CustomerOrderMainProps {
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
interface CustomerOrderFilters {
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
const INITIAL_FILTERS: CustomerOrderFilters = {
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
const CUSTOMER_ORDER_STATUS_OPTIONS: CUSTOMER_ORDER_STATUS[] = [
    CUSTOMER_ORDER_STATUS.Draft,
    CUSTOMER_ORDER_STATUS.Created,
    CUSTOMER_ORDER_STATUS.Validated,
    CUSTOMER_ORDER_STATUS.Cancelled
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
const getStatusBadgeClassName = (status?: CUSTOMER_ORDER_STATUS) => {
    switch (status) {
        case CUSTOMER_ORDER_STATUS.Validated:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
        case CUSTOMER_ORDER_STATUS.Created:
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
        case CUSTOMER_ORDER_STATUS.Draft:
            return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
        case CUSTOMER_ORDER_STATUS.Cancelled:
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
        default:
            return 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    }
};
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
const formatCustomerOrderAmount = (customerOrder: CustomerOrder, localeCode: string) => {
    const digits = customerOrder.currency?.digitAfterComma ?? 2;
    const amount = Number(customerOrder.total ?? 0).toLocaleString(localeCode, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
    return `${amount} ${customerOrder.currency?.symbol || ''}`.trim();
};
export const CustomerOrderPortal: React.FC<CustomerOrderMainProps> = ({ className, scope = 'selling', rootPath = '/selling', listPath = '/selling/customer-orders', newPath = '/selling/new-customer-order', detailPathPrefix = '/selling/customer-order', linkedInvoicePathPrefix = '/selling/invoice', linkedDeliveryNotePathPrefix = '/selling/delivery-note' }) => {
    const router = useRouter();
    const guardedNavigation = useGuardedNavigation();
    const { t: tCommon, ready: commonReady, i18n } = useTranslation('common');
    const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
    const customerOrderLabels = useScopedDocumentLabels('customerOrder', scope);
    const deliveryNoteLabels = useScopedDocumentLabels('deliveryNote', scope);
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    const customerOrderManager = useCustomerOrderManager();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const activityType = ACTIVITY_TYPE.SELLING;
    const partnerLabel = tInvoicing('customerOrder.attributes.customer');
    const partnerPlaceholder = tCommon('filters.select_customer');
    const allPartnersLabel = tCommon('filters.all_customers');
    const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
    const { setRoutes, clearRoutes } = useBreadcrumb();
    const [page, setPage] = React.useState(1);
    const [size, setSize] = React.useState(20);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState<CustomerOrderFilters>(INITIAL_FILTERS);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [deleteDialog, setDeleteDialog] = React.useState(false);
    const [duplicateDialog, setDuplicateDialog] = React.useState(false);
    const [downloadDialog, setDownloadDialog] = React.useState(false);
    const [invoiceDialog, setInvoiceDialog] = React.useState(false);
    const [deliveryNoteDialog, setDeliveryNoteDialog] = React.useState(false);
    const [statusDialog, setStatusDialog] = React.useState(false);
    const [previewDialog, setPreviewDialog] = React.useState(false);
    const [detailsDialog, setDetailsDialog] = React.useState(false);
    const [emailDialog, setEmailDialog] = React.useState(false);
    const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
    const [attachmentDialog, setAttachmentDialog] = React.useState(false);
    const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
    const [previewFilename, setPreviewFilename] = React.useState('document-preview.pdf');
    const [selectedCustomerOrder, setSelectedCustomerOrder] = React.useState<CustomerOrder | null>(null);
    const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 400);
    const { value: debouncedFilters, loading: filtering } = useDebounce<CustomerOrderFilters>(filters, 400);
    React.useEffect(() => {
        setIntro?.(customerOrderLabels.plural, customerOrderLabels.cardDescription);
        setRoutes?.([
            { title: tCommon('menu.selling'), href: rootPath },
            { title: customerOrderLabels.plural, href: listPath }
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

              <DropdownMenuItem onClick={() => bulkTransformToDeliveryNote(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer">
                <ArrowUpRight className="mr-2 h-4 w-4"/>
                {`${tCommon('commands.transform_to')} ${deliveryNoteLabels.singular}`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkRemoveCustomerOrder(selectedIds)} disabled={selectedIds.length === 0} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                <Trash2 className="mr-2 h-4 w-4"/>
                {tCommon('commands.delete')} {selectedIds.length > 0 ? selectedIds.length : 1} document
                {selectedIds.length > 1 ? 's' : ''}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>)}

        <Button className="h-11 rounded-md bg-amber-500 px-5 font-medium text-zinc-950 shadow-sm hover:bg-amber-400" onClick={() => guardedNavigation.push(newPath)}>
          <Plus className="h-4 w-4"/>
          {customerOrderLabels.addButtonLabel}
        </Button>
      </div>);
        return () => {
            clearIntro?.();
            clearRoutes?.();
            clearFloating?.();
        };
    }, [
        customerOrderLabels.addButtonLabel,
        customerOrderLabels.cardDescription,
        customerOrderLabels.plural,
        deliveryNoteLabels.singular,
        guardedNavigation,
        invoiceLabels.singular,
        listPath,
        newPath,
        rootPath,
        scope,
        selectedIds,
        tCommon
    ]);
    const { isPending: isFetchPending, error, data: customerOrdersResp, refetch: refetchCustomerOrders } = useQuery({
        queryKey: [
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
        queryFn: () => api.customerOrder.findPaginated(page, size, 'DESC', 'createdAt', {
            search: debouncedSearchTerm,
            activityType,
            relations: [
                'firm',
                'interlocutor',
                'currency',
                'invoices',
                'deliveryNotes',
                'uploads',
                'uploads.upload'
            ],
            firmId: debouncedFilters.clientId === 'all' ? undefined : Number(debouncedFilters.clientId),
            status: debouncedFilters.status === 'all'
                ? undefined
                : (debouncedFilters.status as CUSTOMER_ORDER_STATUS),
            startDate: debouncedFilters.startDate || undefined,
            endDate: debouncedFilters.endDate || undefined,
            minTotal: debouncedFilters.minTotal === '' ? undefined : Number(debouncedFilters.minTotal),
            maxTotal: debouncedFilters.maxTotal === '' ? undefined : Number(debouncedFilters.maxTotal)
        })
    });
    const { data: firms = [], isPending: isFetchFirmsPending } = useQuery({
        queryKey: ['customerOrder-firm-choices', activityType],
        queryFn: () => api.firm.findChoices([], 'clients'),
        staleTime: 60000
    });
    const customerOrders = React.useMemo(() => customerOrdersResp?.data || [], [customerOrdersResp]);
    const totalPageCount = customerOrdersResp?.meta.pageCount || 0;
    const totalResultCount = customerOrdersResp?.meta.itemCount || 0;
    React.useEffect(() => {
        setSelectedIds((current) => current.filter((id) => customerOrders.some((customerOrder) => customerOrder.id === id)));
    }, [customerOrders]);
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
    const handleFilterChange = <K extends keyof CustomerOrderFilters>(key: K, value: CustomerOrderFilters[K]) => {
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
    const setManagedCustomerOrder = React.useCallback((customerOrder: CustomerOrder) => {
        if (!customerOrder.id)
            return false;
        customerOrderManager.set('id', customerOrder.id);
        customerOrderManager.set('sequential', customerOrderLabels.displayNumber(customerOrder));
        customerOrderManager.set('status', customerOrder.status || CUSTOMER_ORDER_STATUS.Nonexistent);
        return true;
    }, [customerOrderLabels, customerOrderManager]);
    const { mutate: removeCustomerOrder, isPending: isDeletePending } = useMutation({
        mutationFn: (id: number) => api.customerOrder.remove(id),
        onSuccess: () => {
            if (customerOrders.length === 1 && page > 1)
                setPage(page - 1);
            toast.success(tInvoicing('customerOrder.action_remove_success'));
            refetchCustomerOrders();
            setDeleteDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_remove_failure')));
        }
    });
    const { mutate: duplicateCustomerOrder, isPending: isDuplicationPending } = useMutation({
        mutationFn: (duplicateCustomerOrderDto: DuplicateCustomerOrderDto) => api.customerOrder.duplicate(duplicateCustomerOrderDto),
        onSuccess: async (data) => {
            toast.success(tInvoicing('customerOrder.action_duplicate_success'));
            await guardedNavigation.push(`${detailPathPrefix}/${data.id}`);
            setDuplicateDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_duplicate_failure')));
        }
    });
    const { mutate: downloadCustomerOrder, isPending: isDownloadPending } = useMutation({
        mutationFn: (data: {
            id: number;
            template: string;
        }) => api.customerOrder.download(data.id, data.template),
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_download_success'));
            setDownloadDialog(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_download_failure')));
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
    const runAfterOverlayClose = React.useCallback((closeCurrent: () => void, callback: () => void) => {
        blurActiveElement();
        closeCurrent();
        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(callback);
            });
            return;
        }
        callback();
    }, [blurActiveElement]);
    const closeCustomerOrderDetailsThen = React.useCallback((callback: () => void) => runAfterOverlayClose(() => setDetailsDialog(false), callback), [runAfterOverlayClose]);
    const { mutate: loadCustomerOrderPreview, isPending: isPreviewPending } = useMutation({
        mutationFn: (id: number) => api.customerOrder.preview(id, 'template1'),
        onSuccess: (blob) => {
            setPreviewBlob(blob);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_preview_failure')));
            closePreviewDialog();
        }
    });
    const { mutate: loadDocumentPreview, isPending: isLinkedPreviewPending } = useMutation({
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
                    return api.customerOrder.preview(data.id, 'template1');
            }
        },
        onSuccess: (blob) => {
            setPreviewBlob(blob);
            setPreviewDialog(true);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_preview_failure')));
        }
    });
    const openLinkedDocumentPreview = React.useCallback((type: string, id: number) => {
        const linkedSequential = type === 'invoice'
            ? invoiceLabels.displayNumber(selectedCustomerOrder?.invoices?.find((invoice) => invoice.id === id))
            : type === 'delivery-note'
                ? deliveryNoteLabels.displayNumber(selectedCustomerOrder?.deliveryNotes?.find((deliveryNote) => deliveryNote.id === id))
                : customerOrderLabels.displayNumber(selectedCustomerOrder);
        setPreviewFilename(`${linkedSequential || `${type}-${id}`}.pdf`);
        setPreviewBlob(null);
        setPreviewDialog(true);
        loadDocumentPreview({ type, id });
    }, [
        customerOrderLabels,
        deliveryNoteLabels,
        invoiceLabels,
        loadDocumentPreview,
        selectedCustomerOrder
    ]);
    const handleDownloadWithAttachments = async (customerOrder: CustomerOrder) => {
        try {
            if (!customerOrder.id)
                return;
            // Download CustomerOrder PDF
            await api.customerOrder.download(customerOrder.id, 'template1');
            // Download all attachments
            if (customerOrder.uploads && customerOrder.uploads.length > 0) {
                for (const u of customerOrder.uploads) {
                    if (u.upload?.slug) {
                        // Small delay to ensure browser handles multiple downloads
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        await api.upload.downloadFile(u.upload.slug, u.upload.filename);
                    }
                }
            }
            toast.success(tInvoicing('customerOrder.action_download_success'));
        }
        catch (error: any) {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_download_failure')));
        }
    };
    const { mutate: updateStatus, isPending: isUpdateStatusPending } = useMutation({
        mutationFn: (data: {
            id: number;
            status: CUSTOMER_ORDER_STATUS;
        }) => api.customerOrder.updateStatus(data.id, data.status),
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_update_success'));
            setStatusDialog(false);
            refetchCustomerOrders();
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_update_failure')));
        }
    });
    const { mutate: invoiceCustomerOrder, isPending: isInvoicingPending } = useMutation({
        mutationFn: (data: {
            id?: number;
            createInvoice: boolean;
        }) => api.customerOrder.invoice(data.id, data.createInvoice),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.invoice.success'));
            refetchCustomerOrders();
            router.push(`${linkedInvoicePathPrefix}/${data.invoices[data.invoices.length - 1].id}`);
        },
        onError: (error) => {
            const message = getErrorMessage('invoicing', error, tInvoicing('transformations.invoice.failure'));
            toast.error(message);
        }
    });
    const { mutate: toDeliveryNote, isPending: isDeliveryNotePending } = useMutation({
        mutationFn: (id: number) => api.deliveryNote.saveFromCustomerOrder(id),
        onSuccess: (data) => {
            toast.success(tInvoicing('transformations.deliveryNote.success'));
            router.push(`${linkedDeliveryNotePathPrefix}/${data.id}`);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('transformations.deliveryNote.failure')));
        }
    });
    // --- Bulk Actions ---
    const { mutate: bulkRemoveCustomerOrder, isPending: isBulkRemovePending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.customerOrder.remove(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_remove_success'));
            refetchCustomerOrders();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_remove_failure')));
        }
    });
    const { mutate: bulkTransformToInvoice, isPending: isBulkInvoicePending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.customerOrder.invoice(id, true);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_invoice_success'));
            refetchCustomerOrders();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_invoice_failure')));
        }
    });
    const { mutate: bulkTransformToDeliveryNote, isPending: isBulkDNPending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.deliveryNote.saveFromCustomerOrder(id);
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('deliveryNote.action_create_success'));
            refetchCustomerOrders();
            setSelectedIds([]);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_create_failure')));
        }
    });
    const { mutate: bulkDownload, isPending: isBulkDownloadPending } = useMutation({
        mutationFn: async (ids: number[]) => {
            for (const id of ids) {
                await api.customerOrder.download(id, 'template1');
            }
        },
        onSuccess: () => {
            toast.success(tInvoicing('customerOrder.action_download_success'));
        }
    });
    const isPending = isBulkRemovePending ||
        isBulkInvoicePending ||
        isBulkDNPending ||
        isBulkDownloadPending ||
        isFetchPending ||
        isFetchFirmsPending ||
        isDeletePending ||
        isDuplicationPending ||
        isDownloadPending ||
        isInvoicingPending ||
        isDeliveryNotePending ||
        searching ||
        filtering ||
        !commonReady ||
        !invoicingReady;
    const pageIds = customerOrders
        .map((customerOrder) => customerOrder.id)
        .filter((id): id is number => typeof id === 'number');
    const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const isPartiallySelected = pageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;
    if (error)
        return 'An error has occurred: ' + error.message;
    return (<>
      <CustomerOrderDeleteDialog id={customerOrderManager?.id} sequential={customerOrderManager?.sequential || ''} open={deleteDialog} deleteCustomerOrder={() => {
            customerOrderManager?.id && removeCustomerOrder(customerOrderManager?.id);
        }} isDeletionPending={isDeletePending} scope={scope} onClose={() => setDeleteDialog(false)}/>
      <CustomerOrderStatusDialog open={statusDialog} customerOrder={selectedCustomerOrder} isPending={isUpdateStatusPending} scope={scope} callback={(status) => {
            if (selectedCustomerOrder?.id) {
                updateStatus({ id: selectedCustomerOrder.id, status });
            }
        }} onClose={() => setStatusDialog(false)}/>
      <DocumentPreviewDialog open={previewDialog} loading={isPreviewPending || isLinkedPreviewPending} previewBlob={previewBlob} filename={previewFilename} title={tCommon('commands.preview')} onClose={closePreviewDialog}/>
      <CustomerOrderDetailsDialog open={detailsDialog} onClose={() => setDetailsDialog(false)} customerOrder={selectedCustomerOrder} detailPathPrefix={detailPathPrefix} scope={scope} onPreview={() => {
            if (!selectedCustomerOrder)
                return;
            closeCustomerOrderDetailsThen(() => {
                setPreviewFilename(`${customerOrderLabels.displayNumber(selectedCustomerOrder) || `customerOrder-${selectedCustomerOrder.id || 'preview'}`}.pdf`);
                setPreviewBlob(null);
                setPreviewDialog(true);
                loadCustomerOrderPreview(selectedCustomerOrder.id!);
            });
        }} onDownload={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
            closeCustomerOrderDetailsThen(() => setDownloadDialog(true));
        }} onDuplicate={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
            closeCustomerOrderDetailsThen(() => setDuplicateDialog(true));
        }} onStatusChange={() => {
            if (!selectedCustomerOrder)
                return;
            closeCustomerOrderDetailsThen(() => setStatusDialog(true));
        }} onDelete={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
            closeCustomerOrderDetailsThen(() => setDeleteDialog(true));
        }} onInvoice={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
            closeCustomerOrderDetailsThen(() => setInvoiceDialog(true));
        }} onCustomerOrder={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
        }} onDeliveryNote={() => {
            if (!selectedCustomerOrder || !setManagedCustomerOrder(selectedCustomerOrder))
                return;
            closeCustomerOrderDetailsThen(() => setDeliveryNoteDialog(true));
        }} onEmail={() => {
            if (!selectedCustomerOrder)
                return;
            closeCustomerOrderDetailsThen(() => setEmailDialog(true));
        }} onWhatsApp={() => {
            if (!selectedCustomerOrder)
                return;
            closeCustomerOrderDetailsThen(() => setWhatsAppDialog(true));
        }} onAttachment={() => {
            if (!selectedCustomerOrder)
                return;
            closeCustomerOrderDetailsThen(() => setAttachmentDialog(true));
        }} onLinkedDocumentPreview={openLinkedDocumentPreview}/>
      <CustomerOrderEmailDialog open={emailDialog} onClose={() => setEmailDialog(false)} customerOrder={selectedCustomerOrder} scope={scope}/>
      <CustomerOrderWhatsAppDialog open={whatsAppDialog} onClose={() => setWhatsAppDialog(false)} customerOrder={selectedCustomerOrder} scope={scope}/>
      <CustomerOrderAttachmentDialog open={attachmentDialog} onClose={() => setAttachmentDialog(false)} customerOrder={selectedCustomerOrder} scope={scope}/>
      <CustomerOrderDuplicateDialog id={customerOrderManager?.id || 0} sequential={customerOrderManager?.sequential || ''} open={duplicateDialog} duplicateCustomerOrder={(includeFiles: boolean) => {
            customerOrderManager?.id &&
                duplicateCustomerOrder({
                    id: customerOrderManager?.id,
                    includeFiles
                });
        }} isDuplicationPending={isDuplicationPending} scope={scope} onClose={() => setDuplicateDialog(false)}/>
      <CustomerOrderDownloadDialog id={customerOrderManager?.id || 0} open={downloadDialog} downloadCustomerOrder={(template: string) => {
            customerOrderManager?.id &&
                downloadCustomerOrder({ id: customerOrderManager?.id, template });
        }} isDownloadPending={isDownloadPending} onClose={() => setDownloadDialog(false)}/>
      <CustomerOrderInvoiceDialog id={customerOrderManager?.id || 0} status={customerOrderManager?.status} sequential={customerOrderManager?.sequential} open={invoiceDialog} isInvoicePending={isInvoicingPending} invoice={(id: number, createInvoice: boolean) => {
            invoiceCustomerOrder({ id, createInvoice });
        }} scope={scope} onClose={() => setInvoiceDialog(false)}/>
      <CustomerOrderActionDialog id={customerOrderManager?.id} action={`${tCommon('commands.transform_to')} ${deliveryNoteLabels.singular}`} sequential={customerOrderManager?.sequential || ''} open={deliveryNoteDialog} callback={() => customerOrderManager?.id && toDeliveryNote(customerOrderManager.id)} isCallbackPending={isDeliveryNotePending} scope={scope} onClose={() => setDeliveryNoteDialog(false)}/>
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
              <p className={labelClassName}>{tInvoicing('customerOrder.attributes.status')}</p>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {CUSTOMER_ORDER_STATUS_OPTIONS.map((status) => (<SelectItem key={status} value={status}>
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
                    {tInvoicing('customerOrder.attributes.number')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('customerOrder.attributes.customer')}
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    {tInvoicing('customerOrder.attributes.status')}
                  </th>
                  <th className="px-4 py-3.5 text-right font-medium">
                    {tInvoicing('customerOrder.attributes.total')}
                  </th>
                  <th className="w-32 px-4 py-3.5 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && customerOrders.length > 0 ? (customerOrders.map((customerOrder) => {
            const customerOrderId = customerOrder.id || 0;
            const isSelected = customerOrderId > 0 && selectedIds.includes(customerOrderId);
            return (<tr key={customerOrderId || customerOrder.sequential} className="border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/60">
                        <td className="px-4 py-4 align-middle">
                          <Checkbox checked={isSelected} disabled={!customerOrderId} className="border-zinc-400 dark:border-zinc-700" onCheckedChange={(checked) => {
                    if (!customerOrderId)
                        return;
                    setSelectedIds((current) => {
                        if (checked === true) {
                            return current.includes(customerOrderId)
                                ? current
                                : [...current, customerOrderId];
                        }
                        return current.filter((id) => id !== customerOrderId);
                    });
                }}/>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <button type="button" className="font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50 text-left" onClick={() => guardedNavigation.push(`${detailPathPrefix}/${customerOrder.id}`)}>
                              {customerOrderLabels.displayNumber(customerOrder)}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {customerOrder.date
                    ? format(parseISO(customerOrder.date), 'dd MMM yyyy - HH:mm', {
                        locale: dateLocale
                    })
                    : '-'}
                            </span>
                            {customerOrder.dueDate && (<span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('customerOrder.attributes.due_date')}:{' '}
                                {format(parseISO(customerOrder.dueDate), 'dd MMM yyyy - HH:mm', {
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
                                {customerOrder.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {customerOrder.interlocutor
                    ? `${customerOrder.interlocutor.surname || ''} ${customerOrder.interlocutor.name || ''}`.trim()
                    : tCommon('words.no_interlocutor')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          {(() => {
                    const hasEffectiveInvoice = customerOrder.invoices?.some((invoice) => invoice.status !== INVOICE_STATUS.Draft);
                    const hasEffectiveDelivery = customerOrder.deliveryNotes?.some((deliveryNote) => hasEffectiveCustomerOrderDeliveryStatus(deliveryNote.status));
                    const isEffectivelyValidated = customerOrder.status === CUSTOMER_ORDER_STATUS.Validated ||
                        hasEffectiveInvoice ||
                        hasEffectiveDelivery;
                    const displayStatus = isEffectivelyValidated
                        ? CUSTOMER_ORDER_STATUS.Validated
                        : customerOrder.status;
                    return (<div className="flex items-center gap-2">
                                <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', getStatusBadgeClassName(displayStatus))}>
                                  {displayStatus ? tInvoicing(displayStatus) : '-'}
                                </span>

                                {hasEffectiveInvoice && (<span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                    {tInvoicing('customerOrder.status.invoiced')}
                                  </span>)}
                                {hasEffectiveDelivery && (<span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                                    {tInvoicing('customerOrder.status.delivered')}
                                  </span>)}

                                {isEffectivelyValidated && (<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500"/>)}
                              </div>);
                })()}
                        </td>

                        <td className="px-4 py-4 text-right align-middle font-medium text-zinc-950 dark:text-zinc-50">
                          {formatCustomerOrderAmount(customerOrder, numberLocale)}
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setPreviewFilename(`${customerOrder.sequential || `customerOrder-${customerOrder.id || 'preview'}`}.pdf`);
                    setPreviewBlob(null);
                    setPreviewDialog(true);
                    loadCustomerOrderPreview(customerOrder.id!);
                }}>
                              <Eye className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => guardedNavigation.push(`${detailPathPrefix}/${customerOrder.id}`)}>
                              <PencilLine className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
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
                    setSelectedCustomerOrder(customerOrder);
                    setPreviewFilename(`${customerOrder.sequential || `customerOrder-${customerOrder.id || 'preview'}`}.pdf`);
                    setPreviewBlob(null);
                    setPreviewDialog(true);
                    loadCustomerOrderPreview(customerOrder.id!);
                }}>
                                  <Eye className="h-4 w-4 mr-2"/> {tCommon('commands.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setDetailsDialog(true);
                }}>
                                  <ExternalLink className="h-4 w-4 mr-2"/> Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => guardedNavigation.push(`${detailPathPrefix}/${customerOrder.id}`)}>
                                  <Edit className="h-4 w-4 mr-2"/> {tCommon('commands.edit')}
                                </DropdownMenuItem>
                                <>
                                  {/* If ANY linked document exists, we only show "Voir..." for those that exist and hide the "Transformer..." options */}
                                  {(customerOrder.invoices?.length || 0) +
                    0 +
                    (customerOrder.deliveryNotes?.length || 0) >
                    0 ? (<>
                                      {customerOrder.invoices &&
                        customerOrder.invoices.length > 0 && (<DropdownMenuItem onClick={() => {
                            setSelectedCustomerOrder(customerOrder);
                            setDetailsDialog(true);
                        }}>
                                            <ExternalLink className="h-4 w-4 mr-2"/>
                                            {tInvoicing('customerOrder.view_created_invoice')}
                                          </DropdownMenuItem>)}

                                      {false}

                                      {customerOrder.deliveryNotes &&
                        customerOrder.deliveryNotes.length > 0 && (<DropdownMenuItem onClick={() => {
                            setSelectedCustomerOrder(customerOrder);
                            setDetailsDialog(true);
                        }}>
                                            <ExternalLink className="h-4 w-4 mr-2"/>
                                            {tInvoicing('customerOrder.view_created_delivery_note')}
                                          </DropdownMenuItem>)}
                                    </>) : (
                /* If NO linked document exists, show all transformation options */
                <>
                                      <DropdownMenuItem onClick={() => {
                        if (!setManagedCustomerOrder(customerOrder))
                            return;
                        setInvoiceDialog(true);
                    }}>
                                        <FileText className="h-4 w-4 mr-2"/>
                                        {`${tCommon('commands.transform_to')} ${invoiceLabels.singular}`}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                        if (!setManagedCustomerOrder(customerOrder))
                            return;
                        setDeliveryNoteDialog(true);
                    }}>
                                        <Truck className="h-4 w-4 mr-2"/>
                                        {`${tCommon('commands.transform_to')} ${deliveryNoteLabels.singular}`}
                                      </DropdownMenuItem>
                                    </>)}
                                </>
                                <DropdownMenuItem onClick={() => {
                    if (!setManagedCustomerOrder(customerOrder))
                        return;
                    setDownloadDialog(true);
                }}>
                                  <Download className="h-4 w-4 mr-2"/> {tCommon('commands.download_pdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setEmailDialog(true);
                }}>
                                  <Mail className="h-4 w-4 mr-2"/> Envoyer par email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setWhatsAppDialog(true);
                }}>
                                  <MessageCircle className="h-4 w-4 mr-2 text-green-500"/> Envoyer
                                  par WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setStatusDialog(true);
                }}>
                                  <RefreshCw className="h-4 w-4 mr-2"/> {tCommon('actions.changeStatus')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    if (!setManagedCustomerOrder(customerOrder))
                        return;
                    setDuplicateDialog(true);
                }}>
                                  <Copy className="h-4 w-4 mr-2"/> Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                    setSelectedCustomerOrder(customerOrder);
                    setAttachmentDialog(true);
                }}>
                                  <Paperclip className="h-4 w-4 mr-2"/> {tCommon('actions.manageAttachments')}
                                </DropdownMenuItem>
                                {customerOrder.uploads && customerOrder.uploads.length > 0 && (<DropdownMenuItem onClick={() => handleDownloadWithAttachments(customerOrder)}>
                                    <Paperclip className="h-4 w-4 mr-2"/> {tCommon('commands.download_with_attachments')}
                                    jointes
                                  </DropdownMenuItem>)}
                                <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50" onClick={() => {
                    if (!setManagedCustomerOrder(customerOrder))
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
