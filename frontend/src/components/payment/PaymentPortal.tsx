import React from 'react';
import { format, parseISO, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Search,
  Settings2,
  Trash2,
  User2,
  Eye
} from 'lucide-react';
import { api } from '@/api';
import { useDebounce } from '@/hooks/other/useDebounce';
import { getErrorMessage } from '@/utils/errors';
import { useTranslation } from 'react-i18next';
import { type BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { ACTIVITY_TYPE, Payment, PAYMENT_MODE, PAYMENT_COLLECTION_STATUS } from '@/types';
import { getPaymentStatusClassName, getPaymentStatusTranslationKey } from '@/utils/payment.utils';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Spinner } from '@/components/shared/Spinner';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { usePaymentReceiptPdf } from '@/components/payment/hooks/usePaymentReceiptPdf';
import { PaymentAttachmentsDrawer } from '@/components/payment/attachments';
import { cn } from '@/lib/utils';
import { PaymentActionIconButton } from './list/PaymentActionIconButton';
import { PaymentBulkActionsBar } from './list/PaymentBulkActionsBar';
import { getPaymentEditPath, getPaymentNewPath } from './utils/payment-navigation';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';
interface PaymentPortalProps {
  breadcrumbRoutes?: BreadcrumbRoute[];
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  listPath?: string;
  managePageChrome?: boolean;
  newPath?: string;
  rootPath?: string;
  scope?: 'selling' | 'buying' | 'all';
  detailPathPrefix?: string;
}
interface PaymentFilters {
  activityType: string;
  contactId: string;
  mode: string;
  status: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}
interface FilterDateFieldProps {
  label: string;
  locale: Locale;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}
const INITIAL_FILTERS: PaymentFilters = {
  activityType: 'all',
  contactId: 'all',
  mode: 'all',
  status: '__all__',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: ''
};
const panelClassName =
  'rounded-md border border-zinc-200 bg-white shadow-sm shadow-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none';
const fieldClassName =
  'h-9 rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-800 dark:text-zinc-200';
const textClassName = 'text-zinc-700 dark:text-zinc-300';
const mutedTextClassName = 'text-zinc-500 dark:text-zinc-400';
function FilterDateField({ label, locale, onChange, placeholder, value }: FilterDateFieldProps) {
  const selectedDate = value ? parseISO(value) : undefined;
  return (
    <div className="space-y-2">
      <p className={labelClassName}>{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 px-3 text-left text-sm transition hover:border-zinc-300 dark:hover:border-zinc-700',
              fieldClassName,
              !value ? 'text-zinc-400 dark:text-zinc-500' : textClassName
            )}
          >
            <Calendar className={cn('h-4 w-4', mutedTextClassName)} />
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            locale={locale}
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : '');
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
const getModeBadgeClassName = (mode?: PAYMENT_MODE) => {
  switch (mode) {
    case PAYMENT_MODE.CreditNoteSettlement:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case PAYMENT_MODE.Cash:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case PAYMENT_MODE.CreditCard:
      return 'border-primary/30 bg-primary/10 text-foreground dark:text-zinc-100';
    case PAYMENT_MODE.BillOfExchange:
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
    case PAYMENT_MODE.Check:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
    case PAYMENT_MODE.BankTransfer:
    case PAYMENT_MODE.WireTransfer:
      return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
    default:
      return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
  }
};
const formatPaymentAmount = (
  amount: number | undefined,
  digitAfterComma: number | undefined,
  symbol: string | undefined,
  localeCode: string
) => {
  const digits = digitAfterComma ?? 2;
  const formatted = Number(amount ?? 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${formatted} ${symbol || ''}`.trim();
};
const getAmountBadgeClassName = (activityType: ACTIVITY_TYPE, mode?: PAYMENT_MODE) => {
  if (mode === PAYMENT_MODE.CreditNoteSettlement || activityType === ACTIVITY_TYPE.SELLING) {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
};
const formatSignedPaymentAmount = (
  amount: number | undefined,
  digitAfterComma: number | undefined,
  symbol: string | undefined,
  localeCode: string,
  activityType: ACTIVITY_TYPE,
  mode?: PAYMENT_MODE
) => {
  const normalizedAmount = Number(amount ?? 0);
  const sign =
    normalizedAmount === 0
      ? ''
      : activityType === ACTIVITY_TYPE.BUYING && mode !== PAYMENT_MODE.CreditNoteSettlement
        ? '- '
        : '+ ';
  return `${sign}${formatPaymentAmount(normalizedAmount, digitAfterComma, symbol, localeCode)}`;
};

const getActivityScope = (scope?: 'selling' | 'buying' | 'all') => {
  if (scope === 'buying') return ACTIVITY_TYPE.BUYING;
  if (scope === 'selling') return ACTIVITY_TYPE.SELLING;
  return undefined;
};

const getPaymentActivityType = (
  payment: Payment,
  fallbackActivityType?: ACTIVITY_TYPE
): ACTIVITY_TYPE =>
  payment.activityType === ACTIVITY_TYPE.BUYING
    ? ACTIVITY_TYPE.BUYING
    : fallbackActivityType || ACTIVITY_TYPE.SELLING;

const getPaymentDetailPath = (
  payment: Payment,
  fallbackPrefix: string,
  fallbackActivityType?: ACTIVITY_TYPE
) => {
  void fallbackPrefix;
  void fallbackActivityType;
  return getPaymentEditPath(payment.id);
};

const getDirectionBadgeClassName = (payment: Payment) => {
  if (payment.mode === PAYMENT_MODE.CreditNoteSettlement) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
  }

  return getPaymentActivityType(payment) === ACTIVITY_TYPE.BUYING
    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
};

const getDirectionTranslationKey = (payment: Payment) => {
  if (payment.mode === PAYMENT_MODE.CreditNoteSettlement) {
    return 'payment.attachments.direction_credit_note';
  }

  return getPaymentActivityType(payment) === ACTIVITY_TYPE.BUYING
    ? 'payment.attachments.direction_buying'
    : 'payment.attachments.direction_selling';
};

export const PaymentPortal: React.FC<PaymentPortalProps> = ({
  breadcrumbRoutes,
  className,
  firmId,
  interlocutorId,
  scope = 'selling',
  rootPath = '/selling',
  listPath = '/selling/payments',
  managePageChrome = true,
  newPath = getPaymentNewPath('selling'),
  detailPathPrefix = '/payments'
}) => {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();
  const { t: tCommon, ready: commonReady, i18n } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
  const receiptPdf = usePaymentReceiptPdf();
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const scopedActivityType = getActivityScope(scope);
  const isUnifiedScope = scope === 'all';
  const partnerLabel = isUnifiedScope
    ? tCommon('words.contact')
    : scopedActivityType === ACTIVITY_TYPE.BUYING
      ? tInvoicing('payment.attributes.supplier')
      : tInvoicing('payment.attributes.customer');
  const partnerPlaceholder = isUnifiedScope
    ? tCommon('filters.search_contact')
    : scopedActivityType === ACTIVITY_TYPE.BUYING
      ? tCommon('filters.search_supplier')
      : tCommon('filters.search_customer');
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState<PaymentFilters>({
    ...INITIAL_FILTERS,
    contactId: firmId ? String(firmId) : INITIAL_FILTERS.contactId
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [paymentToDeleteId, setPaymentToDeleteId] = React.useState<number>();
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [attachmentsPayment, setAttachmentsPayment] = React.useState<Payment | null>(null);
  const { value: debouncedSearchTerm, loading: searching } = useDebounce(searchTerm, 400);
  const { value: debouncedFilters, loading: filtering } = useDebounce(filters, 400);
  const selectedActivityType =
    scopedActivityType ??
    (debouncedFilters.activityType === 'all'
      ? undefined
      : (debouncedFilters.activityType as ACTIVITY_TYPE));

  React.useEffect(() => {
    if (breadcrumbRoutes) {
      setRoutes?.(breadcrumbRoutes);
    }

    if (!managePageChrome) {
      return () => {
        if (breadcrumbRoutes) clearRoutes?.();
      };
    }

    setIntro?.(tInvoicing('payment.plural'), tInvoicing('payment.card_description'));
    if (!breadcrumbRoutes) {
      setRoutes?.(
        scope === 'all'
          ? [{ title: tInvoicing('payment.plural'), href: listPath }]
          : [
              {
                title: scope === 'buying' ? tCommon('menu.buying') : tCommon('menu.selling'),
                href: rootPath
              },
              { title: tInvoicing('payment.plural'), href: listPath }
            ]
      );
    }
    setFloating?.(
      <Button
        className="h-9 rounded-sm px-4 shadow-sm"
        onClick={() => guardedNavigation.push(newPath)}
      >
        <Plus className="h-4 w-4" />
        {tInvoicing('payment.add_button_label')}
      </Button>
    );
    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [
    breadcrumbRoutes,
    clearFloating,
    clearIntro,
    clearRoutes,
    guardedNavigation,
    listPath,
    managePageChrome,
    newPath,
    rootPath,
    router,
    scope,
    setFloating,
    setIntro,
    setRoutes,
    tCommon,
    tInvoicing
  ]);
  const {
    isPending: isFetchPending,
    error,
    data: paymentsResp,
    refetch: refetchPayments
  } = useQuery({
    queryKey: [
      'payments',
      page,
      size,
      debouncedSearchTerm,
      debouncedFilters.contactId,
      debouncedFilters.mode,
      debouncedFilters.status,
      debouncedFilters.startDate,
      debouncedFilters.endDate,
      debouncedFilters.minAmount,
      debouncedFilters.maxAmount,
      debouncedFilters.activityType,
      selectedActivityType,
      scope,
      firmId,
      interlocutorId
    ],
    queryFn: () =>
      api.payment.findPaginated(
        page,
        size,
        'DESC',
        'createdAt',
        debouncedSearchTerm,
        ['currency', 'firm'],
        firmId ||
          (debouncedFilters.contactId === 'all' ? undefined : Number(debouncedFilters.contactId)),
        interlocutorId,
        {
          activityType: selectedActivityType,
          mode:
            debouncedFilters.mode === 'all' ? undefined : (debouncedFilters.mode as PAYMENT_MODE),
          collectionStatus:
            debouncedFilters.status === '__all__'
              ? undefined
              : (debouncedFilters.status as PAYMENT_COLLECTION_STATUS),
          startDate: debouncedFilters.startDate || undefined,
          endDate: debouncedFilters.endDate || undefined,
          minAmount:
            debouncedFilters.minAmount === '' ? undefined : Number(debouncedFilters.minAmount),
          maxAmount:
            debouncedFilters.maxAmount === '' ? undefined : Number(debouncedFilters.maxAmount)
        }
      )
  });
  const { data: firms = [], isPending: isFetchFirmsPending } = useQuery({
    queryKey: ['payment-firm-choices', scope, scopedActivityType],
    queryFn: () =>
      api.firm.findChoices(
        [],
        scopedActivityType === ACTIVITY_TYPE.BUYING
          ? 'suppliers'
          : scopedActivityType === ACTIVITY_TYPE.SELLING
            ? 'clients'
            : undefined
      ),
    staleTime: 60000,
    enabled: !firmId
  });
  const payments = React.useMemo(() => paymentsResp?.data || [], [paymentsResp]);
  const totalPageCount = paymentsResp?.meta.pageCount || 0;
  const totalResultCount = paymentsResp?.meta.itemCount || 0;
  React.useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => payments.some((payment) => payment.id === id))
    );
  }, [payments]);
  React.useEffect(() => {
    if (totalPageCount > 0 && page > totalPageCount) {
      setPage(totalPageCount);
    }
  }, [page, totalPageCount]);
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (isUnifiedScope && filters.activityType !== 'all') ||
    (!firmId && filters.contactId !== 'all') ||
    filters.mode !== 'all' ||
    filters.status !== '__all__' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.minAmount !== '' ||
    filters.maxAmount !== '';
  const handleFilterChange = <K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) => {
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
    setFilters({
      ...INITIAL_FILTERS,
      activityType: 'all',
      contactId: firmId ? String(firmId) : INITIAL_FILTERS.contactId
    });
  };
  const setManagedPayment = React.useCallback(
    (payment: Payment) => {
      if (!payment.id) return false;
      setPaymentToDeleteId(payment.id);
      return true;
    },
    []
  );
  const { mutate: removePayment, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.payment.remove(id),
    onSuccess: () => {
      if (payments.length === 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('payment.action_remove_success'));
      refetchPayments();
      setDeleteDialog(false);
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('invoicing', mutationError, tInvoicing('payment.action_remove_failure'))
      );
    }
  });
  const { mutate: removeSelectedPayments, isPending: isBulkDeletePending } = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.payment.remove(id)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      return { failureCount, successCount, totalCount: results.length };
    },
    onSuccess: ({ failureCount, successCount }) => {
      if (successCount > 0) {
        toast.success(tInvoicing('payment.bulk.remove_success', { count: successCount }));
      }

      if (failureCount > 0) {
        toast.error(tInvoicing('payment.bulk.remove_partial_failure', { count: failureCount }));
      }

      if (successCount > 0 && payments.length <= successCount && page > 1) {
        setPage(page - 1);
      }

      if (successCount > 0) {
        setSelectedIds([]);
      }
      setBulkDeleteDialog(false);
      refetchPayments();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage(
          'invoicing',
          mutationError,
          tInvoicing('payment.bulk.remove_failure')
        )
      );
    }
  });
  const isPending =
    isFetchPending ||
    isFetchFirmsPending ||
    isDeletePending ||
    isBulkDeletePending ||
    searching ||
    filtering ||
    !commonReady ||
    !invoicingReady;
  const pageIds = payments
    .map((payment) => payment.id)
    .filter((id): id is number => typeof id === 'number');
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const isPartiallySelected = pageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;
  if (error) {
    return 'An error has occurred: ' + (error instanceof Error ? error.message : '');
  }
  return (
    <>
      <GenericDeleteDialog
        id={paymentToDeleteId}
        sequential={paymentToDeleteId ? `PAY${paymentToDeleteId}` : undefined}
        documentLabel="le paiement"
        open={deleteDialog}
        onDelete={() => {
          paymentToDeleteId && removePayment(paymentToDeleteId);
        }}
        isPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle>{tInvoicing('payment.bulk.remove_title')}</DialogTitle>
            <DialogDescription>
              {tInvoicing('payment.bulk.remove_confirmation', { count: selectedIds.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-sm"
              disabled={isBulkDeletePending}
              onClick={() => setBulkDeleteDialog(false)}
            >
              {tCommon('commands.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-sm"
              disabled={isBulkDeletePending || selectedIds.length === 0}
              onClick={() => removeSelectedPayments(selectedIds)}
            >
              {isBulkDeletePending ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              {tInvoicing('payment.bulk.remove_selected')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog
        open={receiptPdf.previewOpen}
        loading={receiptPdf.isPreviewPending}
        previewBlob={receiptPdf.previewBlob}
        filename={receiptPdf.previewFilename}
        title={tInvoicing('payment.receipt.title')}
        closeLabel={tCommon('commands.close')}
        downloadLabel={tInvoicing('payment.receipt.download_full')}
        printLabel={tInvoicing('payment.receipt.print')}
        onClose={receiptPdf.closePreview}
      />
      <PaymentAttachmentsDrawer
        open={!!attachmentsPayment}
        payment={attachmentsPayment}
        scope={
          getPaymentActivityType(attachmentsPayment || {}) === ACTIVITY_TYPE.BUYING
            ? 'buying'
            : 'selling'
        }
        receiptActionPending={receiptPdf.isReceiptActionPending}
        onOpenChange={(open) => {
          if (!open) setAttachmentsPayment(null);
        }}
        onPreviewReceipt={receiptPdf.previewReceipt}
        onDownloadReceipt={receiptPdf.downloadReceipt}
      />

      <div className={cn('flex min-h-0 flex-1 flex-col gap-6 pb-6', className)}>
        <section className={cn(panelClassName, 'p-4')}>
          <div
            className={cn(
              'grid items-end gap-3',
              isUnifiedScope
                ? 'xl:grid-cols-[minmax(220px,1.35fr)_minmax(170px,190px)_minmax(220px,1.1fr)_minmax(120px,150px)_minmax(120px,150px)_auto]'
                : 'xl:grid-cols-[minmax(240px,1.4fr)_minmax(220px,1.2fr)_minmax(120px,160px)_minmax(120px,160px)_auto]'
            )}
          >
            <div className="space-y-2">
              <p className={labelClassName}>{tCommon('filters.search')}</p>
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
                  placeholder={tCommon('filters.search_payments')}
                  className={cn(fieldClassName, 'pl-10')}
                />
              </div>
            </div>

            {isUnifiedScope && (
              <div className="space-y-2">
                <p className={labelClassName}>{tInvoicing('payment.activity_filter.label')}</p>
                <Select
                  value={filters.activityType}
                  onValueChange={(value) => handleFilterChange('activityType', value)}
                >
                  <SelectTrigger className={fieldClassName}>
                    <SelectValue placeholder={tInvoicing('payment.activity_filter.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tInvoicing('payment.activity_filter.all')}</SelectItem>
                    <SelectItem value={ACTIVITY_TYPE.SELLING}>
                      {tInvoicing('payment.activity_filter.selling')}
                    </SelectItem>
                    <SelectItem value={ACTIVITY_TYPE.BUYING}>
                      {tInvoicing('payment.activity_filter.buying')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <p className={labelClassName}>{partnerLabel}</p>
              <Select
                value={filters.contactId}
                onValueChange={(value) => handleFilterChange('contactId', value)}
                disabled={!!firmId}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={partnerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {firms.map((firm) => (
                    <SelectItem key={firm.id} value={String(firm.id)}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>{tInvoicing('payment.attributes.mode')}</p>
              <Select
                value={filters.mode}
                onValueChange={(value) => handleFilterChange('mode', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tCommon('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                  {Object.values(PAYMENT_MODE).map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {tInvoicing(mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>
                {tSettings('treasury_checks_and_drafts.filters.status')}
              </p>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue
                    placeholder={tSettings('treasury_checks_and_drafts.placeholders.all_statuses')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    {tSettings('treasury_checks_and_drafts.placeholders.all_statuses')}
                  </SelectItem>
                  {Object.values(PAYMENT_COLLECTION_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-3 py-1 text-xs font-semibold',
                          getPaymentStatusClassName(status)
                        )}
                      >
                        {tSettings(getPaymentStatusTranslationKey(status))}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-end gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="h-9 rounded-sm px-4"
                  onClick={handleResetFilters}
                >
                  {tCommon('commands.reset')}
                </Button>
              )}
              <Button
                variant="outline"
                className="h-9 w-16 rounded-sm"
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
            <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 xl:grid-cols-4">
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
                <p className={labelClassName}>{tCommon('filters.min_amount')}</p>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(event) => handleFilterChange('minAmount', event.target.value)}
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
                  value={filters.maxAmount}
                  onChange={(event) => handleFilterChange('maxAmount', event.target.value)}
                  placeholder="0.00"
                  className={fieldClassName}
                />
              </div>
            </div>
          )}
        </section>

        <section className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
          {selectedIds.length > 0 && (
            <PaymentBulkActionsBar
              actionsLabel={tCommon('commands.actions')}
              clearLabel={tInvoicing('payment.bulk.clear_selection')}
              removeLabel={tInvoicing('payment.bulk.remove_selected')}
              selectedCount={selectedIds.length}
              selectedCountLabel={tInvoicing('payment.bulk.selected_count', {
                count: selectedIds.length
              })}
              onClearSelection={() => setSelectedIds([])}
              onRequestBulkDelete={() => setBulkDeleteDialog(true)}
            />
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                  <th className="w-14 px-4 py-3">
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
                  <th className="px-4 py-3 font-medium">
                    {tInvoicing('payment.attributes.number')}
                  </th>
                  <th className="px-4 py-3 font-medium">{tCommon('words.contact')}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {tInvoicing('payment.attributes.amount')}
                  </th>
                  <th className="px-4 py-3 font-medium">{tInvoicing('payment.attributes.mode')}</th>
                  <th className="px-4 py-3 font-medium">
                    {tSettings('treasury_checks_and_drafts.filters.status')}
                  </th>
                  <th className="w-40 px-4 py-3 text-right font-medium">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isPending && payments.length > 0 ? (
                  payments.map((payment) => {
                    const paymentId = payment.id || 0;
                    const isSelected = paymentId > 0 && selectedIds.includes(paymentId);
                    const rowActivityType = getPaymentActivityType(payment, scopedActivityType);
                    const digits = payment.currency?.digitAfterComma;
                    const symbol = payment.currency?.symbol;
                    return (
                      <tr
                        key={paymentId || payment.createdAt}
                        className={cn(
                          'border-b border-zinc-200/70 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/70',
                          isSelected && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        <td className="px-4 py-3 align-middle">
                          <Checkbox
                            checked={isSelected}
                            disabled={!paymentId}
                            className="border-zinc-400 dark:border-zinc-700"
                            onCheckedChange={(checked) => {
                              if (!paymentId) return;
                              setSelectedIds((current) => {
                                if (checked === true) {
                                  return current.includes(paymentId)
                                    ? current
                                    : [...current, paymentId];
                                }
                                return current.filter((id) => id !== paymentId);
                              });
                            }}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <button
                              type="button"
                            className="text-left font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50"
                              onClick={() =>
                                guardedNavigation.push(
                                  getPaymentDetailPath(payment, detailPathPrefix, scopedActivityType)
                                )
                              }
                            >
                              {payment.id ? `PAY-${payment.id}` : '-'}
                            </button>
                            <span className={cn('text-xs', mutedTextClassName)}>
                              {payment.date
                                ? format(parseISO(payment.date), 'dd MMM yyyy', {
                                    locale: dateLocale
                                  })
                                : '-'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <User2 className={cn('h-4 w-4 shrink-0', mutedTextClassName)} />
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {payment.firm?.name || '-'}
                              </span>
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {payment.currency?.code || tInvoicing('payment.empty_cells.currency')}
                              </span>
                              {isUnifiedScope && (
                                <span
                                  className={cn(
                                    'mt-1 inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                                    getDirectionBadgeClassName(payment)
                                  )}
                                >
                                  {tInvoicing(getDirectionTranslationKey(payment))}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right align-middle">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={cn(
                                'inline-flex rounded-md px-2 py-1 text-xs font-semibold',
                                getAmountBadgeClassName(rowActivityType, payment.mode)
                              )}
                            >
                              {formatSignedPaymentAmount(
                                payment.amount,
                                digits,
                                symbol,
                                numberLocale,
                                rowActivityType,
                                payment.mode
                              )}
                            </span>
                            {Number(payment.fee || 0) > 0 && (
                              <span className={cn('text-xs', mutedTextClassName)}>
                                {tInvoicing('payment.attributes.fee')}:{' '}
                                {formatPaymentAmount(payment.fee, digits, symbol, numberLocale)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              getModeBadgeClassName(payment.mode)
                            )}
                          >
                            {payment.mode ? tInvoicing(payment.mode) : '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          {payment.collectionStatus ? (
                            <span
                              className={cn(
                                'inline-flex rounded-md border px-3 py-1 text-xs font-semibold',
                                getPaymentStatusClassName(payment.collectionStatus)
                              )}
                            >
                              {tSettings(getPaymentStatusTranslationKey(payment.collectionStatus))}
                            </span>
                          ) : (
                            <span className={cn('text-xs', mutedTextClassName)}>-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <PaymentActionIconButton
                              label={tInvoicing('payment.receipt.view')}
                              disabled={!payment.id || receiptPdf.isReceiptActionPending}
                              onClick={() => receiptPdf.previewReceipt(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </PaymentActionIconButton>
                            <PaymentActionIconButton
                              label={tInvoicing('payment.attachments.action')}
                              disabled={!payment.id}
                              onClick={() => setAttachmentsPayment(payment)}
                            >
                              <Paperclip className="h-4 w-4" />
                            </PaymentActionIconButton>
                            <PaymentActionIconButton
                              label={tCommon('commands.open')}
                              disabled={!payment.id}
                              onClick={() =>
                                guardedNavigation.push(
                                  getPaymentDetailPath(payment, detailPathPrefix, scopedActivityType)
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </PaymentActionIconButton>
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
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  disabled={!payment.id || receiptPdf.isReceiptActionPending}
                                  onClick={() => receiptPdf.downloadReceipt(payment)}
                                >
                                  <Download className="h-4 w-4" />
                                  {tInvoicing('payment.receipt.download')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!payment.id || receiptPdf.isReceiptActionPending}
                                  onClick={() => receiptPdf.printReceipt(payment)}
                                >
                                  <Printer className="h-4 w-4" />
                                  {tInvoicing('payment.receipt.print')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="bg-rose-50 text-rose-600 focus:bg-rose-100 focus:text-rose-700 dark:bg-rose-950/20 dark:focus:bg-rose-950/40"
                                  onClick={() => {
                                    if (!setManagedPayment(payment)) return;
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
                    <td colSpan={7} className="h-[420px] px-4 py-10 text-center">
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

          <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <span className={textClassName}>{tCommon('table.lines')}</span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => {
                    setPage(1);
                    setSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-9 w-[92px] rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className={textClassName}>
                {tCommon('table.page_of', { page, total: totalPageCount })}
              </span>

              <span className={mutedTextClassName}>
                {totalResultCount > 0
                  ? tCommon('table.result_count', { count: totalResultCount })
                  : tCommon('table.no_results_found')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-sm"
                disabled={page <= 1 || isPending}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-sm"
                disabled={totalPageCount === 0 || page >= totalPageCount || isPending}
                onClick={() => setPage((current) => current + 1)}
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
